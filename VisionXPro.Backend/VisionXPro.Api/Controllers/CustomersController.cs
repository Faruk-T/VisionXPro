using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VisionXPro.Domain.Entities;
using VisionXPro.Persistence;
using VisionXPro.Application.Interfaces;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;

        public CustomersController(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null) return BadRequest("Branch context required.");

            var customers = await _context.Set<Customer>()
                .Where(c => c.OrganizationId == orgId && c.BranchId == branchId.Value && !c.IsDeleted)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var result = customers.Select(c => new
            {
                id = c.Id.ToString(),
                name = $"{c.FirstName} {c.LastName}",
                phone = c.Phone,
                email = c.NationalId, // Using NationalId as email fallback just for mock
                status = c.CreditBalance > 5000 ? "VIP" : (c.CreditBalance < 0 ? "Riskli" : "Standart"),
                lastVisit = c.CreatedAt.ToString("dd MMM yyyy"),
                totalSpent = c.CreditBalance, 
                address = "Adres Kaydı Yok",
                prescriptions = Array.Empty<object>(),
                pastOrders = Array.Empty<object>()
            });

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CustomerDto dto)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null) return BadRequest("Branch context required.");

            var names = dto.Name.Split(" ", StringSplitOptions.RemoveEmptyEntries);
            var firstName = names.Length > 0 ? names[0] : "İsimsiz";
            var lastName = names.Length > 1 ? string.Join(" ", names.Skip(1)) : "";

            var customer = new Customer
            {
                OrganizationId = orgId,
                BranchId = branchId.Value,
                FirstName = firstName,
                LastName = lastName,
                Phone = dto.Phone,
                NationalId = dto.Email ?? "",
                CreditBalance = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<Customer>().Add(customer);
            await _context.SaveChangesAsync();

            return Ok(new { id = customer.Id.ToString(), name = $"{firstName} {lastName}", phone = customer.Phone });
        }
    }

    public class CustomerDto
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Address { get; set; }
    }
}
