using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using VisionXPro.Api.Services;
using VisionXPro.Domain.Entities;
using VisionXPro.Persistence;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "SuperAdmin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;

        public AdminController(AppDbContext context)
        {
            _context = context;
            _passwordHasher = new PasswordHasher<User>();
        }

        // GET /api/admin/organizations
        [HttpGet("organizations")]
        public async Task<IActionResult> GetAllOrganizations()
        {
            var organizations = await _context.Organizations
                .Where(o => !o.IsDeleted)
                .Select(o => new {
                    o.Id,
                    o.Name,
                    o.TaxNumber,
                    o.IsActive,
                    o.SubscriptionPlan,
                    o.LicenseStartDate,
                    o.LicenseEndDate,
                    o.IsTrial,
                    BranchCount = _context.Branches.Count(b => b.OrganizationId == o.Id && !b.IsDeleted),
                    CustomerCount = _context.Customers.Count(c => c.OrganizationId == o.Id && !c.IsDeleted),
                    UserCount = _context.Users.Count(u => u.OrganizationId == o.Id && !u.IsDeleted)
                })
                .OrderByDescending(o => o.LicenseEndDate)
                .ToListAsync();

            return Ok(organizations);
        }

        // POST /api/admin/organizations
        [HttpPost("organizations")]
        public async Task<IActionResult> CreateOrganization([FromBody] CreateOrgRequest request)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var isCorporate = string.Equals(request.AccountType, "Corporate", StringComparison.OrdinalIgnoreCase);
                var roleName = isCorporate ? "CorporateOwner" : "ShopOwner";
                var ownerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
                if (ownerRole == null)
                    return BadRequest(new { message = $"Sistem hatası: '{roleName}' rolü bulunamadı." });

                var org = new Organization
                {
                    Name = request.Name,
                    TaxNumber = request.TaxNumber,
                    SubscriptionPlan = isCorporate ? (request.SubscriptionPlan ?? "Kurumsal") : request.SubscriptionPlan,
                    LicenseStartDate = request.LicenseStartDate ?? DateTime.UtcNow,
                    LicenseEndDate = request.LicenseEndDate ?? DateTime.UtcNow.AddYears(1),
                    IsTrial = request.IsTrial,
                    IsActive = true
                };
                _context.Organizations.Add(org);
                await _context.SaveChangesAsync();

                var mainBranch = new Branch
                {
                    Name = "Merkez Şube",
                    OrganizationId = org.Id,
                    City = request.City ?? "Merkez",
                    District = string.IsNullOrWhiteSpace(request.District) ? null : request.District.Trim()
                };
                _context.Branches.Add(mainBranch);
                await _context.SaveChangesAsync();

                var adminUser = new User
                {
                    FullName = isCorporate ? "Kurumsal Yönetici" : "Shop Admin",
                    Email = request.AdminEmail,
                    OrganizationId = org.Id,
                    BranchId = mainBranch.Id,
                    RoleId = ownerRole.Id,
                    Role = roleName,
                    IsActive = true
                };
                adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, request.AdminPassword);
                _context.Users.Add(adminUser);

                var adminUserId = GetCurrentUserId();
                _context.AuditLogs.Add(new AuditLog {
                    UserId = adminUserId,
                    TableName = "Organizations",
                    Action = $"Yeni mağaza oluşturuldu: {org.Name}",
                    Timestamp = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Mağaza başarıyla oluşturuldu.", orgId = org.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Mağaza oluşturulurken hata oluştu.", details = ex.Message });
            }
        }

        // PUT /api/admin/organizations/{id}
        [HttpPut("organizations/{id}")]
        public async Task<IActionResult> UpdateOrganization(Guid id, [FromBody] UpdateOrgRequest request)
        {
            var org = await _context.Organizations.FindAsync(id);
            if (org == null) return NotFound(new { message = "Mağaza bulunamadı." });

            org.Name = request.Name ?? org.Name;
            org.TaxNumber = request.TaxNumber ?? org.TaxNumber;
            org.SubscriptionPlan = request.SubscriptionPlan ?? org.SubscriptionPlan;
            org.LicenseEndDate = request.LicenseEndDate ?? org.LicenseEndDate;
            org.IsActive = request.IsActive ?? org.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Mağaza bilgileri güncellendi." });
        }

        // DELETE /api/admin/organizations/{id}
        [HttpDelete("organizations/{id}")]
        public async Task<IActionResult> DeleteOrganization(Guid id)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var org = await _context.Organizations.FindAsync(id);
                if (org == null || org.IsDeleted)
                    return NotFound(new { message = "Mağaza bulunamadı." });

                org.IsDeleted = true;
                org.IsActive = false;

                var branches = await _context.Branches.Where(b => b.OrganizationId == id && !b.IsDeleted).ToListAsync();
                foreach (var b in branches) b.IsDeleted = true;

                var users = await _context.Users.Where(u => u.OrganizationId == id && !u.IsDeleted).ToListAsync();
                foreach (var u in users) { u.IsActive = false; u.IsDeleted = true; }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = "Mağaza silindi." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Silme hatası.", details = ex.Message });
            }
        }

        // POST /api/admin/organizations/{id}/branches
        [HttpPost("organizations/{id}/branches")]
        public async Task<IActionResult> AddBranch(Guid id, [FromBody] AddBranchRequest request)
        {
            var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted);
            if (org == null) return NotFound(new { message = "Organizasyon bulunamadı." });
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Şube adı zorunludur." });

            var branch = new Branch
            {
                Id = Guid.NewGuid(),
                OrganizationId = id,
                Name = request.Name.Trim(),
                City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim(),
                District = string.IsNullOrWhiteSpace(request.District) ? null : request.District.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Şube eklendi.", branchId = branch.Id, branchName = branch.Name });
        }

        // POST /api/admin/organizations/{id}/toggle-license
        [HttpPost("organizations/{id}/toggle-license")]
        public async Task<IActionResult> ToggleLicense(Guid id)
        {
            var org = await _context.Organizations.FindAsync(id);
            if (org == null) return NotFound(new { message = "Mağaza bulunamadı." });

            org.IsActive = !org.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { message = org.IsActive ? "Lisans aktifleştirildi." : "Lisans askıya alındı.", isActive = org.IsActive });
        }

        // GET /api/admin/dashboard-stats
        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var totalShops = await _context.Organizations.CountAsync(o => !o.IsDeleted && o.Name != "Vision X System");
            var expireThreshold = DateTime.UtcNow.AddDays(7);
            var expiringSoonCount = await _context.Organizations
                .CountAsync(o => !o.IsDeleted && o.LicenseEndDate <= expireThreshold && o.LicenseEndDate > DateTime.UtcNow);
            var totalCustomers = await _context.Customers.CountAsync(c => !c.IsDeleted);
            var totalUsers = await _context.Users.CountAsync(u => !u.IsDeleted && u.Role != "SuperAdmin");
            var activeShops = await _context.Organizations.CountAsync(o => !o.IsDeleted && o.IsActive && o.Name != "Vision X System");

            var monthlyRevenue = await _context.Transactions
                .Where(t => t.TransactionDate >= DateTime.UtcNow.AddDays(-30) && t.TransactionType == "Satış Tahsilatı")
                .SumAsync(t => t.Amount);

            return Ok(new {
                totalShops,
                activeShops,
                expiringSoonCount,
                totalCustomers,
                totalUsers,
                monthlyRevenue
            });
        }

        // GET /api/admin/system-logs
        [HttpGet("system-logs")]
        public async Task<IActionResult> GetSystemLogs()
        {
            var logs = await _context.AuditLogs
                .AsNoTracking()
                .OrderByDescending(l => l.Timestamp)
                .Take(100)
                .ToListAsync();

            var userIds = logs.Where(l => l.UserId.HasValue).Select(l => l.UserId!.Value).Distinct().ToList();
            var users = await _context.Users.AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

            var orgIds = users.Values.Select(u => u.OrganizationId).Distinct().Where(id => id != Guid.Empty).ToList();
            var branchIds = users.Values.Select(u => u.BranchId).Distinct().Where(id => id != Guid.Empty).ToList();

            var orgDict = await _context.Organizations.AsNoTracking()
                .Where(o => orgIds.Contains(o.Id))
                .ToDictionaryAsync(o => o.Id);

            var branchDict = await _context.Branches.AsNoTracking()
                .Where(b => branchIds.Contains(b.Id))
                .ToDictionaryAsync(b => b.Id);

            var result = logs.Select(l =>
            {
                User? u = null;
                Organization? org = null;
                Branch? branch = null;
                if (l.UserId.HasValue && users.TryGetValue(l.UserId.Value, out var found))
                {
                    u = found;
                    orgDict.TryGetValue(found.OrganizationId, out org);
                    branchDict.TryGetValue(found.BranchId, out branch);
                }
                var userName = SecurityAuditActor.BuildSummary(u, org, branch);

                return new
                {
                    l.Id,
                    l.Action,
                    l.TableName,
                    l.Timestamp,
                    l.UserId,
                    userName,
                    role = u?.Role
                };
            }).ToList();

            return Ok(result);
        }

        // GET /api/admin/organizations/{orgId}/users
        [HttpGet("organizations/{orgId}/users")]
        public async Task<IActionResult> GetOrganizationUsers(Guid orgId)
        {
            var users = await _context.Users
                .Where(u => u.OrganizationId == orgId && !u.IsDeleted)
                .Select(u => new {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.Role,
                    u.IsActive,
                    BranchName = _context.Branches.Where(b => b.Id == u.BranchId).Select(b => b.Name).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(users);
        }

        // PUT /api/admin/organizations/{orgId}/users/{userId}/reset-password  
        [HttpPut("organizations/{orgId}/users/{userId}/reset-password")]
        public async Task<IActionResult> ResetUserPassword(Guid orgId, Guid userId, [FromBody] ResetPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == orgId);
            if (user == null) return NotFound(new { message = "Kullanıcı bulunamadı." });

            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Şifre başarıyla güncellendi." });
        }

        // PUT /api/admin/organizations/{orgId}/license
        [HttpPut("organizations/{orgId}/license")]
        public async Task<IActionResult> ExtendLicense(Guid orgId, [FromBody] ExtendLicenseRequest request)
        {
            var org = await _context.Organizations.FindAsync(orgId);
            if (org == null) return NotFound(new { message = "Mağaza bulunamadı." });

            org.LicenseEndDate = request.NewEndDate;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Lisans güncellendi." });
        }

        // GET /api/admin/organizations/{orgId}/dashboard-stats
        [HttpGet("organizations/{orgId}/dashboard-stats")]
        public async Task<IActionResult> GetOrgDashboardStats(Guid orgId)
        {
            var org = await _context.Organizations.FindAsync(orgId);
            if (org == null) return NotFound(new { message = "Girdiğiniz mağaza bulunamadı." });

            var totalOrders = await _context.Orders.Where(o => o.OrganizationId == orgId && !o.IsDeleted).CountAsync();
            var totalRevenue = await _context.Orders.Where(o => o.OrganizationId == orgId && !o.IsDeleted).SumAsync(o => o.TotalAmount);
            var totalProducts = await _context.InventoryItems.Where(i => i.OrganizationId == orgId).SumAsync(i => i.Quantity);
            var activeAppointments = await _context.Appointments.Where(a => a.OrganizationId == orgId && !a.IsDeleted && a.AppointmentDate >= DateTime.UtcNow).CountAsync();

            return Ok(new {
                OrganizationName = org.Name,
                TotalOrders = totalOrders,
                TotalRevenue = totalRevenue,
                TotalStock = totalProducts,
                ActiveAppointments = activeAppointments
            });
        }

        private Guid? GetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public class UpdateOrgRequest
    {
        public string? Name { get; set; }
        public string? TaxNumber { get; set; }
        public string? SubscriptionPlan { get; set; }
        public DateTime? LicenseEndDate { get; set; }
        public bool? IsActive { get; set; }
    }

    public class AddBranchRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? City { get; set; }
        public string? District { get; set; }
    }
}
