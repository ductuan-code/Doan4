using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ParkingLotAPI.Data;
using ParkingLotAPI.Infrastructure;
using ParkingLotAPI.Models;
using ParkingLotAPI.Services;

namespace ParkingLotAPI.Controllers;

[ApiController, Route("api/auth")]
public sealed class AuthController(ParkingRepository repository, IPasswordHasher<object> hasher, TokenService tokens) : ControllerBase
{
    private const string DummyHash = "AQAAAAIAAYagAAAAEJr8QlthgK7YODXAtsncCxrygp19qGe66weahLvmsz9Rym4vixN4isviG8cBG9pRKg==";
    [HttpPost("register"), EnableRateLimiting("authentication")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellation)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ApiException(400, "INVALID_INPUT", "Vui lòng nhập họ tên.");
        var result = await repository.RegisterAsync(request, hasher.HashPassword(new object(), request.Password), cancellation);
        using var response = JsonDocument.Parse(result.Json);
        return StatusCode(201, response.RootElement.Clone());
    }
    [HttpPost("login"), EnableRateLimiting("authentication")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellation)
    {
        var record = await repository.GetLoginUserAsync(request.Email.Trim().ToLowerInvariant(), cancellation);
        PasswordVerificationResult verified;
        try { verified = hasher.VerifyHashedPassword(new object(), record?.PasswordHash ?? DummyHash, request.Password); }
        catch (Exception error) when (error is FormatException or ArgumentException)
        { verified = PasswordVerificationResult.Failed; }
        if (record is null || verified == PasswordVerificationResult.Failed)
            throw new ApiException(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.");
        if (!record.User.IsActive) throw new ApiException(403, "ACCOUNT_DISABLED", "Tài khoản đã bị khóa.");
        var user = await repository.GetProfileAsync(record.User.Id, cancellation);
        var (token, expiresAt) = tokens.Create(user.Id);
        return Ok(new { token, expiresAt, user });
    }
    [HttpGet("me"), Authorize]
    public IActionResult Me() => Ok((UserView)HttpContext.Items[typeof(UserView)]!);
}
