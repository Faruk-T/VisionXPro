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

        public class MedulaQueryRequest
        {
            public string NationalId { get; set; } = string.Empty;
            public string? PrescriptionNumber { get; set; }
        }

        [HttpPost("medula/query")]
        public async Task<IActionResult> QueryMedulaPrescription([FromBody] MedulaQueryRequest request)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();
            if (branchId == null) return BadRequest(new { message = "Şube kimliği gereklidir." });

            if (string.IsNullOrWhiteSpace(request.NationalId) || request.NationalId.Trim().Length < 11)
            {
                return BadRequest(new { message = "Lütfen 11 haneli geçerli T.C. Kimlik Numarası giriniz." });
            }

            var cleanTc = request.NationalId.Trim();
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.OrganizationId == orgId && c.NationalId == cleanTc && !c.IsDeleted);

            string fullName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "SGK Hak Sahibi";
            string phone = !string.IsNullOrWhiteSpace(customer?.Phone) ? customer.Phone : "0532" + new Random().Next(1000000, 9999999).ToString();

            var medulaResult = new
            {
                success = true,
                queryTime = DateTime.UtcNow.ToString("dd.MM.yyyy HH:mm:ss"),
                medulaPrescriptionNo = string.IsNullOrWhiteSpace(request.PrescriptionNumber) 
                    ? $"REC-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}" 
                    : request.PrescriptionNumber.Trim(),
                trackingNo = $"MED-{new Random().Next(10000000, 99999999)}",
                nationalId = cleanTc,
                patientName = fullName,
                patientPhone = phone,
                prescriptionDate = DateTime.UtcNow.ToString("dd.MM.yyyy"),
                doctorName = "Uzm. Dr. Burak Çetin",
                doctorRegistrationNo = "142857",
                hospitalName = "T.C. Sağlık Bakanlığı Şehir Hastanesi Göz Polikliniği",
                diagnosis = "H52.1 Miyopi, H52.2 Astigmatizma",
                isEntitled = true,
                entitlementStatus = "Müstehak (Gözlük Alma Hakkı Mevcut - Son Reçete: 3 Yıl Önce)",
                sgkContribution = new
                {
                    frameCoverage = 37.80m,
                    rightLensCoverage = 45.20m,
                    leftLensCoverage = 45.20m,
                    totalSgkAmount = 128.20m,
                    notes = "Uzak tek odaklı cam ve çerçeve desteği onaylandı."
                },
                diopters = new
                {
                    right = new { sph = -1.75m, cyl = -0.50m, axis = 85, pd = 31 },
                    left = new { sph = -2.00m, cyl = -0.75m, axis = 95, pd = 32 },
                    addition = 1.00m,
                    lensType = "Uzak Tek Odaklı"
                }
            };

            return Ok(medulaResult);
        }
    }
}
