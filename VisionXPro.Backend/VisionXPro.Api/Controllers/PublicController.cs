using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using VisionXPro.Domain.Entities;
using VisionXPro.Persistence;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // Herkese açık endpoints
    public class PublicController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PublicController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Şubeleri/Mağazaları Listeleme
        [HttpGet("stores")]
        public async Task<IActionResult> GetStores()
        {
            var stores = await _context.Branches
                .Where(b => !b.IsDeleted)
                .Join(_context.Organizations,
                      b => b.OrganizationId,
                      o => o.Id,
                      (b, o) => new { b, o })
                .Where(x => !x.o.IsDeleted && x.o.Name != "Vision X System") // Sistem şubesi gizlenir
                .Select(x => new
                {
                    id = x.b.Id,
                    orgId = x.o.Id,
                    name = x.b.Name == "Merkez Şube" ? x.o.Name : x.o.Name + " - " + x.b.Name,
                    phone = "Belirtilmedi",
                    email = "info@" + (x.o.Name).ToLower().Replace(" ","") + ".com",
                    address = x.b.City != null ? x.b.City + " Merkez" : "Adres bilgisi yok",
                    city = x.b.City ?? "Genel",
                    services = new string[] { "Profesyonel optik hizmetleri", "Gözlük", "Kontakt Lens" }
                })
                .ToListAsync();

            return Ok(stores);
        }

        // 2. Özel Şubeye Randevu Kaydetme
        [HttpPost("appointments")]
        public async Task<IActionResult> CreateAppointment([FromBody] PublicAppointmentRequest req)
        {
            if (req.BranchId == Guid.Empty || req.OrgId == Guid.Empty)
                return BadRequest("Geçersiz mağaza seçimi.");

            // Hastanın kaydı var mı kontrol et
            var names = req.PatientName.Split(" ", StringSplitOptions.RemoveEmptyEntries);
            var firstName = names.Length > 0 ? names[0] : "İsimsiz";
            var lastName = names.Length > 1 ? string.Join(" ", names.Skip(1)) : "";

            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.OrganizationId == req.OrgId && c.BranchId == req.BranchId && c.Phone == req.Phone && !c.IsDeleted);

            if (customer == null)
            {
                customer = new Customer
                {
                    OrganizationId = req.OrgId,
                    BranchId = req.BranchId,
                    FirstName = firstName,
                    LastName = lastName,
                    Phone = req.Phone,
                    CreditBalance = 0,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Customers.Add(customer);
            }

            var apptDate = DateTime.TryParse($"{req.Date} {req.Time}", out var parsedDate) 
                ? parsedDate 
                : DateTime.UtcNow.AddDays(1); // fallback

            var appointment = new Appointment
            {
                OrganizationId = req.OrgId,
                BranchId = req.BranchId,
                CustomerId = customer.Id,
                AppointmentDate = apptDate,
                Status = "upcoming",
                CreatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Randevu başarıyla ulaştı." });
        }
    }

    public class PublicAppointmentRequest
    {
        public Guid OrgId { get; set; }
        public Guid BranchId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }
}
