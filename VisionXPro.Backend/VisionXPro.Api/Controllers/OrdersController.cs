using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
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
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null)
                return BadRequest(new { message = "Branch ID is required to create an order." });

            if (request.Items == null || !request.Items.Any())
                return BadRequest(new { message = "Sipariş en az 1 ürün içermelidir." });

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Create Order
                var order = new Order
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    BranchId = branchId.Value,
                    OrderNumber = "TR-" + new Random().Next(10000, 99999).ToString(),
                    TotalAmount = request.TotalAmount,
                    DiscountAmount = request.DiscountAmount,
                    Status = "Tamamlandı",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = Guid.Empty // Ideally from User.Claims.Id
                };

                _context.Orders.Add(order);

                // Add Items and Deduct Inventory
                foreach (var itemReq in request.Items)
                {
                    var orderItem = new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        ProductId = itemReq.ProductId,
                        Quantity = itemReq.Quantity,
                        UnitPrice = itemReq.UnitPrice
                    };
                    _context.OrderItems.Add(orderItem);

                    var inventoryItem = await _context.InventoryItems
                        .FirstOrDefaultAsync(i => i.ProductId == itemReq.ProductId && i.OrganizationId == orgId && i.BranchId == branchId.Value);

                    if (inventoryItem != null)
                    {
                        inventoryItem.Quantity -= itemReq.Quantity;
                        if (inventoryItem.Quantity < 0) inventoryItem.Quantity = 0; // Prevent negative stock
                    }
                }

                // Create Transaction (Payment slip)
                var tx = new Transaction
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    BranchId = branchId.Value,
                    OrderId = order.Id,
                    TransactionType = "Satış Tahsilatı",
                    Amount = request.TotalAmount,
                    PaymentMethod = request.PaymentMethod, // Nakit, Kredi Kartı
                    TransactionDate = DateTime.UtcNow,
                    CreatedBy = Guid.Empty
                };

                _context.Transactions.Add(tx);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Sipariş başarıyla oluşturuldu.", orderNumber = order.OrderNumber });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Bir hata oluştu", details = ex.Message });
            }
        }

        [HttpGet("today")]
        public async Task<IActionResult> GetTodaySales()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null) return BadRequest();

            var today = DateTime.UtcNow.Date;
            var orders = await _context.Orders
                .Where(o => o.OrganizationId == orgId && o.BranchId == branchId.Value && o.CreatedAt >= today)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var summary = new
            {
                TotalOrders = orders.Count,
                TotalRevenue = orders.Sum(o => o.TotalAmount),
                TotalDiscount = orders.Sum(o => o.DiscountAmount),
                OrdersList = orders.Select(o => new { o.OrderNumber, o.TotalAmount, Time = o.CreatedAt.ToString("HH:mm") })
            };

            return Ok(summary);
        }
        [HttpGet("finance")]
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

            var recentTransactions = transactions.Take(20).Select(t => new {
                id = t.Id,
                desc = t.TransactionType,
                type = t.Amount >= 0 ? "income" : "expense",
                method = t.PaymentMethod,
                amount = t.Amount,
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
            var salesCount = transactions.Count(t => t.TransactionType == "Satış Tahsilatı");
            var averageCart = salesCount > 0 ? totalRevenue / salesCount : 0;

            return Ok(new {
                cashVault = cashTotal,
                cardVault = cardTotal,
                transferVault = transferTotal,
                totalRevenue = totalRevenue,
                averageCart = averageCart,
                recentTransactions = recentTransactions,
                weeklyRevenue = weeklyRevenue
            });
        }
    }

    public class CreateOrderRequest
    {
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public List<CreateOrderItemRequest> Items { get; set; } = new();
    }

    public class CreateOrderItemRequest
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
