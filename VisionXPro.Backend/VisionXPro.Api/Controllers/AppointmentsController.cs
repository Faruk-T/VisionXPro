using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using VisionXPro.Domain.Entities;
using VisionXPro.Persistence;
using VisionXPro.Application.Interfaces;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ShopOwner")]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;

        public AppointmentsController(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAppointments()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null)
                return BadRequest(new { message = "Branch ID is required" });

            var query = from apt in _context.Appointments
                        where apt.OrganizationId == orgId && apt.BranchId == branchId.Value && !apt.IsDeleted
                        join cus in _context.Customers on apt.CustomerId equals cus.Id
                        orderby apt.AppointmentDate
                        select new
                        {
                            id = apt.Id.ToString(),
                            date = apt.AppointmentDate.ToString("yyyy-MM-dd"),
                            time = apt.AppointmentDate.ToString("HH:mm"),
                            patient = cus.FirstName + " " + cus.LastName,
                            phone = cus.Phone,
                            type = "Genel Kontrol",
                            status = apt.Status,
                            doctor = "Dr. Ahmet Bey"
                        };

            var list = await query.ToListAsync();

            return Ok(list);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null) return BadRequest("Branch ID is required.");

            // Basic customer creation/lookup based on name for simplicity in this demo
            var names = dto.Patient.Split(" ", StringSplitOptions.RemoveEmptyEntries);
            var firstName = names.Length > 0 ? names[0] : "İsimsiz";
            var lastName = names.Length > 1 ? string.Join(" ", names.Skip(1)) : "";

            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.OrganizationId == orgId && c.BranchId == branchId.Value && c.FirstName == firstName && c.LastName == lastName && !c.IsDeleted);

            if (customer == null)
            {
                customer = new Customer
                {
                    OrganizationId = orgId,
                    BranchId = branchId.Value,
                    FirstName = firstName,
                    LastName = lastName,
                    Phone = dto.Phone,
                    CreditBalance = 0,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Customers.Add(customer);
            }

            var apptDate = DateTime.Parse($"{dto.Date} {dto.Time}");

            var appointment = new Appointment
            {
                OrganizationId = orgId,
                BranchId = branchId.Value,
                CustomerId = customer.Id,
                AppointmentDate = apptDate,
                Status = "upcoming",
                CreatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Appointment created successfully." });
        }
    }

    public class CreateAppointmentDto
    {
        public string Patient { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }
}
