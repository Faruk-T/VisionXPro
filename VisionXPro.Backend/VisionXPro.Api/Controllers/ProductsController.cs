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
    [Authorize(Roles = "ShopOwner,Customer")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;

        public ProductsController(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
        }

        [HttpGet]
        public async Task<IActionResult> GetInventoryProducts()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null)
                return BadRequest(new { message = "Branch ID is required for accessing inventory." });

            var query = from inv in _context.InventoryItems
                        where inv.OrganizationId == orgId && inv.BranchId == branchId.Value
                        join prod in _context.Products on inv.ProductId equals prod.Id
                        select new
                        {
                            inv.Id, // InventoryItemId
                            prod.Barcode,
                            prod.UtsCode,
                            prod.Name,
                            prod.Category,
                            prod.PurchasePrice,
                            prod.SalePrice,
                            inv.Quantity,
                            inv.SerialNumber
                        };

            var inventoryItems = await query.ToListAsync();

            return Ok(inventoryItems);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchByBarcode([FromQuery] string barcode)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null)
                return BadRequest(new { message = "Branch ID is required." });

            var query = from inv in _context.InventoryItems
                        where inv.OrganizationId == orgId && inv.BranchId == branchId.Value
                        join prod in _context.Products on inv.ProductId equals prod.Id
                        where prod.Barcode == barcode || prod.UtsCode == barcode
                        select new
                        {
                            ProductId = prod.Id,
                            prod.Barcode,
                            prod.Name,
                            prod.SalePrice,
                            inv.Quantity
                        };

            var item = await query.FirstOrDefaultAsync();

            if (item == null)
                return NotFound(new { message = "Ürün bulunamadı veya stokta yok." });

            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> AddProduct([FromBody] CreateProductRequest request)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null)
                return BadRequest(new { message = "Branch ID is required to add inventory." });

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var existingProduct = await _context.Products
                    .FirstOrDefaultAsync(p => p.OrganizationId == orgId && p.Barcode == request.Barcode);

                var product = existingProduct;

                if (product == null)
                {
                    product = new Product
                    {
                        Id = Guid.NewGuid(),
                        OrganizationId = orgId,
                        Barcode = request.Barcode,
                        UtsCode = request.UtsCode,
                        Name = request.Name,
                        Category = request.Category,
                        Brand = request.Brand,
                        PurchasePrice = request.PurchasePrice,
                        SalePrice = request.SalePrice
                    };
                    _context.Products.Add(product);
                    await _context.SaveChangesAsync();
                }

                var inventoryData = await _context.InventoryItems
                    .FirstOrDefaultAsync(i => i.OrganizationId == orgId && i.BranchId == branchId.Value && i.ProductId == product.Id);

                if (inventoryData != null)
                {
                    inventoryData.Quantity += request.Quantity;
                }
                else
                {
                    inventoryData = new InventoryItem
                    {
                        Id = Guid.NewGuid(),
                        OrganizationId = orgId,
                        BranchId = branchId.Value,
                        ProductId = product.Id,
                        Quantity = request.Quantity,
                        SerialNumber = request.SerialNumber
                    };
                    _context.InventoryItems.Add(inventoryData);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                
                return Ok(new { message = "Ürün stoğa başarıyla eklendi." });
            }
            catch(Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Bir hata oluştu", details = ex.Message });
            }
        }

        [HttpPut("{productId}")]
        public async Task<IActionResult> EditProduct(Guid productId, [FromBody] EditProductRequest request)
        {
            var orgId = _tenantService.GetOrganizationId();
            
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId && p.OrganizationId == orgId);

            if (product == null)
                return NotFound(new { message = "Ürün bulunamadı." });

            product.Barcode = request.Barcode;
            product.UtsCode = request.UtsCode;
            product.Name = request.Name;
            product.Category = request.Category;
            product.Brand = request.Brand;
            product.PurchasePrice = request.PurchasePrice;
            product.SalePrice = request.SalePrice;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Ürün başarıyla güncellendi." });
        }
    }

    public class CreateProductRequest
    {
        public string Barcode { get; set; } = string.Empty;
        public string? UtsCode { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public decimal PurchasePrice { get; set; }
        public decimal SalePrice { get; set; }
        public int Quantity { get; set; }
        public string? SerialNumber { get; set; }
    }

    public class EditProductRequest
    {
        public string Barcode { get; set; } = string.Empty;
        public string? UtsCode { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public decimal PurchasePrice { get; set; }
        public decimal SalePrice { get; set; }
    }
}
