using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VisionXPro.Application.Interfaces;
using VisionXPro.Persistence;
using VisionXPro.Api.Authorization;
using VisionXPro.Application.Authorization;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ShopOwner,ShopStaff")]
    public class FinanceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;

        public FinanceController(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
        }

        [HttpGet("daily-summary")]
        [RequirePermission(StaffPermissions.Finance)]
        public async Task<IActionResult> GetDailySummary()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();
            if (branchId == null) return BadRequest();

            var today = DateTime.UtcNow.Date;
            var allTransactions = await _context.Transactions
                .Where(t => t.OrganizationId == orgId && t.BranchId == branchId.Value)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();

            var transactions = allTransactions.Where(t => t.TransactionDate >= today).ToList();

            var cashTotal = transactions.Where(t => t.PaymentMethod == "Nakit" && t.TransactionType == "Satış Tahsilatı").Sum(t => t.Amount);
            var cardTotal = transactions.Where(t => t.PaymentMethod == "Kredi Kartı" && t.TransactionType == "Satış Tahsilatı").Sum(t => t.Amount);
            var transferTotal = transactions.Where(t => t.PaymentMethod == "Havale" && t.TransactionType == "Satış Tahsilatı").Sum(t => t.Amount);
            var sgkTotal = transactions.Where(t => t.TransactionType == "SGK Kurum Alacağı").Sum(t => t.Amount);

            var totalRevenue = cashTotal + cardTotal + transferTotal;
            var salesCount = transactions.Count(t => t.TransactionType == "Satış Tahsilatı");
            var averageCart = salesCount > 0 ? totalRevenue / salesCount : 0;

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

            var recentList = await recentTransactionsQuery.Take(20).ToListAsync();

            var recentTransactions = recentList.Select(t => new {
                id = t.Id,
                desc = t.TransactionType,
                type = t.Amount >= 0 ? "income" : "expense",
                method = t.PaymentMethod,
                amount = t.Amount,
                salesRep = t.SalesRep,
                customerName = t.CustomerName,
                time = t.TransactionDate.ToString("dd.MM.yyyy HH:mm")
            }).ToList();

            return Ok(new {
                cashVault = cashTotal,
                cardVault = cardTotal,
                transferVault = transferTotal,
                sgkVault = sgkTotal,
                totalRevenue,
                averageCart,
                recentTransactions
            });
        }

        [HttpGet("weekly-chart")]
        [RequirePermission(StaffPermissions.Finance)]
        public async Task<IActionResult> GetWeeklyChart()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();
            if (branchId == null) return BadRequest();

            var transactions = await _context.Transactions
                .Where(t => t.OrganizationId == orgId && t.BranchId == branchId.Value
                    && t.TransactionDate >= DateTime.UtcNow.Date.AddDays(-6)
                    && t.TransactionType == "Satış Tahsilatı")
                .ToListAsync();

            var weeklyData = new List<object>();
            for (int i = 6; i >= 0; i--)
            {
                var date = DateTime.UtcNow.Date.AddDays(-i);
                var dailyTotal = transactions.Where(t => t.TransactionDate.Date == date).Sum(t => t.Amount);
                weeklyData.Add(new { name = date.ToString("dd MMM"), ciro = dailyTotal });
            }

            return Ok(weeklyData);
        }
    }
}
