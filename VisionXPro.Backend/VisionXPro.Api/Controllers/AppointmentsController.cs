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
                        where apt.OrganizationId == orgId && apt.BranchId == branchId.Value
                        join cus in _context.Customers on apt.CustomerId equals cus.Id
                        orderby apt.AppointmentDate
                        select new
                        {
                            apt.Id,
                            Time = apt.AppointmentDate.ToString("HH:mm"),
                            Patient = cus.FirstName + " " + cus.LastName,
                            Phone = cus.Phone,
                            Type = "Genel Kontrol",
                            Status = apt.Status
                        };

            var list = await query.ToListAsync();

            return Ok(list);
        }
    }
}
