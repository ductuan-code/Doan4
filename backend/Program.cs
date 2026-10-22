using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using ParkingLotAPI.Data;
using ParkingLotAPI.Infrastructure;
using ParkingLotAPI.Models;
using ParkingLotAPI.Services;

var builder = WebApplication.CreateBuilder(args);
var signingKey = builder.Configuration["Jwt:SigningKey"];
if (string.IsNullOrWhiteSpace(signingKey))
{
    if (!builder.Environment.IsDevelopment())
        throw new InvalidOperationException("Cần cấu hình Jwt:SigningKey cho môi trường triển khai.");
    signingKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}
if (Encoding.UTF8.GetByteCount(signingKey) < 32)
    throw new InvalidOperationException("Jwt:SigningKey cần ít nhất 32 byte.");
var tokens = new TokenService(signingKey,
    builder.Configuration["Jwt:Issuer"] ?? "ParkingLotAPI",
    builder.Configuration["Jwt:Audience"] ?? "ParkingLotWeb");
builder.Services.AddSingleton(tokens);
builder.Services.AddScoped<ParkingRepository>();
builder.Services.AddSingleton<IPasswordHasher<object>, PasswordHasher<object>>();
builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow);
builder.Services.Configure<ApiBehaviorOptions>(options =>
    options.InvalidModelStateResponseFactory = context => new BadRequestObjectResult(new
    {
        code = "INVALID_INPUT", message = "Vui lòng kiểm tra dữ liệu nhập.",
        errors = context.ModelState.Where(x => x.Value?.Errors.Count > 0)
            .ToDictionary(x => x.Key, x => x.Value!.Errors.Select(e =>
                string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Giá trị không hợp lệ." : e.ErrorMessage)),
        traceId = context.HttpContext.TraceIdentifier
    }));
builder.Services.AddOpenApi();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = tokens.Issuer,
        ValidateAudience = true, ValidAudience = tokens.Audience,
        ValidateIssuerSigningKey = true, IssuerSigningKey = tokens.Key,
        ValidateLifetime = true, RequireExpirationTime = true,
        ValidAlgorithms = [SecurityAlgorithms.HmacSha256], ClockSkew = TimeSpan.FromSeconds(30),
        NameClaimType = ClaimTypes.Name, RoleClaimType = ClaimTypes.Role
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            if (!int.TryParse(context.Principal?.FindFirstValue(JwtRegisteredClaimNames.Sub), out var id))
            { context.Fail("Invalid subject."); return; }
            var repository = context.HttpContext.RequestServices.GetRequiredService<ParkingRepository>();
            UserView user;
            try { user = await repository.GetProfileAsync(id, context.HttpContext.RequestAborted); }
            catch (Microsoft.Data.SqlClient.SqlException error) when (error.Number == 51001)
            { context.Fail("Account unavailable."); return; }
            var identity = (ClaimsIdentity)context.Principal!.Identity!;
            foreach (var claim in identity.FindAll(ClaimTypes.Role).ToList()) identity.RemoveClaim(claim);
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
            identity.AddClaim(new Claim(ClaimTypes.Name, user.Name));
            identity.AddClaim(new Claim(ClaimTypes.Role, user.Role));
            context.HttpContext.Items[typeof(UserView)] = user;
        },
        OnChallenge = async context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { code = "UNAUTHENTICATED",
                message = "Vui lòng đăng nhập lại.", traceId = context.HttpContext.TraceIdentifier });
        },
        OnForbidden = async context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { code = "FORBIDDEN",
                message = "Tài khoản không có quyền thực hiện thao tác này.", traceId = context.HttpContext.TraceIdentifier });
        }
    };
});
builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy => policy
    .WithOrigins(builder.Configuration.GetSection("Frontend:AllowedOrigins").Get<string[]>()
        ?? ["http://localhost:3000", "http://127.0.0.1:3000"])
    .AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("authentication", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    options.OnRejected = async (context, cancellation) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsJsonAsync(new { code = "RATE_LIMITED",
            message = "Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút." }, cancellation);
    };
});

var app = builder.Build();
app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    var exception = context.Features.Get<IExceptionHandlerFeature>()!.Error;
    var error = ApiErrors.From(exception);
    if (error.Status >= 500) app.Logger.LogError(exception, "Request failed: {TraceId}", context.TraceIdentifier);
    context.Response.StatusCode = error.Status;
    await context.Response.WriteAsJsonAsync(new { error.Code, error.Message, traceId = context.TraceIdentifier });
}));
if (app.Environment.IsDevelopment()) app.MapOpenApi();
else app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/api/health", async (ParkingRepository repository, CancellationToken cancellation) =>
{
    await repository.CheckReadyAsync(cancellation);
    return Results.Ok(new { status = "ready", database = "connected" });
});
app.Run();
