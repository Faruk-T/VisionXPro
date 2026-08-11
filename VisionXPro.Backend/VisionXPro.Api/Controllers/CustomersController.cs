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
    [Authorize(Roles = "ShopOwner,ShopStaff")]
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

            var prescriptions = await _context.Prescriptions
                .Where(p => customers.Select(c => c.Id).Contains(p.CustomerId))
                .ToListAsync();

            var orders = await _context.Orders
                .Where(o => customers.Select(c => c.Id).Contains(o.CustomerId) && !o.IsDeleted)
                .ToListAsync();

            var orderIds = orders.Select(o => o.Id).ToList();
            var orderItems = await _context.OrderItems
                .Where(oi => orderIds.Contains(oi.OrderId))
                .ToListAsync();
            var productIds = orderItems.Select(oi => oi.ProductId).Distinct().ToList();
            var productsDict = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            var result = customers.Select(c => new
            {
                id = c.Id.ToString(),
                name = $"{c.FirstName} {c.LastName}",
                phone = c.Phone,
                nationalId = c.NationalId,
                email = (string?)null,
                status = c.Segment,
                source = c.Source,
                lastVisit = c.CreatedAt.ToString("dd MMM yyyy"),
                createdAt = c.CreatedAt,
                totalSpent = orders.Where(o => o.CustomerId == c.Id).Sum(o => o.TotalAmount),
                address = "Adres Kaydı Yok",
                prescriptions = prescriptions.Where(p => p.CustomerId == c.Id).Select(p => new {
                    id = "RX-" + p.Id.ToString().Substring(0, 6),
                    prescriptionId = p.Id,
                    date = p.PrescriptionDate.ToString("dd.MM.yyyy"),
                    doctor = p.DoctorName ?? "Bilinmiyor",
                    clinic = p.HospitalName ?? "Bilinmiyor",
                    right = new { sph = p.RightSph, cyl = p.RightCyl, axis = p.RightAxis, pd = p.RightPD },
                    left = new { sph = p.LeftSph, cyl = p.LeftCyl, axis = p.LeftAxis, pd = p.LeftPD },
                    addition = p.Addition
                }),
                pastOrders = orders.Where(o => o.CustomerId == c.Id).OrderByDescending(o => o.CreatedAt).Select(o =>
                {
                    var items = orderItems.Where(oi => oi.OrderId == o.Id).ToList();
                    var productLabel = items.Count == 0
                        ? "Sipariş"
                        : string.Join(", ", items.Select(oi =>
                        {
                            productsDict.TryGetValue(oi.ProductId, out var p);
                            return p?.Name ?? "Ürün";
                        }).Distinct());
                    return new {
                        id = o.OrderNumber,
                        date = o.CreatedAt.ToString("dd.MM.yyyy"),
                        product = productLabel,
                        amount = o.TotalAmount,
                        salesChannel = o.SalesChannel
                    };
                }),
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
                NationalId = dto.NationalId ?? "",
                CreditBalance = 0,
                Segment = string.IsNullOrEmpty(dto.Segment) ? "Standart" : dto.Segment,
                Source = string.IsNullOrEmpty(dto.Source) ? "Manuel" : dto.Source,
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
        public string? NationalId { get; set; }
        public string? Address { get; set; }
        public string? Segment { get; set; }
        public string? Source { get; set; }
    }
}
