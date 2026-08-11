using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using VisionXPro.Api.Services;
using VisionXPro.Domain.Entities;
using VisionXPro.Persistence;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin")]
    public class LogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LogsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetRecentLogs()
        {
            var logs = await _context.AuditLogs
                .AsNoTracking()
                .OrderByDescending(l => l.Timestamp)
                .Take(80)
                .ToListAsync();

            var userIds = logs.Where(l => l.UserId.HasValue).Select(l => l.UserId!.Value).Distinct().ToList();
            var users = await _context.Users.AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

            var orgIds = users.Values.Select(u => u.OrganizationId).Distinct().Where(id => id != System.Guid.Empty).ToList();
            var branchIds = users.Values.Select(u => u.BranchId).Distinct().Where(id => id != System.Guid.Empty).ToList();

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
    }
}
