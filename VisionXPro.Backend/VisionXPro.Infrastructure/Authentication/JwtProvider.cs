using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using VisionXPro.Application.Authorization;
using VisionXPro.Application.Interfaces;
using VisionXPro.Domain.Entities;

namespace VisionXPro.Infrastructure.Authentication
{
    public class JwtProvider : IJwtProvider
    {
        private readonly IConfiguration _configuration;

        public JwtProvider(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            var permissions = StaffPermissions.Resolve(user.Role, user.JobTitle);
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("OrganizationId", user.OrganizationId.ToString()),
                new Claim("BranchId", user.BranchId.ToString()),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("permissions", StaffPermissions.ToClaimValue(permissions))
            };

            if (!string.IsNullOrWhiteSpace(user.JobTitle))
                claims.Add(new Claim("jobTitle", user.JobTitle.Trim()));

            var secret = _configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret is not configured.");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "VisionXPro",
                audience: _configuration["Jwt:Audience"] ?? "VisionXProUsers",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
