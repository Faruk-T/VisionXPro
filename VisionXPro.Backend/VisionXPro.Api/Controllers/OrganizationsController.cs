using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
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
            // Use transaction to ensure Organization, Branch, and User are created atomically
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
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
                await _context.SaveChangesAsync(); // Save to get the Org Id

                var mainBranch = new Branch
                {
                    Name = "Merkez Şube",
                    OrganizationId = org.Id,
                    City = request.City ?? "Merkez",
                };

                _context.Branches.Add(mainBranch);
                await _context.SaveChangesAsync(); // Save to get the Branch Id

                var adminUser = new User
                {
                    FullName = "Shop Admin",
                    Email = request.AdminEmail,
                    OrganizationId = org.Id,
                    BranchId = mainBranch.Id,
                    Role = "ShopOwner",
                    IsActive = true
                };

                // Hash the provided password securely
                adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, request.AdminPassword);

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new { message = "Organization, branch and owner user created successfully.", orgId = org.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Bir hata oluştu", details = ex.Message });
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
    }

    public class CreateOrgRequest

    {
        public string Name { get; set; } = string.Empty;
        public string? TaxNumber { get; set; }
        public string? City { get; set; }
        public string? SubscriptionPlan { get; set; }
        public DateTime? LicenseStartDate { get; set; }
        public DateTime? LicenseEndDate { get; set; }
        public bool IsTrial { get; set; }
        public string AdminEmail { get; set; } = string.Empty;
        public string AdminPassword { get; set; } = string.Empty;
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
