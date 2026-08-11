using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VisionXPro.Application.Interfaces;
using VisionXPro.Persistence;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ShopOwner,ShopStaff")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;

        public DashboardController(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();
            if (branchId == null) return BadRequest();

            var today = DateTime.UtcNow.Date;
            var todayOrders = await _context.Orders
                .Where(o => o.OrganizationId == orgId && o.BranchId == branchId.Value && o.CreatedAt >= today)
                .ToListAsync();

            var totalCustomers = await _context.Customers
                .CountAsync(c => c.OrganizationId == orgId && c.BranchId == branchId.Value && !c.IsDeleted);

            var totalProducts = await _context.InventoryItems
                .Where(i => i.OrganizationId == orgId && i.BranchId == branchId.Value)
                .SumAsync(i => i.Quantity);

            var activeAppointments = await _context.Appointments
                .CountAsync(a => a.OrganizationId == orgId && a.BranchId == branchId.Value && !a.IsDeleted && a.AppointmentDate >= DateTime.UtcNow);

            var monthlyRevenue = await _context.Transactions
                .Where(t => t.OrganizationId == orgId && t.BranchId == branchId.Value
                    && t.TransactionDate >= DateTime.UtcNow.AddDays(-30)
                    && t.TransactionType == "Satış Tahsilatı")
                .SumAsync(t => t.Amount);

            var pendingOrders = await _context.Orders
                .CountAsync(o => o.OrganizationId == orgId && o.BranchId == branchId.Value
                    && (o.Status == "Hazırlanıyor" || o.Status == "Atölyede"));

            return Ok(new
            {
                todayRevenue = todayOrders.Sum(o => o.TotalAmount),
                todayOrderCount = todayOrders.Count,
                totalCustomers,
                totalStock = totalProducts,
                activeAppointments,
                monthlyRevenue,
                pendingOrders
            });
        }

        [HttpGet("weekly-revenue")]
        public async Task<IActionResult> GetWeeklyRevenue()
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

        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();
            if (branchId == null) return BadRequest();

            var employees = await _context.Users
                .Where(u => u.OrganizationId == orgId && u.BranchId == branchId.Value && !u.IsDeleted && u.IsActive)
                .Select(u => new {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.Role
                })
                .ToListAsync();

            return Ok(employees);
        }
    }
}
