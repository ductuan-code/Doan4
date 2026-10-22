using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingLotAPI.Data;
using ParkingLotAPI.Infrastructure;
using ParkingLotAPI.Models;

namespace ParkingLotAPI.Controllers;

[ApiController, Route("api/vehicles"), Authorize(Roles = "Customer")]
public sealed class VehiclesController(ParkingRepository repository) : ControllerBase
{
    private int ActorId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellation) => Ok(await repository.GetVehiclesAsync(ActorId, cancellation));
    [HttpPost]
    public async Task<IActionResult> Create(VehicleWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        await Save(null, request, key, cancellation);
    [HttpPatch("{id:int:min(1)}")]
    public async Task<IActionResult> Update(int id, VehicleWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        await Save(id, request, key, cancellation);
    private async Task<IActionResult> Save(int? id, VehicleWriteRequest request, string? key, CancellationToken cancellation)
    {
        if (key is null || !Regex.IsMatch(key, @"\A[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\z"))
            throw new ApiException(400, "IDEMPOTENCY_KEY_REQUIRED", "Cần Idempotency-Key hợp lệ cho thao tác lưu phương tiện.");
        var normalized = Regex.Replace(request.PlateNumber, "[ .-]", "");
        if (normalized.Length is < 3 or > 20)
            throw new ApiException(400, "INVALID_PLATE", "Biển số phải có từ 3 đến 20 ký tự chữ và số sau chuẩn hóa.");
        var result = await repository.SaveVehicleAsync(ActorId, id, request, key, cancellation);
        using var json = JsonDocument.Parse(result.Json);
        var body = json.RootElement;
        var vehicle = new VehicleMutation(body.GetProperty("id").GetInt32(), body.GetProperty("plate").GetString()!,
            body.GetProperty("vehicleType").GetString()!, body.GetProperty("isActive").GetBoolean());
        if (result.IsReplay) Response.Headers["Idempotency-Replayed"] = "true";
        return id is null ? StatusCode(201, vehicle) : Ok(vehicle);
    }
}
