using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
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
                .OrderByDescending(l => l.Timestamp)
                .Take(50)
                .Select(l => new {
                    l.Id,
                    l.Action,
                    l.TableName,
                    l.Timestamp,
                    l.UserId,
                    UserName = _context.Users.Where(u => u.Id == l.UserId).Select(u => u.FullName).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
