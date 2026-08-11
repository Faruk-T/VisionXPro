using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using VisionXPro.Application.Interfaces;
using VisionXPro.Domain.Entities;
using VisionXPro.Persistence;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/shop-settings")]
    [Authorize(Roles = "ShopOwner")]
    public class ShopSettingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;

        public ShopSettingsController(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null)
                return BadRequest(new { message = "Branch ID gereklidir." });

            var settings = await _context.ShopSettings
                .FirstOrDefaultAsync(s => s.OrganizationId == orgId && s.BranchId == branchId.Value);

            if (settings == null)
            {
                // Henüz ayar yoksa varsayılan döndür
                return Ok(new ShopSettingsDto());
            }

            return Ok(new ShopSettingsDto
            {
                StoreName = settings.StoreName,
                TaxOffice = settings.TaxOffice,
                TaxNumber = settings.TaxNumber,
                Phone = settings.Phone,
                Address = settings.Address,
                MedulaFacilityCode = settings.MedulaFacilityCode,
                MedulaPassword = settings.MedulaPassword,
                MedulaRegistryNo = settings.MedulaRegistryNo,
                UtsToken = settings.UtsToken,
                UtsGlnCode = settings.UtsGlnCode,
                SmsProvider = settings.SmsProvider,
                SmsApiToken = settings.SmsApiToken,
                SmsSenderHeader = settings.SmsSenderHeader,
                SmsReadyNotification = settings.SmsReadyNotification,
                SmsBirthdayCampaign = settings.SmsBirthdayCampaign,
                ReceiptFooter = settings.ReceiptFooter,
                ShowPriceOnLabel = settings.ShowPriceOnLabel
            });
        }

        [HttpPut]
        public async Task<IActionResult> SaveSettings([FromBody] ShopSettingsDto dto)
        {
            var orgId = _tenantService.GetOrganizationId();
            var branchId = _tenantService.GetBranchId();

            if (branchId == null)
                return BadRequest(new { message = "Branch ID gereklidir." });

            var settings = await _context.ShopSettings
                .FirstOrDefaultAsync(s => s.OrganizationId == orgId && s.BranchId == branchId.Value);

            if (settings == null)
            {
                settings = new ShopSettings
                {
                    OrganizationId = orgId,
                    BranchId = branchId.Value,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ShopSettings.Add(settings);
            }

            // Genel
            settings.StoreName = dto.StoreName;
            settings.TaxOffice = dto.TaxOffice;
            settings.TaxNumber = dto.TaxNumber;
            settings.Phone = dto.Phone;
            settings.Address = dto.Address;

            // Medula
            settings.MedulaFacilityCode = dto.MedulaFacilityCode;
            settings.MedulaPassword = dto.MedulaPassword;
            settings.MedulaRegistryNo = dto.MedulaRegistryNo;

            // ÜTS
            settings.UtsToken = dto.UtsToken;
            settings.UtsGlnCode = dto.UtsGlnCode;

            // SMS
            settings.SmsProvider = dto.SmsProvider;
            settings.SmsApiToken = dto.SmsApiToken;
            settings.SmsSenderHeader = dto.SmsSenderHeader;
            settings.SmsReadyNotification = dto.SmsReadyNotification;
            settings.SmsBirthdayCampaign = dto.SmsBirthdayCampaign;

            // Fiş
            settings.ReceiptFooter = dto.ReceiptFooter;
            settings.ShowPriceOnLabel = dto.ShowPriceOnLabel;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Ayarlar başarıyla kaydedildi." });
        }
    }

    public class ShopSettingsDto
    {
        public string StoreName { get; set; } = string.Empty;
        public string? TaxOffice { get; set; }
        public string? TaxNumber { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }

        public string? MedulaFacilityCode { get; set; }
        public string? MedulaPassword { get; set; }
        public string? MedulaRegistryNo { get; set; }

        public string? UtsToken { get; set; }
        public string? UtsGlnCode { get; set; }

        public string? SmsProvider { get; set; }
        public string? SmsApiToken { get; set; }
        public string? SmsSenderHeader { get; set; }
        public bool SmsReadyNotification { get; set; } = true;
        public bool SmsBirthdayCampaign { get; set; } = true;

        public string? ReceiptFooter { get; set; }
        public bool ShowPriceOnLabel { get; set; } = true;
    }
}
