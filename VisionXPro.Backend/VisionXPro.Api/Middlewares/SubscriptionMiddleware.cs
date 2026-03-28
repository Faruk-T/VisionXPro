using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using VisionXPro.Application.Interfaces;
using VisionXPro.Persistence;

namespace VisionXPro.Api.Middlewares
{
    public class SubscriptionMiddleware
    {
        private readonly RequestDelegate _next;

        public SubscriptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ITenantService tenantService, AppDbContext dbContext)
        {
            if (context.User.Identity != null && context.User.Identity.IsAuthenticated)
            {
                var orgId = tenantService.GetOrganizationId();
                if (orgId != Guid.Empty)
                {
                    var org = await dbContext.Organizations.AsNoTracking().FirstOrDefaultAsync(o => o.Id == orgId);
                    
                    if (org != null)
                    {
                        var roleClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                        if (roleClaim != "SuperAdmin")
                        {
                            if (!org.IsActive)
                            {
                                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                                await context.Response.WriteAsJsonAsync(new { message = "Organization is inactive." });
                                return;
                            }

                            if (org.LicenseEndDate.HasValue && org.LicenseEndDate.Value < DateTime.UtcNow)
                            {
                                context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
                                await context.Response.WriteAsJsonAsync(new { message = "Organization license has expired. Please contact support." });
                                return;
                            }
                        }
                    }
                }
            }

            await _next(context);
        }
    }
}
