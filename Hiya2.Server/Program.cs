using System.Text;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using HIyaghar.Infra;
using Hiya2.Server.Repositories.Customer;
using Hiya2.Server.Repositories.Category;
using Hiya2.Server.Repositories.Product;
using Hiya2.Server.Repositories.HomePageComponent;
using Hiya2.Server.Repositories.Cart;
using Hiya2.Server.Repositories.Wishlist;
using Hiya2.Server.Repositories.GiftHamper;
using Hiya2.Server.Repositories.Review;
using Hiya2.Server.Repositories.Stock;
using Hiya2.Server.Services;
using Hiya2.Server.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<DataContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? "HIYAGHAR_SUPER_SECRET_SECURITY_KEY_2026_PRODUCTION_GRADE_SECRET_KEY!";

builder.Services.AddSingleton<IUserSessionTracker, UserSessionTracker>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "HIYAGHAR.Server",
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"] ?? "HIYAGHAR.Client",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    // No OnTokenValidated session enforcement — multiple devices/browsers can be logged in simultaneously
});

builder.Services.AddSingleton<IAuthorizationPolicyProvider, DynamicPermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ICustomerAuthService, CustomerAuthService>();

builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IHomePageComponentRepository, HomePageComponentRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IStockService, StockService>();
builder.Services.AddHostedService<Hiya2.Server.Services.ReservationExpiryService>();
builder.Services.AddScoped<IGiftHamperRepository, GiftHamperRepository>();
builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<IRewardService, RewardService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IEmailService, EmailService>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<DataContext>();
        context.Database.Migrate();

        context.Database.ExecuteSqlRaw(@"
            IF OBJECT_ID('dbo.[Order]', 'U') IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'CourierName')
                    ALTER TABLE dbo.[Order] ADD [CourierName] NVARCHAR(255) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'TrackingNumber')
                    ALTER TABLE dbo.[Order] ADD [TrackingNumber] NVARCHAR(255) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'TrackingUrl')
                    ALTER TABLE dbo.[Order] ADD [TrackingUrl] NVARCHAR(1000) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'RazorpayOrderId')
                    ALTER TABLE dbo.[Order] ADD [RazorpayOrderId] NVARCHAR(100) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'RazorpayPaymentId')
                    ALTER TABLE dbo.[Order] ADD [RazorpayPaymentId] NVARCHAR(100) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[Order]') AND name = 'RazorpaySignature')
                    ALTER TABLE dbo.[Order] ADD [RazorpaySignature] NVARCHAR(255) NULL;
            END

            IF OBJECT_ID('dbo.[NewsletterSubscriber]', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.[NewsletterSubscriber] (
                    [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [Email] NVARCHAR(255) NOT NULL,
                    [IsActive] BIT NOT NULL DEFAULT 1,
                    [SubscribedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
                    [Source] NVARCHAR(50) NOT NULL DEFAULT 'HOMEPAGE_RETENTION',
                    [IpAddress] NVARCHAR(50) NULL
                );
                CREATE INDEX [IX_NewsletterSubscriber_Email] ON dbo.[NewsletterSubscriber] ([Email]);
            END

            IF OBJECT_ID('dbo.[ShippingSetting]', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.[ShippingSetting] (
                    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [FreeShippingThreshold] DECIMAL(18,2) NOT NULL DEFAULT 500,
                    [StandardShippingPrice] DECIMAL(18,2) NOT NULL DEFAULT 49,
                    [ExpressShippingPrice] DECIMAL(18,2) NOT NULL DEFAULT 99,
                    [EnableExpressDelivery] BIT NOT NULL DEFAULT 1,
                    [EnableFreeShipping] BIT NOT NULL DEFAULT 1,
                    [OnlyAhmedabadDelivery] BIT NOT NULL DEFAULT 1,
                    [StandardDeliveryDays] NVARCHAR(100) NOT NULL DEFAULT N'3–5 business days',
                    [ExpressDeliveryDays] NVARCHAR(100) NOT NULL DEFAULT N'1–2 business days',
                    [EnableGstDisplay] BIT NOT NULL DEFAULT 1,
                    [GstPercent] DECIMAL(5,2) NOT NULL DEFAULT 5,
                    [GstLabel] NVARCHAR(100) NOT NULL DEFAULT N'Estimated GST (5% Included)',
                    [IsActive] BIT NOT NULL DEFAULT 1,
                    [LastModifiedBy] BIGINT NULL,
                    [LastModifiedDate] DATETIME2 NULL
                );
                -- Insert default row so GET always returns data
                INSERT INTO dbo.[ShippingSetting]
                    ([FreeShippingThreshold],[StandardShippingPrice],[ExpressShippingPrice],
                     [EnableExpressDelivery],[EnableFreeShipping],[OnlyAhmedabadDelivery],
                     [StandardDeliveryDays],[ExpressDeliveryDays],
                     [EnableGstDisplay],[GstPercent],[GstLabel],[IsActive])
                VALUES (500, 49, 99, 1, 1, 1,
                        N'3–5 business days', N'1–2 business days',
                        1, 5, N'Estimated GST (5% Included)', 1);
            END

            IF OBJECT_ID('dbo.[Coupon]', 'U') IS NOT NULL
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM sys.columns c
                    JOIN sys.types t ON c.user_type_id = t.user_type_id
                    WHERE c.object_id = OBJECT_ID('dbo.[Coupon]')
                      AND c.name = 'DiscountType'
                      AND t.name = 'int'
                )
                BEGIN
                    ALTER TABLE dbo.[Coupon] ALTER COLUMN [DiscountType] NVARCHAR(50) NOT NULL;
                END
            END

            -- Ensure System Categories exist in LovCategory and LovMaster
            IF OBJECT_ID('dbo.[LovCategory]', 'U') IS NOT NULL AND OBJECT_ID('dbo.[LovMaster]', 'U') IS NOT NULL
            BEGIN
                -- 1. PaymentMode
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'PaymentMode')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('PaymentMode', 'Payment Mode', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'PaymentMode')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('PaymentMode', 'COD', 'Cash on Delivery (COD)', 1, 1, 0, GETDATE()),
                    ('PaymentMode', 'ONLINE', 'Online Payment / UPI / NetBanking', 2, 1, 0, GETDATE()),
                    ('PaymentMode', 'WALLET', 'Digital Wallet', 3, 1, 0, GETDATE());
                END

                -- 2. PaymentStatus
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'PaymentStatus')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('PaymentStatus', 'Payment Status', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'PaymentStatus')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('PaymentStatus', 'Pending', 'Pending', 1, 1, 0, GETDATE()),
                    ('PaymentStatus', 'Paid', 'Paid', 2, 1, 0, GETDATE()),
                    ('PaymentStatus', 'Failed', 'Failed', 3, 1, 0, GETDATE()),
                    ('PaymentStatus', 'Refunded', 'Refunded', 4, 1, 0, GETDATE());
                END

                -- 3. DiscountType
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'DiscountType')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('DiscountType', 'Coupon Discount Type', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'DiscountType')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('DiscountType', 'Percentage', 'Percentage (%)', 1, 1, 0, GETDATE()),
                    ('DiscountType', 'Flat', 'Flat Amount (₹)', 2, 1, 0, GETDATE());
                END

                -- 4. Gender
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'Gender')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('Gender', 'Gender Options', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'Gender')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('Gender', 'Male', 'Male', 1, 1, 0, GETDATE()),
                    ('Gender', 'Female', 'Female', 2, 1, 0, GETDATE()),
                    ('Gender', 'Other', 'Other', 3, 1, 0, GETDATE());
                END

                -- 5. AddressType
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'AddressType')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('AddressType', 'Address Type', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'AddressType')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('AddressType', 'Home', 'Home', 1, 1, 0, GETDATE()),
                    ('AddressType', 'Work', 'Work / Office', 2, 1, 0, GETDATE()),
                    ('AddressType', 'Other', 'Other', 3, 1, 0, GETDATE());
                END

                -- 6. CourierPartner
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'CourierPartner')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('CourierPartner', 'Courier Delivery Partners', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'CourierPartner')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('CourierPartner', 'DTDC', 'DTDC Express', 1, 1, 0, GETDATE()),
                    ('CourierPartner', 'DELHIVERY', 'Delhivery', 2, 1, 0, GETDATE()),
                    ('CourierPartner', 'BLUEDART', 'Blue Dart', 3, 1, 0, GETDATE()),
                    ('CourierPartner', 'EKART', 'Ekart Logistics', 4, 1, 0, GETDATE()),
                    ('CourierPartner', 'SPEEDPOST', 'India Post (Speed Post)', 5, 1, 0, GETDATE()),
                    ('CourierPartner', 'SHADOWFAX', 'Shadowfax', 6, 1, 0, GETDATE()),
                    ('CourierPartner', 'XPRESSBEES', 'Xpressbees', 7, 1, 0, GETDATE()),
                    ('CourierPartner', 'LOCAL', 'Self Pickup / Local Delivery', 8, 1, 0, GETDATE());
                END

                -- 7. ProductSort
                IF NOT EXISTS (SELECT 1 FROM dbo.[LovCategory] WHERE [LovColumn] = 'ProductSort')
                    INSERT INTO dbo.[LovCategory] ([LovColumn], [DisplayText], [IsActive], [IsDeleted], [CreatedDate])
                    VALUES ('ProductSort', 'Product Sorting Options', 1, 0, GETDATE());

                IF NOT EXISTS (SELECT 1 FROM dbo.[LovMaster] WHERE [LovColumn] = 'ProductSort')
                BEGIN
                    INSERT INTO dbo.[LovMaster] ([LovColumn], [LovCode], [LovDesc], [DisplayOrder], [IsActive], [IsDeleted], [CreatedDate]) VALUES
                    ('ProductSort', 'featured', 'Featured / Recommended', 1, 1, 0, GETDATE()),
                    ('ProductSort', 'price-low', 'Price: Low to High', 2, 1, 0, GETDATE()),
                    ('ProductSort', 'price-high', 'Price: High to Low', 3, 1, 0, GETDATE()),
                    ('ProductSort', 'rating', 'Customer Rating', 4, 1, 0, GETDATE()),
                    ('ProductSort', 'newest', 'Newest Arrivals', 5, 1, 0, GETDATE());
                END
            END
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database initialization note: {ex.Message}");
    }
}

app.Run();


