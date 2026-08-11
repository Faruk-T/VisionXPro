using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using VisionXPro.Domain.Entities;
using VisionXPro.Persistence;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin")]
    public class OrganizationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;

        public OrganizationsController(AppDbContext context)
        {
            _context = context;
            _passwordHasher = new PasswordHasher<User>();
        }

        [HttpPost]
        public async Task<IActionResult> CreateShopWithOwner([FromBody] CreateOrgRequest request)
        {
            // Atomik işlem garantisi için Transaction başlatıyoruz
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Önce veri tabanında 'ShopOwner' rolünün olup olmadığını kontrol ediyoruz
                var shopOwnerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "ShopOwner");
                
                if (shopOwnerRole == null)
                {
                    // Eğer rol yoksa işlemi durduruyoruz
                    return BadRequest(new { message = "Sistem hatası: 'ShopOwner' rolü veri tabanında bulunamadı. Lütfen rolleri kontrol edin." });
                }

                // 2. Organizasyonu (Mağazayı) oluşturuyoruz
                var org = new Organization
                {
                    Name = request.Name,
                    TaxNumber = request.TaxNumber,
                    SubscriptionPlan = request.SubscriptionPlan,
                    LicenseStartDate = request.LicenseStartDate ?? DateTime.UtcNow,
                    LicenseEndDate = request.LicenseEndDate ?? DateTime.UtcNow.AddYears(1),
                    IsTrial = request.IsTrial,
                    IsActive = true
                };

                _context.Organizations.Add(org);
                await _context.SaveChangesAsync(); // Org Id oluşması için kaydediyoruz

                // 3. Varsayılan Şubeyi oluşturuyoruz
                var mainBranch = new Branch
                {
                    Name = "Merkez Şube",
                    OrganizationId = org.Id,
                    City = request.City ?? "Merkez",
                    District = string.IsNullOrWhiteSpace(request.District) ? null : request.District.Trim(),
                };

                _context.Branches.Add(mainBranch);
                await _context.SaveChangesAsync(); // Branch Id oluşması için kaydediyoruz

                // 4. Mağaza Sahibini (Admin) oluşturuyoruz
                var adminUser = new User
                {
                    FullName = "Shop Admin",
                    Email = request.AdminEmail,
                    OrganizationId = org.Id,
                    BranchId = mainBranch.Id,
                    RoleId = shopOwnerRole.Id, // Az önce bulduğumuz Rol ID'yi buraya atıyoruz
                    Role = "ShopOwner",
                    IsActive = true
                };

                // Şifreyi güvenli şekilde hash'liyoruz
                adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, request.AdminPassword);

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();

                var adminUserId = GetCurrentUserId();
                _context.AuditLogs.Add(new AuditLog {
                    UserId = adminUserId,
                    TableName = "Organizations",
                    Action = $"Yeni mağaza oluşturuldu: {org.Name}",
                    Timestamp = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                // Her şey yolundaysa tüm işlemleri onaylıyoruz
                await transaction.CommitAsync();

                return Ok(new { message = "Organizasyon, şube ve yönetici hesabı başarıyla oluşturuldu.", orgId = org.Id });
            }
            catch (Exception ex)
            {
                // Hata oluşursa yapılan tüm değişiklikleri geri alıyoruz
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Mağaza oluşturulurken bir sunucu hatası oluştu.", details = ex.Message });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var totalShops = await _context.Organizations.CountAsync();
            
            var expireThreshold = DateTime.UtcNow.AddDays(7);
            var expiringSoonCount = await _context.Organizations
                .CountAsync(o => o.LicenseEndDate <= expireThreshold && o.LicenseEndDate > DateTime.UtcNow);

            var totalCustomers = await _context.Customers.CountAsync();

            return Ok(new 
            {
                TotalOrganizations = totalShops,
                ExpiringLicensesCount = expiringSoonCount,
                TotalCustomers = totalCustomers
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllOrganizations()
        {
            var organizations = await _context.Organizations
                .Where(o => !o.IsDeleted)
                .Select(o => new {
                    o.Id,
                    o.Name,
                    o.TaxNumber,
                    o.IsActive,
                    o.LicenseStartDate,
                    o.LicenseEndDate,
                    BranchCount = _context.Branches.Count(b => b.OrganizationId == o.Id),
                    CustomerCount = _context.Customers.Count(c => c.OrganizationId == o.Id)
                })
                .ToListAsync();

            return Ok(organizations);
        }

        [HttpGet("{orgId}/users")]
        public async Task<IActionResult> GetOrganizationUsers(Guid orgId)
        {
            var users = await _context.Users
                .Where(u => u.OrganizationId == orgId)
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

        [HttpPut("{orgId}/license")]
        public async Task<IActionResult> ExtendLicense(Guid orgId, [FromBody] ExtendLicenseRequest request)
        {
            var org = await _context.Organizations.FindAsync(orgId);
            if (org == null) return NotFound(new { message = "Girdiğiniz mağaza bulunamadı." });

            org.LicenseEndDate = request.NewEndDate;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Lisans başarıyla güncellendi." });
        }

        [HttpPut("{orgId}/users/{userId}/reset-password")]
        public async Task<IActionResult> ResetUserPassword(Guid orgId, Guid userId, [FromBody] ResetPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == orgId);
            if (user == null) return NotFound(new { message = "Kullanıcı bulunamadı." });

            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Şifre başarıyla güncellendi." });
        }

        [HttpDelete("{orgId}")]
        public async Task<IActionResult> DeleteOrganization(Guid orgId)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var org = await _context.Organizations.FindAsync(orgId);
                if (org == null || org.IsDeleted)
                    return NotFound(new { message = "Mağaza bulunamadı veya zaten silinmiş." });

                // 1. Soft delete the organization
                org.IsDeleted = true;
                org.IsActive = false;

                // 2. Soft delete all associated branches
                var branches = await _context.Branches.Where(b => b.OrganizationId == orgId && !b.IsDeleted).ToListAsync();
                foreach (var branch in branches)
                {
                    branch.IsDeleted = true;
                }

                // 3. Deactivate and soft delete all associated users preventing them from logging in
                var users = await _context.Users.Where(u => u.OrganizationId == orgId && !u.IsDeleted).ToListAsync();
                foreach (var user in users)
                {
                    user.IsActive = false;
                    user.IsDeleted = true;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = "Mağaza ve tüm kullanıcıları sistemden başarıyla silindi (Soft Delete)." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Mağaza silinirken sunucu tarafında bir hata oluştu.", details = ex.Message });
            }
        }

        private Guid? GetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        [HttpGet("{orgId}/dashboard-stats")]
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
    }

    // --- DTO (Data Transfer Object) Tanımları ---

    public class CreateOrgRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? TaxNumber { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public string? SubscriptionPlan { get; set; }
        public DateTime? LicenseStartDate { get; set; }
        public DateTime? LicenseEndDate { get; set; }
        public bool IsTrial { get; set; }
        public string AdminEmail { get; set; } = string.Empty;
        public string AdminPassword { get; set; } = string.Empty;
        /// <summary>Shop = tek mağaza, Corporate = çok şubeli kurumsal (Kumsal)</summary>
        public string AccountType { get; set; } = "Shop";
    }

    public class ExtendLicenseRequest
    {
        public DateTime NewEndDate { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string NewPassword { get; set; } = string.Empty;
    }
}