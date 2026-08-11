using System;
using System.Collections.Generic;
using VisionXPro.Application.Authorization;

namespace VisionXPro.Application.DTOs
{
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public Guid OrganizationId { get; set; } // Ortak giriş ekranında tenant bulmak için opsiyonel yapılabilir, biz şimdilik mandatory yapabiliriz veya URL'den alabiliriz
    }

    public class RegisterRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public Guid OrganizationId { get; set; }
        public Guid BranchId { get; set; }
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public List<string> Permissions { get; set; } = new();
        public Guid OrganizationId { get; set; }
        public Guid? BranchId { get; set; }
    }
}
