using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using VisionXPro.Application.Interfaces;
using VisionXPro.Domain.Entities;
using VisionXPro.Persistence;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "CorporateOwner,SuperAdmin")]
    public class CorporateController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;
        private readonly PasswordHasher<User> _passwordHasher;

        public CorporateController(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
            _passwordHasher = new PasswordHasher<User>();
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var orgId = _tenantService.GetOrganizationId();

            var branches = await _context.Branches
                .Where(b => b.OrganizationId == orgId && !b.IsDeleted)
                .ToListAsync();

            var totalCustomers = await _context.Customers
                .CountAsync(c => c.OrganizationId == orgId && !c.IsDeleted);

            var totalRevenue = await _context.Transactions
                .Where(t => t.OrganizationId == orgId && t.TransactionType == "Satış Tahsilatı")
                .SumAsync(t => t.Amount);

            var totalOrders = await _context.Orders
                .CountAsync(o => o.OrganizationId == orgId);

            var totalStock = await _context.InventoryItems
                .Where(i => i.OrganizationId == orgId)
                .SumAsync(i => i.Quantity);

            var branchStats = new List<object>();
            foreach (var branch in branches)
            {
                var branchRevenue = await _context.Transactions
                    .Where(t => t.OrganizationId == orgId && t.BranchId == branch.Id && t.TransactionType == "Satış Tahsilatı")
                    .SumAsync(t => t.Amount);

                var branchOrders = await _context.Orders
                    .CountAsync(o => o.OrganizationId == orgId && o.BranchId == branch.Id);

                branchStats.Add(new {
                    branchId = branch.Id,
                    branchName = branch.Name,
                    city = branch.City,
                    revenue = branchRevenue,
                    orderCount = branchOrders
                });
            }

            return Ok(new {
                totalBranches = branches.Count,
                totalCustomers,
                totalRevenue,
                totalOrders,
                totalStock,
                branches = branchStats
            });
        }

        [HttpGet("transfers")]
        public async Task<IActionResult> GetTransfers()
        {
            var orgId = _tenantService.GetOrganizationId();

            var transfers = await _context.Transfers
                .Where(t => t.OrganizationId == orgId)
                .OrderByDescending(t => t.TransferDate)
                .ToListAsync();

            var branchDict = await _context.Branches
                .Where(b => b.OrganizationId == orgId)
                .ToDictionaryAsync(b => b.Id, b => b.Name);

            var result = transfers.Select(t => new {
                t.Id,
                fromBranch = branchDict.GetValueOrDefault(t.FromBranchId, "Bilinmeyen"),
                toBranch = branchDict.GetValueOrDefault(t.ToBranchId, "Bilinmeyen"),
                fromBranchId = t.FromBranchId,
                toBranchId = t.ToBranchId,
                productId = t.ProductId,
                productName = t.ProductName ?? "Ürün",
                quantity = t.Quantity,
                t.Status,
                t.TransferDate,
                t.CreatedAt
            });

            return Ok(result);
        }

        [HttpGet("branches")]
        public async Task<IActionResult> GetBranches()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branches = await _context.Branches
                .Where(b => b.OrganizationId == orgId && !b.IsDeleted)
                .Select(b => new { b.Id, b.Name, b.City, b.District })
                .ToListAsync();
            return Ok(branches);
        }

        [HttpGet("inventory")]
        public async Task<IActionResult> GetOrgInventory([FromQuery] Guid? branchId)
        {
            var orgId = _tenantService.GetOrganizationId();
            var query = from inv in _context.InventoryItems
                        where inv.OrganizationId == orgId && inv.Quantity > 0 && !inv.IsDeleted
                        join prod in _context.Products on inv.ProductId equals prod.Id
                        where !prod.IsDeleted
                        select new { inv, prod };

            if (branchId.HasValue && branchId.Value != Guid.Empty)
                query = query.Where(x => x.inv.BranchId == branchId.Value);

            var items = await query.Select(x => new
            {
                productId = x.prod.Id,
                branchId = x.inv.BranchId,
                name = x.prod.Name,
                barcode = x.prod.Barcode,
                quantity = x.inv.Quantity,
                salePrice = x.prod.SalePrice
            }).ToListAsync();

            return Ok(items);
        }

        [HttpPost("transfers")]
        public async Task<IActionResult> CreateTransfer([FromBody] CreateTransferRequest req)
        {
            var orgId = _tenantService.GetOrganizationId();
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            if (req.FromBranchId == req.ToBranchId)
                return BadRequest(new { message = "Çıkış ve varış şubesi aynı olamaz." });
            if (req.Quantity <= 0)
                return BadRequest(new { message = "Miktar 0'dan büyük olmalı." });

            var fromInv = await _context.InventoryItems.FirstOrDefaultAsync(i =>
                i.OrganizationId == orgId && i.BranchId == req.FromBranchId
                && i.ProductId == req.ProductId && !i.IsDeleted);
            if (fromInv == null || fromInv.Quantity < req.Quantity)
                return BadRequest(new { message = "Kaynak şubede yeterli stok yok." });

            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == req.ProductId && p.OrganizationId == orgId);
            if (product == null) return BadRequest(new { message = "Ürün bulunamadı." });

            var transfer = new Transfer
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                FromBranchId = req.FromBranchId,
                ToBranchId = req.ToBranchId,
                ProductId = req.ProductId,
                ProductName = product.Name,
                Quantity = req.Quantity,
                Status = "Bekliyor",
                RequestedBy = userId.Value,
                TransferDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _context.Transfers.Add(transfer);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Transfer talebi oluşturuldu.", id = transfer.Id });
        }

        [HttpPut("transfers/{id}/approve")]
        public async Task<IActionResult> ApproveTransfer(Guid id)
        {
            var orgId = _tenantService.GetOrganizationId();
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var transfer = await _context.Transfers.FirstOrDefaultAsync(t =>
                t.Id == id && t.OrganizationId == orgId && !t.IsDeleted);
            if (transfer == null) return NotFound();
            if (transfer.Status != "Bekliyor")
                return BadRequest(new { message = "Bu transfer zaten işlenmiş." });
            if (!transfer.ProductId.HasValue)
                return BadRequest(new { message = "Ürün bilgisi eksik." });

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var fromInv = await _context.InventoryItems.FirstOrDefaultAsync(i =>
                    i.OrganizationId == orgId && i.BranchId == transfer.FromBranchId
                    && i.ProductId == transfer.ProductId.Value);
                if (fromInv == null || fromInv.Quantity < transfer.Quantity)
                    return BadRequest(new { message = "Kaynak stok yetersiz." });

                fromInv.Quantity -= transfer.Quantity;

                var toInv = await _context.InventoryItems.FirstOrDefaultAsync(i =>
                    i.OrganizationId == orgId && i.BranchId == transfer.ToBranchId
                    && i.ProductId == transfer.ProductId.Value);

                if (toInv == null)
                {
                    toInv = new InventoryItem
                    {
                        Id = Guid.NewGuid(),
                        OrganizationId = orgId,
                        BranchId = transfer.ToBranchId,
                        ProductId = transfer.ProductId.Value,
                        Quantity = transfer.Quantity,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.InventoryItems.Add(toInv);
                }
                else
                {
                    toInv.Quantity += transfer.Quantity;
                }

                transfer.Status = "Onaylandı";
                transfer.ApprovedBy = userId;
                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new { message = "Transfer onaylandı, stok güncellendi." });
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return StatusCode(500, new { message = "Transfer onaylanamadı.", details = ex.Message });
            }
        }

        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees()
        {
            var orgId = _tenantService.GetOrganizationId();

            var employees = await _context.Users
                .Where(u => u.OrganizationId == orgId && !u.IsDeleted && u.Role != "CorporateOwner")
                .Select(u => new {
                    u.Id,
                    u.FullName,
                    u.Email,
                    role = u.JobTitle ?? u.Role,
                    u.Role,
                    u.JobTitle,
                    u.IsActive,
                    u.CreatedAt,
                    branchName = _context.Branches.Where(b => b.Id == u.BranchId).Select(b => b.Name).FirstOrDefault() ?? "Atanmamış",
                    branchId = u.BranchId
                })
                .ToListAsync();

            return Ok(employees);
        }

        [HttpPost("employees")]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateCorporateEmployeeRequest req)
        {
            var orgId = _tenantService.GetOrganizationId();
            if (string.IsNullOrWhiteSpace(req.FullName) || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { message = "Ad soyad, e-posta ve şifre zorunludur." });

            var branch = await _context.Branches.FirstOrDefaultAsync(b =>
                b.Id == req.BranchId && b.OrganizationId == orgId && !b.IsDeleted);
            if (branch == null)
                return BadRequest(new { message = "Geçersiz şube seçimi." });

            if (await _context.Users.AnyAsync(u => u.Email == req.Email.Trim() && !u.IsDeleted))
                return BadRequest(new { message = "Bu e-posta adresi zaten kayıtlı." });

            var staffRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "ShopStaff");
            if (staffRole == null)
                return BadRequest(new { message = "ShopStaff rolü bulunamadı." });

            var user = new User
            {
                FullName = req.FullName.Trim(),
                Email = req.Email.Trim().ToLowerInvariant(),
                OrganizationId = orgId,
                BranchId = req.BranchId,
                RoleId = staffRole.Id,
                Role = "ShopStaff",
                JobTitle = string.IsNullOrWhiteSpace(req.JobTitle) ? "Satış Danışmanı" : req.JobTitle.Trim(),
                IsActive = true
            };
            user.PasswordHash = _passwordHasher.HashPassword(user, req.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Personel eklendi.", id = user.Id });
        }

        [HttpPost("branches")]
        public async Task<IActionResult> CreateBranch([FromBody] CreateCorporateBranchRequest req)
        {
            var orgId = _tenantService.GetOrganizationId();
            if (string.IsNullOrWhiteSpace(req.Name))
                return BadRequest(new { message = "Şube adı zorunludur." });

            var branch = new Branch
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                Name = req.Name.Trim(),
                City = string.IsNullOrWhiteSpace(req.City) ? null : req.City.Trim(),
                District = string.IsNullOrWhiteSpace(req.District) ? null : req.District.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Şube oluşturuldu.", id = branch.Id, name = branch.Name });
        }

        private Guid? GetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public class CreateTransferRequest
    {
        public Guid FromBranchId { get; set; }
        public Guid ToBranchId { get; set; }
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class CreateCorporateEmployeeRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public Guid BranchId { get; set; }
        public string? JobTitle { get; set; }
    }

    public class CreateCorporateBranchRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? City { get; set; }
        public string? District { get; set; }
    }
}
