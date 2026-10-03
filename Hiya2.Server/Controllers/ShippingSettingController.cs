using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Controllers
{
    public class ShippingSettingRequestDto
    {
        public decimal FreeShippingThreshold { get; set; }
        public decimal StandardShippingPrice { get; set; }
        public decimal ExpressShippingPrice { get; set; }
        public bool EnableExpressDelivery { get; set; }
        public bool EnableFreeShipping { get; set; }
        public bool OnlyAhmedabadDelivery { get; set; }
        public string StandardDeliveryDays { get; set; } = "3–5 business days";
        public string ExpressDeliveryDays { get; set; } = "1–2 business days";
        public bool EnableGstDisplay { get; set; }
        public decimal GstPercent { get; set; }
        public string GstLabel { get; set; } = "Estimated GST (5% Included)";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ShippingSettingController : ControllerBase
    {
        private readonly DataContext _context;

        public ShippingSettingController(DataContext context)
        {
            _context = context;
        }

        private long GetCurrentUserId()
        {
            var claimSub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        private async Task<ShippingSetting> GetOrCreateAsync()
        {
            var setting = await _context.ShippingSettings.FirstOrDefaultAsync(s => s.IsActive);
            if (setting == null)
            {
                setting = new ShippingSetting();
                await _context.ShippingSettings.AddAsync(setting);
                await _context.SaveChangesAsync();
            }
            return setting;
        }

        // PUBLIC endpoint — no auth needed; customers can read shipping config
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get()
        {
            var s = await GetOrCreateAsync();
            return Ok(new
            {
                isSuccess = true,
                settings = new
                {
                    freeShippingThreshold = s.FreeShippingThreshold,
                    standardShippingPrice = s.StandardShippingPrice,
                    expressShippingPrice = s.ExpressShippingPrice,
                    enableExpressDelivery = s.EnableExpressDelivery,
                    enableFreeShipping = s.EnableFreeShipping,
                    onlyAhmedabadDelivery = s.OnlyAhmedabadDelivery,
                    standardDeliveryDays = s.StandardDeliveryDays,
                    expressDeliveryDays = s.ExpressDeliveryDays,
                    enableGstDisplay = s.EnableGstDisplay,
                    gstPercent = s.GstPercent,
                    gstLabel = s.GstLabel,
                }
            });
        }

        // ADMIN only — save settings to DB
        [HttpPut]
        [Authorize]
        public async Task<IActionResult> Update([FromBody] ShippingSettingRequestDto dto)
        {
            if (dto.StandardShippingPrice < 0 || dto.ExpressShippingPrice < 0 || dto.FreeShippingThreshold < 0)
                return BadRequest(new { isSuccess = false, message = "Shipping charges cannot be negative." });

            var setting = await GetOrCreateAsync();

            setting.FreeShippingThreshold = dto.FreeShippingThreshold;
            setting.StandardShippingPrice = dto.StandardShippingPrice;
            setting.ExpressShippingPrice = dto.ExpressShippingPrice;
            setting.EnableExpressDelivery = dto.EnableExpressDelivery;
            setting.EnableFreeShipping = dto.EnableFreeShipping;
            setting.OnlyAhmedabadDelivery = dto.OnlyAhmedabadDelivery;
            setting.StandardDeliveryDays = dto.StandardDeliveryDays ?? "3–5 business days";
            setting.ExpressDeliveryDays = dto.ExpressDeliveryDays ?? "1–2 business days";
            setting.EnableGstDisplay = dto.EnableGstDisplay;
            setting.GstPercent = dto.GstPercent;
            setting.GstLabel = dto.GstLabel ?? "Estimated GST (5% Included)";
            setting.LastModifiedBy = GetCurrentUserId();
            setting.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true, message = "Shipping settings saved to database." });
        }
    }
}
