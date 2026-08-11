using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Linq;
using System.Security.Claims;

namespace VisionXPro.Api.Authorization
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public sealed class RequirePermissionAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string _permission;

        public RequirePermissionAttribute(string permission)
        {
            _permission = permission;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;
            if (user?.Identity?.IsAuthenticated != true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            if (user.IsInRole("ShopOwner") || user.IsInRole("SuperAdmin"))
                return;

            if (!user.IsInRole("ShopStaff"))
            {
                context.Result = new ForbidResult();
                return;
            }

            var raw = user.FindFirst("permissions")?.Value ?? string.Empty;
            var permissions = raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            if (!permissions.Any(p => string.Equals(p, _permission, StringComparison.OrdinalIgnoreCase)))
            {
                context.Result = new ObjectResult(new { message = "Bu işlem için yetkiniz bulunmuyor." })
                {
                    StatusCode = 403
                };
            }
        }
    }
}
