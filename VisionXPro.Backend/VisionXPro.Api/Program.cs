using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using VisionXPro.Api.Middlewares;
using VisionXPro.Api.Services;
using VisionXPro.Application.Interfaces;
using VisionXPro.Infrastructure.Authentication;
using VisionXPro.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddSingleton<IJwtProvider, JwtProvider>();

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "VisionXProSuperSecretKey1234567890";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "VisionXPro",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "VisionXProUsers",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.Migrate();

    var rolesToSeed = new[] { "SuperAdmin", "ShopOwner", "Customer" };
    foreach (var roleName in rolesToSeed)
    {
        if (!context.Roles.Any(r => r.Name == roleName))
        {
            context.Roles.Add(new VisionXPro.Domain.Entities.Role { Id = Guid.NewGuid(), Name = roleName });
            context.SaveChanges();
        }
    }

    if (!context.Organizations.Any(o => o.Name == "Vision X System"))
    {
        var sysOrg = new VisionXPro.Domain.Entities.Organization { Id = Guid.NewGuid(), Name = "Vision X System", SubscriptionPlan = "System", IsActive = true };
        var sysBranch = new VisionXPro.Domain.Entities.Branch { Id = Guid.NewGuid(), OrganizationId = sysOrg.Id, Name = "System Core", City = "System" };
        var superAdmin = new VisionXPro.Domain.Entities.User
        {
            Id = Guid.NewGuid(),
            OrganizationId = sysOrg.Id,
            BranchId = sysBranch.Id,
            FullName = "Super Admin",
            Email = "admin@visionxpro.com",
            Role = "SuperAdmin",
            IsActive = true
        };
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<VisionXPro.Domain.Entities.User>();
        superAdmin.PasswordHash = hasher.HashPassword(superAdmin, "Admin123!");

        context.Organizations.Add(sysOrg);
        context.Branches.Add(sysBranch);
        context.Users.Add(superAdmin);
        context.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<TenantMiddleware>();
app.UseMiddleware<SubscriptionMiddleware>();
app.MapControllers();

app.Run();
