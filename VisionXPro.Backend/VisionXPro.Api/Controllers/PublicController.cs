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
                    district = x.b.District,
                    city = x.b.City ?? "Genel",
                    address = x.b.District != null && x.b.City != null
                        ? $"{x.b.District}, {x.b.City}"
                        : x.b.City != null ? x.b.City + " Merkez" : "Adres bilgisi yok",
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
                    Segment = "Standart",
                    Source = "Randevu-Web",
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

        /// <summary>E-ticaret vitrininde yalnızca güneş gözlüğü kategorisi.</summary>
        [HttpGet("sunglasses")]
        public async Task<IActionResult> GetSunglasses([FromQuery] Guid? orgId, [FromQuery] Guid? branchId)
        {
            var query = from inv in _context.InventoryItems
                        where inv.Quantity > 0 && !inv.IsDeleted
                        join prod in _context.Products on inv.ProductId equals prod.Id
                        where !prod.IsDeleted
                        && prod.Category != null
                        && (EF.Functions.Like(prod.Category, "%Güneş%") || EF.Functions.Like(prod.Category, "%Gunes%"))
                        select new { inv, prod };

            if (orgId.HasValue && orgId.Value != Guid.Empty)
                query = query.Where(x => x.inv.OrganizationId == orgId.Value);
            if (branchId.HasValue && branchId.Value != Guid.Empty)
                query = query.Where(x => x.inv.BranchId == branchId.Value);

            var items = await query
                .Select(x => new
                {
                    id = x.prod.Id,
                    productId = x.prod.Id,
                    orgId = x.inv.OrganizationId,
                    branchId = x.inv.BranchId,
                    name = x.prod.Name,
                    brand = x.prod.Brand ?? "",
                    category = x.prod.Category,
                    barcode = x.prod.Barcode,
                    price = x.prod.SalePrice,
                    quantity = x.inv.Quantity,
                    origin = x.prod.Origin,
                    utsCode = x.prod.UtsCode
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost("orders")]
        public async Task<IActionResult> CreateEcommerceOrder([FromBody] PublicOrderRequest req)
        {
            if (req.OrgId == Guid.Empty || req.BranchId == Guid.Empty)
                return BadRequest(new { message = "Mağaza bilgisi eksik." });
            if (req.Items == null || req.Items.Count == 0)
                return BadRequest(new { message = "Sepet boş." });
            if (string.IsNullOrWhiteSpace(req.CustomerName) || string.IsNullOrWhiteSpace(req.Phone))
                return BadRequest(new { message = "Ad soyad ve telefon zorunludur." });

            var names = req.CustomerName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var firstName = names.Length > 0 ? names[0] : req.CustomerName.Trim();
            var lastName = names.Length > 1 ? string.Join(' ', names.Skip(1)) : "";

            var customer = await _context.Customers.FirstOrDefaultAsync(c =>
                c.OrganizationId == req.OrgId && c.BranchId == req.BranchId
                && c.Phone == req.Phone && !c.IsDeleted);

            if (customer == null)
            {
                customer = new Customer
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = req.OrgId,
                    BranchId = req.BranchId,
                    FirstName = firstName,
                    LastName = lastName,
                    Phone = req.Phone,
                    Segment = "E-Ticaret Müşterisi",
                    Source = "E-Ticaret",
                    CreditBalance = 0,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Customers.Add(customer);
            }

            foreach (var item in req.Items)
            {
                var inv = await _context.InventoryItems.FirstOrDefaultAsync(i =>
                    i.ProductId == item.ProductId && i.OrganizationId == req.OrgId
                    && i.BranchId == req.BranchId && !i.IsDeleted);
                if (inv == null)
                    return BadRequest(new { message = "Ürün stokta bulunamadı." });
                if (inv.Quantity < item.Quantity)
                    return BadRequest(new { message = $"Yetersiz stok: {item.ProductId}" });
            }

            var total = req.Items.Sum(i => i.UnitPrice * i.Quantity);
            var paid = req.PaidAmount > 0 ? req.PaidAmount : total;

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = new Order
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = req.OrgId,
                    BranchId = req.BranchId,
                    CustomerId = customer.Id,
                    OrderNumber = $"E-VXP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                    TotalAmount = total,
                    DiscountAmount = req.DiscountAmount,
                    PaidAmount = paid,
                    RemainingBalance = 0,
                    Status = "Yeni Sipariş",
                    SalesChannel = "E-Ticaret",
                    SalesRepresentative = "E-Ticaret",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Orders.Add(order);

                foreach (var item in req.Items)
                {
                    _context.OrderItems.Add(new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice
                    });

                    var inv = await _context.InventoryItems.FirstAsync(i =>
                        i.ProductId == item.ProductId && i.OrganizationId == req.OrgId && i.BranchId == req.BranchId);
                    inv.Quantity -= item.Quantity;
                }

                if (paid > 0)
                {
                    _context.Transactions.Add(new Transaction
                    {
                        Id = Guid.NewGuid(),
                        OrganizationId = req.OrgId,
                        BranchId = req.BranchId,
                        OrderId = order.Id,
                        TransactionType = "Satış Tahsilatı",
                        Amount = paid,
                        PaymentMethod = req.PaymentMethod ?? "Kredi Kartı",
                        TransactionDate = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new
                {
                    success = true,
                    orderNumber = order.OrderNumber,
                    totalAmount = total,
                    message = "Sipariş alındı."
                });
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return StatusCode(500, new { message = "Sipariş kaydedilemedi.", details = ex.Message });
            }
        }
    }

    public class PublicOrderRequest
    {
        public Guid OrgId { get; set; }
        public Guid BranchId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? PaymentMethod { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public List<PublicOrderItemRequest> Items { get; set; } = new();
    }

    public class PublicOrderItemRequest
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
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
