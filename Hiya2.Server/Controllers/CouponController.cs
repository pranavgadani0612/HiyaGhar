using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Controllers
{
    public class CouponSaveDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DiscountType { get; set; } // 0: Percent, 1: Flat
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public decimal MinOrderAmount { get; set; } = 0;
        public DateTime StartDate { get; set; } = DateTime.Now;
        public DateTime EndDate { get; set; } = DateTime.Now.AddMonths(1);
        public int? MaxUsage { get; set; }
        public int? PerCustomerUsage { get; set; }
        public bool IsFirstOrderOnly { get; set; } = false;
        public bool IsActive { get; set; } = true;
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CouponController : ControllerBase
    {
        private readonly DataContext _context;

        public CouponController(DataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var couponsList = await _context.Coupons
                .AsNoTracking()
                .Where(c => !c.IsDeleted)
                .OrderByDescending(c => c.Id)
                .ToListAsync();

            var coupons = couponsList.Select(c => new
            {
                c.Id,
                c.Code,
                c.Description,
                DiscountType = (int)c.DiscountType,
                c.DiscountValue,
                c.MaxDiscountAmount,
                c.MinOrderAmount,
                c.StartDate,
                c.EndDate,
                c.MaxUsage,
                c.PerCustomerUsage,
                c.IsFirstOrderOnly,
                c.IsActive
            }).ToList();

            return Ok(coupons);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (coupon == null)
            {
                return NotFound(new { isSuccess = false, message = "Coupon not found." });
            }

            return Ok(new
            {
                coupon.Id,
                coupon.Code,
                coupon.Description,
                DiscountType = (int)coupon.DiscountType,
                coupon.DiscountValue,
                coupon.MaxDiscountAmount,
                coupon.MinOrderAmount,
                coupon.StartDate,
                coupon.EndDate,
                coupon.MaxUsage,
                coupon.PerCustomerUsage,
                coupon.IsFirstOrderOnly,
                coupon.IsActive
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CouponSaveDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Code))
            {
                return BadRequest(new { isSuccess = false, message = "Coupon code is required." });
            }

            var cleanCode = dto.Code.Trim().ToUpper();
            var codeExists = await _context.Coupons.AnyAsync(c => c.Code.ToUpper() == cleanCode && !c.IsDeleted);
            if (codeExists)
            {
                return BadRequest(new { isSuccess = false, message = "A coupon with this code already exists." });
            }

            var coupon = new Coupon
            {
                Code = cleanCode,
                Description = dto.Description,
                DiscountType = dto.DiscountType == 1 ? CouponDiscountType.Flat : CouponDiscountType.Percent,
                DiscountValue = dto.DiscountValue,
                MaxDiscountAmount = dto.MaxDiscountAmount,
                MinOrderAmount = dto.MinOrderAmount,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                MaxUsage = dto.MaxUsage,
                PerCustomerUsage = dto.PerCustomerUsage,
                IsFirstOrderOnly = dto.IsFirstOrderOnly,
                IsActive = dto.IsActive,
                IsDeleted = false,
                CreatedDate = DateTime.Now
            };

            await _context.Coupons.AddAsync(coupon);
            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = "Coupon created successfully.", coupon });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CouponSaveDto dto)
        {
            var existing = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (existing == null)
            {
                return NotFound(new { isSuccess = false, message = "Coupon not found." });
            }

            if (!string.IsNullOrWhiteSpace(dto.Code))
            {
                var cleanCode = dto.Code.Trim().ToUpper();
                var codeExists = await _context.Coupons.AnyAsync(c => c.Id != id && c.Code.ToUpper() == cleanCode && !c.IsDeleted);
                if (codeExists)
                {
                    return BadRequest(new { isSuccess = false, message = "Another coupon with this code already exists." });
                }
                existing.Code = cleanCode;
            }

            existing.Description = dto.Description;
            existing.DiscountType = dto.DiscountType == 1 ? CouponDiscountType.Flat : CouponDiscountType.Percent;
            existing.DiscountValue = dto.DiscountValue;
            existing.MaxDiscountAmount = dto.MaxDiscountAmount;
            existing.MinOrderAmount = dto.MinOrderAmount;
            existing.StartDate = dto.StartDate;
            existing.EndDate = dto.EndDate;
            existing.MaxUsage = dto.MaxUsage;
            existing.PerCustomerUsage = dto.PerCustomerUsage;
            existing.IsFirstOrderOnly = dto.IsFirstOrderOnly;
            existing.IsActive = dto.IsActive;
            existing.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = "Coupon updated successfully.", coupon = existing });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (coupon == null)
            {
                return NotFound(new { isSuccess = false, message = "Coupon not found." });
            }

            coupon.IsActive = false;
            coupon.IsDeleted = true;
            coupon.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = "Coupon deleted successfully." });
        }
    }
}
