using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using VisionXPro.Api.Services;
using VisionXPro.Application.Authorization;
using VisionXPro.Application.DTOs;
using VisionXPro.Application.Interfaces;
using VisionXPro.Domain.Entities;
using VisionXPro.Persistence;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IJwtProvider _jwtProvider;
        private readonly PasswordHasher<User> _passwordHasher;

        public AuthController(AppDbContext context, IJwtProvider jwtProvider)
        {
            _context = context;
            _jwtProvider = jwtProvider;
            _passwordHasher = new PasswordHasher<User>();
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // E-posta ile kullanıcıyı bul
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password" });

            var verify = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (verify == PasswordVerificationResult.Failed)
                return Unauthorized(new { message = "Invalid email or password" });

            if (!user.IsActive)
                return BadRequest(new { message = "User is not active" });

            // Bakım Modu Kontrolü
            if (user.Role != "SuperAdmin")
            {
                var _configFilePath = "system_config.json";
                if (System.IO.File.Exists(_configFilePath))
                {
                    var json = await System.IO.File.ReadAllTextAsync(_configFilePath);
                    var config = JsonSerializer.Deserialize<SettingsController.SystemConfig>(json);
                    
                    if (config != null && config.MaintenanceMode)
                    {
                        return BadRequest(new { message = "Sistem şu an bakım modundadır. Genel müdürlük dışında erişim kapatılmıştır." });
                    }
                }

                // Lisans Süresi Kontrolü
                if (user.OrganizationId != Guid.Empty)
                {
                    var org = await _context.Organizations.FindAsync(user.OrganizationId);
                    if (org != null && org.LicenseEndDate.HasValue && org.LicenseEndDate.Value < DateTime.UtcNow)
                    {
                        return StatusCode(403, new { code = "LICENSE_EXPIRED", message = "Lisans süreniz dolmuştur. Lütfen sistem yöneticisi ile iletişime geçin." });
                    }
                }
            }

            var token = _jwtProvider.GenerateToken(user);

            Organization? logOrg = null;
            Branch? logBranch = null;
            if (user.OrganizationId != Guid.Empty)
                logOrg = await _context.Organizations.AsNoTracking().FirstOrDefaultAsync(o => o.Id == user.OrganizationId);
            if (user.BranchId != Guid.Empty)
                logBranch = await _context.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == user.BranchId);

            var actorSummary = SecurityAuditActor.BuildSummary(user, logOrg, logBranch);

            _context.AuditLogs.Add(new AuditLog {
                UserId = user.Id,
                TableName = "SystemAuth",
                Action = $"{actorSummary} sisteme giriş yaptı.",
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var permissions = StaffPermissions.Resolve(user.Role, user.JobTitle);

            var response = new AuthResponse
            {
                Token = token,
                UserId = user.Id,
                FullName = user.FullName,
                Role = user.Role,
                JobTitle = user.JobTitle,
                Permissions = permissions.ToList(),
                OrganizationId = user.OrganizationId,
                BranchId = user.BranchId
            };

            return Ok(response);
        }

        // Register endpoint has been removed as per SaaS requirements. 
        // Only SuperAdmin can create organizations and users now.
    }
}
