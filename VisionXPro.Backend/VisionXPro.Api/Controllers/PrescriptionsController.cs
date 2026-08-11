using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using VisionXPro.Application.Interfaces;
using VisionXPro.Domain.Entities;
using VisionXPro.Persistence;
using VisionXPro.Api.Authorization;
using VisionXPro.Application.Authorization;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ShopOwner,ShopStaff")]
    public class PrescriptionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;

        public PrescriptionsController(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
        }

        [HttpPost]
        [RequirePermission(StaffPermissions.Prescription)]
        public async Task<IActionResult> CreatePrescription([FromBody] CreatePrescriptionRequest request)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();
            if (branchId == null) return BadRequest(new { message = "Şube bilgisi gereklidir." });

            var customerExists = await _context.Customers
                .AnyAsync(c => c.Id == request.CustomerId && c.OrganizationId == orgId && !c.IsDeleted);
            if (!customerExists)
                return BadRequest(new { message = "Müşteri bulunamadı." });

            var prescription = new Prescription
            {
                CustomerId = request.CustomerId,
                DoctorName = request.DoctorName,
                HospitalName = request.HospitalName,
                PrescriptionDate = request.PrescriptionDate ?? DateTime.UtcNow,
                RightSph = request.RightSph,
                RightCyl = request.RightCyl,
                RightAxis = request.RightAxis,
                RightPD = request.RightPD,
                LeftSph = request.LeftSph,
                LeftCyl = request.LeftCyl,
                LeftAxis = request.LeftAxis,
                LeftPD = request.LeftPD,
                Addition = request.Addition,
                CreatedAt = DateTime.UtcNow
            };

            _context.Prescriptions.Add(prescription);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Reçete başarıyla kaydedildi.", prescriptionId = prescription.Id });
        }

        [HttpGet("customer/{customerId}")]
        [RequirePermission(StaffPermissions.Prescription)]
        public async Task<IActionResult> GetCustomerPrescriptions(Guid customerId)
        {
            var orgId = _tenantService.GetOrganizationId();

            var customerOk = await _context.Customers
                .AnyAsync(c => c.Id == customerId && c.OrganizationId == orgId && !c.IsDeleted);
            if (!customerOk)
                return NotFound(new { message = "Müşteri bulunamadı veya bu mağazaya ait değil." });

            var prescriptions = await _context.Prescriptions
                .Where(p => p.CustomerId == customerId)
                .OrderByDescending(p => p.PrescriptionDate)
                .Select(p => new {
                    p.Id,
                    p.DoctorName,
                    p.HospitalName,
                    p.PrescriptionDate,
                    right = new { sph = p.RightSph, cyl = p.RightCyl, axis = p.RightAxis, pd = p.RightPD },
                    left = new { sph = p.LeftSph, cyl = p.LeftCyl, axis = p.LeftAxis, pd = p.LeftPD },
                    p.Addition
                })
                .ToListAsync();

            return Ok(prescriptions);
        }
    }

    public class CreatePrescriptionRequest
    {
        public Guid CustomerId { get; set; }
        public string? DoctorName { get; set; }
        public string? HospitalName { get; set; }
        public DateTime? PrescriptionDate { get; set; }
        public decimal? RightSph { get; set; }
        public decimal? RightCyl { get; set; }
        public int? RightAxis { get; set; }
        public int? RightPD { get; set; }
        public decimal? LeftSph { get; set; }
        public decimal? LeftCyl { get; set; }
        public int? LeftAxis { get; set; }
        public int? LeftPD { get; set; }
        public decimal? Addition { get; set; }
    }
}
