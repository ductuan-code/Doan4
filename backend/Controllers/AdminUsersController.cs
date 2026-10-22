using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ParkingLotAPI.Data;
using ParkingLotAPI.Infrastructure;
using ParkingLotAPI.Models;

namespace ParkingLotAPI.Controllers;

[ApiController, Route("api/admin/users"), Authorize(Roles = "Admin")]
public sealed class AdminUsersController(ParkingRepository repository, IPasswordHasher<object> hasher) : ControllerBase
{
    private int ActorId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static string Key(string? key)
    {
        if (key is null || !Regex.IsMatch(key, @"\A[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\z"))
            throw new ApiException(400, "IDEMPOTENCY_KEY_REQUIRED", "Cần mã yêu cầu hợp lệ cho thay đổi tài khoản.");
        return key;
    }
    private IActionResult Mutation(MutationResult result, bool created = false)
    {
        using var json = JsonDocument.Parse(result.Json);
        if (result.IsReplay) Response.Headers["Idempotency-Replayed"] = "true";
        return StatusCode(created ? 201 : result.Status, json.RootElement.Clone());
    }
    [HttpGet]
    public async Task<IActionResult> List([FromQuery, Range(1, 1000000)] int page = 1,
        [FromQuery, Range(1, 200)] int pageSize = 20,
        [FromQuery, RegularExpression("^(Customer|Staff|Admin)$")] string? role = null,
        [FromQuery, StringLength(256)] string? query = null, [FromQuery] bool? isActive = null,
        CancellationToken cancellation = default) =>
        Ok(await repository.GetAdminUsersAsync(ActorId, page, pageSize, role, query, isActive, cancellation));

    [HttpPost]
    public async Task<IActionResult> Create(AdminCreateUserRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation)
    {
        var requestKey = Key(key);
        // Identity vẫn tạo hash lưu Users với salt ngẫu nhiên. Fingerprint này chỉ dùng
        // để so nội dung replay; gắn với actor/key và có chi phí PBKDF2, không dùng SHA nhanh
        // cho mật khẩu, không đưa mật khẩu/hash/fingerprint vào audit hoặc phản hồi API.
        var salt = SHA256.HashData(Encoding.UTF8.GetBytes($"ParkingLotAPI.AdminCreateUser.v1:{ActorId}:{requestKey}"));
        var fingerprint = Rfc2898DeriveBytes.Pbkdf2(request.Password, salt, 100000, HashAlgorithmName.SHA512, 32);
        var passwordHash = hasher.HashPassword(new object(), request.Password);
        return Mutation(await repository.SaveAdminUserAsync(ActorId, null, request, requestKey, cancellation, passwordHash, fingerprint), true);
    }
    [HttpPut("{id:int:min(1)}")]
    public async Task<IActionResult> Update(int id, AdminUserWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Mutation(await repository.SaveAdminUserAsync(ActorId, id, request, Key(key), cancellation));
}
