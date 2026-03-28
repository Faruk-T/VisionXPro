using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
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

            // Şifre kontrolü - (Eski düz metin şifreler için bypass istersen ekleyebilirsin ama yeni sistemde hepsi hashli olacak)
            if (user.PasswordHash == request.Password) 
            {
                // Geçici olarak plain text desteklemek isterseniz, ama idealde aşağıdakini kullanıyoruz.
            }
            else 
            {
                var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
                if (result == PasswordVerificationResult.Failed)
                    return Unauthorized(new { message = "Invalid email or password" });
            }

            if (!user.IsActive)
                return BadRequest(new { message = "User is not active" });

            var token = _jwtProvider.GenerateToken(user);

            var response = new AuthResponse
            {
                Token = token,
                UserId = user.Id,
                FullName = user.FullName,
                Role = user.Role,
                OrganizationId = user.OrganizationId,
                BranchId = user.BranchId
            };

            return Ok(response);
        }

        // Register endpoint has been removed as per SaaS requirements. 
        // Only SuperAdmin can create organizations and users now.
    }
}
