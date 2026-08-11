using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Globalization;
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
    [Authorize(Roles = "ShopOwner,ShopStaff,Customer")]
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
                            ProductId = prod.Id,
                            prod.Barcode,
                            prod.UtsCode,
                            prod.Name,
                            prod.Category,
                            prod.Brand,
                            prod.PurchasePrice,
                            prod.SalePrice,
                            prod.Origin,
                            prod.PriceUpdateDate,
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
                            prod.UtsCode,
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
        [RequirePermission(StaffPermissions.Stock)]
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
                        SalePrice = request.SalePrice,
                        Origin = request.Origin,
                        PriceUpdateDate = request.PriceUpdateDate
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
        [RequirePermission(StaffPermissions.Stock)]
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
            if (request.Origin != null) product.Origin = request.Origin;
            if (request.PriceUpdateDate != null) product.PriceUpdateDate = request.PriceUpdateDate;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Ürün başarıyla güncellendi." });
        }

        [HttpDelete("{productId}")]
        [RequirePermission(StaffPermissions.Stock)]
        public async Task<IActionResult> DeleteProduct(Guid productId)
        {
            var orgId = _tenantService.GetOrganizationId();

            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId && p.OrganizationId == orgId);

            if (product == null)
                return NotFound(new { message = "Ürün bulunamadı." });

            product.IsDeleted = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Ürün başarıyla silindi." });
        }

        [HttpPost("import")]
        [RequirePermission(StaffPermissions.Stock)]
        public async Task<IActionResult> ImportCsv([FromBody] ImportProductsRequest request)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();
            if (branchId == null)
                return BadRequest(new { message = "Branch ID is required." });
            if (string.IsNullOrWhiteSpace(request.CsvContent))
                return BadRequest(new { message = "CSV içeriği boş." });

            var lines = request.CsvContent
                .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(l => l.Trim())
                .Where(l => l.Length > 0)
                .ToList();
            if (lines.Count < 2)
                return BadRequest(new { message = "En az bir başlık ve bir veri satırı gerekli." });

            var header = lines[0].Split(',').Select(h => h.Trim().ToLowerInvariant()).ToArray();
            int Col(string name) => Array.FindIndex(header, h => h.Contains(name));

            var iBarcode = Col("barkod");
            var iName = Col("ürün") >= 0 ? Col("ürün") : Col("urun");
            var iCategory = Col("kategori");
            var iBrand = Col("marka");
            var iPurchase = Col("alış") >= 0 ? Col("alış") : Col("alis");
            var iSale = Col("satış") >= 0 ? Col("satış") : Col("satis");
            var iQty = Col("miktar") >= 0 ? Col("miktar") : Col("adet");
            var iOrigin = Col("menşei") >= 0 ? Col("menşei") : Col("mensei");

            if (iBarcode < 0 || iName < 0)
                return BadRequest(new { message = "CSV'de Barkod ve Ürün Adı sütunları zorunludur." });

            int imported = 0, skipped = 0;
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                for (int row = 1; row < lines.Count; row++)
                {
                    var cols = lines[row].Split(',');
                    if (cols.Length <= Math.Max(iBarcode, iName)) { skipped++; continue; }

                    var barcode = cols[iBarcode].Trim();
                    var name = cols[iName].Trim();
                    if (string.IsNullOrWhiteSpace(barcode) || string.IsNullOrWhiteSpace(name)) { skipped++; continue; }

                    var category = iCategory >= 0 && iCategory < cols.Length ? cols[iCategory].Trim() : "Çerçeve";
                    var brand = iBrand >= 0 && iBrand < cols.Length ? cols[iBrand].Trim() : "";
                    decimal.TryParse(iPurchase >= 0 && iPurchase < cols.Length ? cols[iPurchase].Trim().Replace(',', '.') : "0", NumberStyles.Any, CultureInfo.InvariantCulture, out var purchase);
                    decimal.TryParse(iSale >= 0 && iSale < cols.Length ? cols[iSale].Trim().Replace(',', '.') : "0", NumberStyles.Any, CultureInfo.InvariantCulture, out var sale);
                    int.TryParse(iQty >= 0 && iQty < cols.Length ? cols[iQty].Trim() : "1", out var qty);
                    if (qty < 1) qty = 1;
                    var origin = iOrigin >= 0 && iOrigin < cols.Length ? cols[iOrigin].Trim() : "Türkiye";

                    var product = await _context.Products
                        .FirstOrDefaultAsync(p => p.OrganizationId == orgId && p.Barcode == barcode && !p.IsDeleted);
                    if (product == null)
                    {
                        product = new Product
                        {
                            Id = Guid.NewGuid(),
                            OrganizationId = orgId,
                            Barcode = barcode,
                            Name = name,
                            Category = string.IsNullOrWhiteSpace(category) ? "Çerçeve" : category,
                            Brand = brand,
                            PurchasePrice = purchase,
                            SalePrice = sale,
                            Origin = origin,
                            PriceUpdateDate = DateTime.UtcNow.ToString("yyyy-MM-dd")
                        };
                        _context.Products.Add(product);
                        await _context.SaveChangesAsync();
                    }

                    var inv = await _context.InventoryItems
                        .FirstOrDefaultAsync(i => i.OrganizationId == orgId && i.BranchId == branchId.Value && i.ProductId == product.Id);
                    if (inv != null)
                        inv.Quantity += qty;
                    else
                    {
                        _context.InventoryItems.Add(new InventoryItem
                        {
                            Id = Guid.NewGuid(),
                            OrganizationId = orgId,
                            BranchId = branchId.Value,
                            ProductId = product.Id,
                            Quantity = qty
                        });
                    }
                    imported++;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = $"{imported} satır içe aktarıldı.", imported, skipped });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "İçe aktarma başarısız.", details = ex.Message });
            }
        }
    }

    public class ImportProductsRequest
    {
        public string CsvContent { get; set; } = string.Empty;
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
        public string? Origin { get; set; }
        public string? PriceUpdateDate { get; set; }
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
        public string? Origin { get; set; }
        public string? PriceUpdateDate { get; set; }
    }
}
