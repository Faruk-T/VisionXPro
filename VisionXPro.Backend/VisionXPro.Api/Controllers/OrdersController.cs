using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VisionXPro.Domain.Entities;
using VisionXPro.Persistence;
using VisionXPro.Application.Interfaces;
using VisionXPro.Api.Authorization;
using VisionXPro.Application.Authorization;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ShopOwner,ShopStaff")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;

        public OrdersController(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
        }

        [HttpPost]
        [RequirePermission(StaffPermissions.Pos)]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null)
                return BadRequest(new { message = "Branch ID is required to create an order." });

            if (request.Items == null || !request.Items.Any())
                return BadRequest(new { message = "Sipariş en az 1 ürün içermelidir." });

            var finalCustomerId = request.CustomerId;

            if (finalCustomerId == Guid.Empty || finalCustomerId == Guid.Parse("00000000-0000-0000-0000-000000000000"))
            {
                if (string.IsNullOrWhiteSpace(request.CustomerName))
                    return BadRequest(new { message = "E-Ticaret (Kayıtsız) müşteriler için Ad Soyad zorunludur." });

                var newCustomer = new Customer
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    BranchId = branchId.Value,
                    FirstName = request.CustomerName,
                    LastName = " ",
                    Phone = request.CustomerPhone ?? "-",
                    Segment = "E-Ticaret Müşterisi",
                    Source = "E-Ticaret",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Customers.Add(newCustomer);
                finalCustomerId = newCustomer.Id;
            }
            else
            {
                var customerExists = await _context.Customers.AnyAsync(c =>
                    c.Id == finalCustomerId && c.OrganizationId == orgId && c.BranchId == branchId.Value && !c.IsDeleted);
                if (!customerExists)
                    return BadRequest(new { message = "Geçersiz veya eksik müşteri. Lütfen kayıtlı bir müşteri seçin veya oluşturun." });
            }

            var actorId = GetCurrentUserId();

            if (request.PrescriptionId.HasValue && request.PrescriptionId.Value != Guid.Empty)
            {
                var rxOk = await _context.Prescriptions.AnyAsync(p =>
                    p.Id == request.PrescriptionId.Value &&
                    _context.Customers.Any(c =>
                        c.Id == p.CustomerId && c.OrganizationId == orgId && !c.IsDeleted));
                if (!rxOk)
                    return BadRequest(new { message = "Seçilen reçete bu mağazaya ait değil veya bulunamadı." });
            }

            foreach (var itemReq in request.Items)
            {
                if (itemReq.IsServiceItem)
                {
                    if (itemReq.ProductId == Guid.Empty)
                    {
                        var serviceProduct = await EnsureLensServiceProductAsync(orgId, branchId.Value);
                        itemReq.ProductId = serviceProduct.Id;
                    }
                    else
                    {
                        var productOk = await _context.Products.AnyAsync(p =>
                            p.Id == itemReq.ProductId && p.OrganizationId == orgId && !p.IsDeleted);
                        if (!productOk)
                            return BadRequest(new { message = $"Hizmet ürünü bulunamadı (ID: {itemReq.ProductId})." });
                    }
                    continue;
                }

                var stockProductOk = await _context.Products.AnyAsync(p =>
                    p.Id == itemReq.ProductId && p.OrganizationId == orgId && !p.IsDeleted);
                if (!stockProductOk)
                    return BadRequest(new { message = $"Ürün bulunamadı veya başka bir mağazaya ait (ID: {itemReq.ProductId})." });

                var invPreview = await _context.InventoryItems
                    .FirstOrDefaultAsync(i => i.ProductId == itemReq.ProductId && i.OrganizationId == orgId && i.BranchId == branchId.Value);
                if (invPreview == null)
                    return BadRequest(new { message = $"Bu şubede seçilen ürün için stok kartı yok; önce katalogdan stoğa giriş yapın ({itemReq.ProductId})." });
                if (invPreview.Quantity < itemReq.Quantity)
                    return BadRequest(new { message = $"Yetersiz stok. Ürün mevcut: {invPreview.Quantity}, satılmak istenen: {itemReq.Quantity}." });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Hesaplamalar
                decimal finalTotal = request.TotalAmount - request.DiscountAmount;
                decimal remaining = finalTotal - request.PaidAmount - request.SgkAmount;

                // Create Order
                var order = new Order
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    BranchId = branchId.Value,
                    CustomerId = finalCustomerId,
                    PrescriptionId = request.PrescriptionId,
                    OrderNumber = $"VXP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper()}",
                    TotalAmount = request.TotalAmount,
                    DiscountAmount = request.DiscountAmount,
                    PaidAmount = request.PaidAmount,
                    SgkAmount = request.SgkAmount,
                    RemainingBalance = remaining > 0 ? remaining : 0,
                    Status = remaining > 0 ? "Hazırlanıyor" : "Tamamlandı",
                    SalesChannel = request.SalesChannel ?? "POS",
                    SalesRepresentative = request.SalesRepresentative ?? "Belirtilmedi",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = actorId
                };

                _context.Orders.Add(order);

                // Add Items and Deduct Inventory (skip for service/lens lines)
                foreach (var itemReq in request.Items)
                {
                    var orderItem = new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        ProductId = itemReq.ProductId,
                        Quantity = itemReq.Quantity,
                        UnitPrice = itemReq.UnitPrice,
                        LensDetails = string.IsNullOrWhiteSpace(itemReq.LensDetails) ? null : itemReq.LensDetails.Trim()
                    };
                    _context.OrderItems.Add(orderItem);

                    if (itemReq.IsServiceItem)
                        continue;

                    var inventoryItem = await _context.InventoryItems
                        .FirstAsync(i => i.ProductId == itemReq.ProductId && i.OrganizationId == orgId && i.BranchId == branchId.Value);

                    inventoryItem.Quantity -= itemReq.Quantity;
                }

                // Create Transaction for Paid Amount if > 0
                if (request.PaidAmount > 0)
                {
                    var tx = new Transaction
                    {
                        Id = Guid.NewGuid(),
                        OrganizationId = orgId,
                        BranchId = branchId.Value,
                        OrderId = order.Id,
                        TransactionType = "Satış Tahsilatı",
                        Amount = request.PaidAmount, // Kasaya giren net para
                        PaymentMethod = request.PaymentMethod,
                        TransactionDate = DateTime.UtcNow,
                        CreatedBy = actorId
                    };
                    _context.Transactions.Add(tx);
                }

                if (request.SgkAmount > 0)
                {
                    var sgkTx = new Transaction
                    {
                        Id = Guid.NewGuid(),
                        OrganizationId = orgId,
                        BranchId = branchId.Value,
                        OrderId = order.Id,
                        TransactionType = "SGK Kurum Alacağı",
                        Amount = request.SgkAmount,
                        PaymentMethod = "SGK",
                        TransactionDate = DateTime.UtcNow,
                        CreatedBy = actorId
                    };
                    _context.Transactions.Add(sgkTx);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var customerName = await _context.Customers
                    .Where(c => c.Id == finalCustomerId)
                    .Select(c => c.FirstName + " " + c.LastName)
                    .FirstOrDefaultAsync() ?? request.CustomerName ?? "Müşteri";

                var complianceAlerts = await CreateComplianceNotificationsAsync(
                    orgId, branchId.Value, order, request.Items, customerName.Trim(), request.SgkAmount);

                return Ok(new
                {
                    message = "Sipariş başarıyla oluşturuldu.",
                    orderNumber = order.OrderNumber,
                    orderId = order.Id,
                    complianceAlerts
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Bir hata oluştu", details = ex.Message });
            }
        }

        [HttpGet("today")]
        [RequirePermission(StaffPermissions.Pos)]
        public async Task<IActionResult> GetTodaySales()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null) return BadRequest();

            var today = DateTime.UtcNow.Date;
            var orders = await _context.Orders
                .Where(o => o.OrganizationId == orgId && o.BranchId == branchId.Value && o.CreatedAt >= today && !o.IsDeleted)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var orderIds = orders.Select(o => o.Id).ToList();
            var txs = await _context.Transactions
                .Where(t => t.OrganizationId == orgId && t.BranchId == branchId.Value
                    && t.TransactionDate >= today
                    && (t.OrderId == null || orderIds.Contains(t.OrderId.Value)))
                .ToListAsync();

            var cashTotal = txs.Where(t => t.PaymentMethod == "Nakit" && t.TransactionType == "Satış Tahsilatı").Sum(t => t.Amount);
            var cardTotal = txs.Where(t => t.PaymentMethod == "Kredi Kartı" && t.TransactionType == "Satış Tahsilatı").Sum(t => t.Amount);
            var transferTotal = txs.Where(t => t.PaymentMethod == "Havale" && t.TransactionType == "Satış Tahsilatı").Sum(t => t.Amount);
            var sgkTotal = txs.Where(t => t.TransactionType == "SGK Kurum Alacağı").Sum(t => t.Amount);

            var summary = new
            {
                totalOrders = orders.Count,
                totalRevenue = orders.Sum(o => o.TotalAmount),
                totalPaid = orders.Sum(o => o.PaidAmount),
                totalDiscount = orders.Sum(o => o.DiscountAmount),
                cashTotal,
                cardTotal,
                transferTotal,
                sgkTotal,
                ordersList = orders.Select(o => new
                {
                    orderNumber = o.OrderNumber,
                    totalAmount = o.TotalAmount,
                    paidAmount = o.PaidAmount,
                    salesChannel = o.SalesChannel,
                    salesRepresentative = o.SalesRepresentative,
                    time = o.CreatedAt.ToString("HH:mm")
                })
            };

            return Ok(summary);
        }

        [HttpGet("all")]
        [RequirePermission(StaffPermissions.Reports)]
        public async Task<IActionResult> GetAllOrders()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null) return BadRequest();

            var orders = await _context.Orders
                .Where(o => o.OrganizationId == orgId && o.BranchId == branchId.Value)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    dbId = o.Id,
                    id = o.OrderNumber,
                    customer = _context.Customers.Where(c => c.Id == o.CustomerId).Select(c => c.FirstName + " " + c.LastName).FirstOrDefault() ?? "Kayıtsız Müşteri",
                    phone = _context.Customers.Where(c => c.Id == o.CustomerId).Select(c => c.Phone).FirstOrDefault() ?? "-",
                    date = o.CreatedAt.ToString("dd MMM yyyy, HH:mm"),
                    status = o.Status,
                    salesChannel = o.SalesChannel,
                    source = o.SalesChannel,
                    prescriptionId = o.PrescriptionId,
                    amount = o.TotalAmount,
                    paymentMethod = _context.Transactions.Where(t => t.OrderId == o.Id).Select(t => t.PaymentMethod).FirstOrDefault() ?? "Bilinmiyor",
                    address = "Mağaza Teslim",
                    items = _context.OrderItems
                        .Where(oi => oi.OrderId == o.Id)
                        .Select(oi => new {
                            name = _context.Products.Where(p => p.Id == oi.ProductId).Select(p => p.Name).FirstOrDefault(),
                            attr = oi.LensDetails ?? "",
                            lensDetails = oi.LensDetails,
                            price = oi.UnitPrice,
                            qty = oi.Quantity
                        }).ToList(),
                    prescriptionImg = o.PrescriptionId != null
                })
                .ToListAsync();

            return Ok(orders);
        }

        [HttpGet("finance")]
        [RequirePermission(StaffPermissions.Finance)]
        public async Task<IActionResult> GetFinanceSummary()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null) return BadRequest();

            var transactions = await _context.Transactions
                .Where(t => t.OrganizationId == orgId && t.BranchId == branchId.Value)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();

            var cashTotal = transactions.Where(t => t.PaymentMethod == "Nakit" && t.TransactionType == "Satış Tahsilatı").Sum(t => t.Amount);
            var cardTotal = transactions.Where(t => t.PaymentMethod == "Kredi Kartı" && t.TransactionType == "Satış Tahsilatı").Sum(t => t.Amount);
            var transferTotal = transactions.Where(t => t.PaymentMethod == "Havale" && t.TransactionType == "Satış Tahsilatı").Sum(t => t.Amount);

            var recentTransactionsQuery = from t in _context.Transactions
                                          where t.OrganizationId == orgId && t.BranchId == branchId.Value
                                          orderby t.TransactionDate descending
                                          join o in _context.Orders on t.OrderId equals o.Id into orders
                                          from o in orders.DefaultIfEmpty()
                                          join c in _context.Customers on (o == null ? Guid.Empty : o.CustomerId) equals c.Id into customers
                                          from c in customers.DefaultIfEmpty()
                                          select new
                                          {
                                              t.Id,
                                              t.TransactionType,
                                              t.PaymentMethod,
                                              t.Amount,
                                              t.TransactionDate,
                                              SalesRep = o != null ? o.SalesRepresentative : "Belirtilmedi",
                                              CustomerName = c != null ? c.FirstName + " " + c.LastName : "Kayıtsız Müşteri"
                                          };

            var recentTransactionsList = await recentTransactionsQuery.Take(20).ToListAsync();

            var recentTransactions = recentTransactionsList.Select(t => new {
                id = t.Id,
                desc = t.TransactionType,
                type = t.Amount >= 0 ? "income" : "expense",
                method = t.PaymentMethod,
                amount = t.Amount,
                salesRep = t.SalesRep,
                customerName = t.CustomerName,
                time = t.TransactionDate.ToString("dd.MM.yyyy HH:mm")
            }).ToList();

            var weeklyRevenue = new List<object>();
            for(int i = 6; i >= 0; i--)
            {
                var date = DateTime.UtcNow.Date.AddDays(-i);
                var dailyTotal = transactions
                    .Where(t => t.TransactionDate.Date == date && t.TransactionType == "Satış Tahsilatı")
                    .Sum(t => t.Amount);

                weeklyRevenue.Add(new { name = date.ToString("dd MMM"), ciro = dailyTotal });
            }

            var totalRevenue = cashTotal + cardTotal + transferTotal;
            var sgkTotal = transactions.Where(t => t.TransactionType == "SGK Kurum Alacağı").Sum(t => t.Amount);
            var salesCount = transactions.Count(t => t.TransactionType == "Satış Tahsilatı");
            var averageCart = salesCount > 0 ? totalRevenue / salesCount : 0;

            return Ok(new {
                cashVault = cashTotal,
                cardVault = cardTotal,
                transferVault = transferTotal,
                sgkVault = sgkTotal,
                totalRevenue = totalRevenue,
                averageCart = averageCart,
                recentTransactions = recentTransactions,
                weeklyRevenue = weeklyRevenue
            });
        }

        [HttpPut("{orderId}/status")]
        [RequirePermission(StaffPermissions.Reports)]
        public async Task<IActionResult> UpdateOrderStatus(Guid orderId, [FromBody] UpdateOrderStatusRequest request)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null) return BadRequest();

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.Id == orderId && o.OrganizationId == orgId && o.BranchId == branchId.Value);

            if (order == null)
                return NotFound(new { message = "Sipariş bulunamadı." });

            order.Status = request.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Sipariş durumu güncellendi.", status = order.Status });
        }

        private async Task<Product> EnsureLensServiceProductAsync(Guid orgId, Guid branchId)
        {
            const string barcode = "SVC-LENS-LAB";
            var existing = await _context.Products
                .FirstOrDefaultAsync(p => p.OrganizationId == orgId && p.Barcode == barcode && !p.IsDeleted);
            if (existing != null)
                return existing;

            var product = new Product
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                Barcode = barcode,
                Name = "Laboratuvar Cam Siparişi",
                Category = "Cam Hizmeti",
                Brand = "VisionX",
                SalePrice = 0,
                PurchasePrice = 0,
                CreatedAt = DateTime.UtcNow
            };
            _context.Products.Add(product);

            _context.InventoryItems.Add(new InventoryItem
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                BranchId = branchId,
                ProductId = product.Id,
                Quantity = 0,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return product;
        }

        private async Task<List<object>> CreateComplianceNotificationsAsync(
            Guid orgId,
            Guid branchId,
            Order order,
            List<CreateOrderItemRequest> items,
            string customerName,
            decimal sgkAmount)
        {
            var alerts = new List<object>();
            var productIds = items.Where(i => !i.IsServiceItem).Select(i => i.ProductId).Distinct().ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id) && p.OrganizationId == orgId)
                .ToDictionaryAsync(p => p.Id);

            foreach (var item in items.Where(i => !i.IsServiceItem))
            {
                if (!products.TryGetValue(item.ProductId, out var product))
                    continue;
                if (string.IsNullOrWhiteSpace(product.UtsCode))
                    continue;

                var notification = new RegulatoryNotification
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    BranchId = branchId,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    NotificationType = "UTS",
                    ProductId = product.Id,
                    ProductName = product.Name,
                    UtsCode = product.UtsCode,
                    Quantity = item.Quantity,
                    CustomerName = customerName,
                    Status = "Bekliyor",
                    CreatedAt = DateTime.UtcNow
                };
                _context.RegulatoryNotifications.Add(notification);
                alerts.Add(new
                {
                    type = "UTS",
                    productName = product.Name,
                    utsCode = product.UtsCode,
                    quantity = item.Quantity,
                    message = $"ÜTS portalında «verme» bildirimi yapın: {product.UtsCode}"
                });
            }

            if (sgkAmount > 0)
            {
                var medulaNotification = new RegulatoryNotification
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    BranchId = branchId,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    NotificationType = "Medula",
                    ProductName = "SGK Optik Provizyon",
                    CustomerName = customerName,
                    Quantity = 1,
                    Status = "Bekliyor",
                    CreatedAt = DateTime.UtcNow
                };
                _context.RegulatoryNotifications.Add(medulaNotification);
                alerts.Add(new
                {
                    type = "Medula",
                    productName = "SGK Provizyon",
                    utsCode = (string?)null,
                    quantity = 1,
                    sgkAmount,
                    message = $"Medula'da provizyon/kullanım hakkı işlemi yapın (₺{sgkAmount:N2})."
                });
            }

            if (alerts.Count > 0)
                await _context.SaveChangesAsync();

            return alerts;
        }

        private Guid GetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (Guid.TryParse(raw, out var id))
                return id;
            return Guid.Empty;
        }
    }

    public class CreateOrderRequest
    {
        public Guid CustomerId { get; set; }
        public Guid? PrescriptionId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string? SalesChannel { get; set; }
        public string? SalesRepresentative { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal SgkAmount { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? DeliveryAddress { get; set; }
        public List<CreateOrderItemRequest> Items { get; set; } = new();
    }

    public class CreateOrderItemRequest
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? LensDetails { get; set; }
        /// <summary>Cam/laboratuvar hizmet kalemi — stok düşülmez.</summary>
        public bool IsServiceItem { get; set; }
    }

    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
