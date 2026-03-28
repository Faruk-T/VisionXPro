using Microsoft.AspNetCore.Http;
using System;
using System.Linq;
using System.Threading.Tasks;
using VisionXPro.Application.Interfaces;

namespace VisionXPro.Api.Middlewares
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
        {
            if (context.User.Identity != null && context.User.Identity.IsAuthenticated)
            {
                var orgClaim = context.User.Claims.FirstOrDefault(c => c.Type == "OrganizationId")?.Value;
                var branchClaim = context.User.Claims.FirstOrDefault(c => c.Type == "BranchId")?.Value;

                if (Guid.TryParse(orgClaim, out var orgId))
                {
                    Guid? branchId = null;
                    if (Guid.TryParse(branchClaim, out var bId))
                    {
                        branchId = bId;
                    }
                    
                    tenantService.SetTenant(orgId, branchId);
                }
            }
            else
            {
                if (context.Request.Headers.TryGetValue("X-Organization-Id", out var orgHeader))
                {
                    if (Guid.TryParse(orgHeader.FirstOrDefault(), out var orgId))
                    {
                        tenantService.SetTenant(orgId, null);
                    }
                }
            }

            await _next(context);
        }
    }
}
