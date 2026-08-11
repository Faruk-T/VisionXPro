using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using VisionXPro.Application.Interfaces;
using VisionXPro.Persistence;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/compliance")]
    [Authorize(Roles = "ShopOwner,ShopStaff")]
    public class ComplianceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;

        public ComplianceController(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetIntegrationStatus()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();
            if (branchId == null) return BadRequest();

            var settings = await _context.ShopSettings
                .FirstOrDefaultAsync(s => s.OrganizationId == orgId && s.BranchId == branchId.Value);

            var pendingUts = await _context.RegulatoryNotifications
                .CountAsync(n => n.OrganizationId == orgId && n.BranchId == branchId.Value
                    && n.NotificationType == "UTS" && n.Status == "Bekliyor" && !n.IsDeleted);

            var pendingMedula = await _context.RegulatoryNotifications
                .CountAsync(n => n.OrganizationId == orgId && n.BranchId == branchId.Value
                    && n.NotificationType == "Medula" && n.Status == "Bekliyor" && !n.IsDeleted);

            return Ok(new
            {
                mode = "preparation",
                message = "Canlı ÜTS/Medula API entegrasyonu henüz aktif değil. Bildirimler kuyruğa alınır; resmi portallarda manuel işlem yapılır.",
                utsConfigured = !string.IsNullOrWhiteSpace(settings?.UtsToken) && !string.IsNullOrWhiteSpace(settings?.UtsGlnCode),
                medulaConfigured = !string.IsNullOrWhiteSpace(settings?.MedulaFacilityCode) && !string.IsNullOrWhiteSpace(settings?.MedulaPassword),
                pendingUts,
                pendingMedula
            });
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPending([FromQuery] string? type)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();
            if (branchId == null) return BadRequest();

            var query = _context.RegulatoryNotifications
                .Where(n => n.OrganizationId == orgId && n.BranchId == branchId.Value && !n.IsDeleted);

            if (!string.IsNullOrWhiteSpace(type))
                query = query.Where(n => n.NotificationType == type);

            var items = await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(100)
                .Select(n => new
                {
                    n.Id,
                    n.OrderNumber,
                    n.NotificationType,
                    n.ProductName,
                    n.UtsCode,
                    n.Quantity,
                    n.CustomerName,
                    n.Status,
                    createdAt = n.CreatedAt.ToString("dd.MM.yyyy HH:mm"),
                    n.CompletedAt
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpPut("{id}/complete")]
        public async Task<IActionResult> MarkComplete(Guid id)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();
            if (branchId == null) return BadRequest();

            var item = await _context.RegulatoryNotifications.FirstOrDefaultAsync(n =>
                n.Id == id && n.OrganizationId == orgId && n.BranchId == branchId.Value && !n.IsDeleted);

            if (item == null) return NotFound();

            item.Status = "Tamamlandı";
            item.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Bildirim tamamlandı olarak işaretlendi." });
        }
    }
}
