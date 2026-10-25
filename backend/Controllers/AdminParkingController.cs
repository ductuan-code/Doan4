using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingLotAPI.Data;
using ParkingLotAPI.Infrastructure;
using ParkingLotAPI.Models;

namespace ParkingLotAPI.Controllers;

[ApiController, Route("api/admin"), Authorize(Roles = "Admin")]
public sealed class AdminParkingController(ParkingRepository repository) : ControllerBase
{
    private int ActorId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static string Key(string? key)
    {
        if (key is null || !Regex.IsMatch(key, @"\A[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\z"))
            throw new ApiException(400, "IDEMPOTENCY_KEY_REQUIRED", "Cần mã yêu cầu hợp lệ cho thay đổi quản trị.");
        return key;
    }
    private IActionResult Mutation(MutationResult result, bool created = false)
    {
        using var json = JsonDocument.Parse(result.Json);
        if (result.IsReplay) Response.Headers["Idempotency-Replayed"] = "true";
        return StatusCode(created ? 201 : result.Status, json.RootElement.Clone());
    }
    [HttpGet("parking-lots")]
    public async Task<IActionResult> Lots(CancellationToken cancellation) => Ok(await repository.GetAdminLotsAsync(cancellation));
    [HttpPost("parking-lots")]
    public async Task<IActionResult> CreateLot(ParkingLotWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Mutation(await repository.SaveAdminLotAsync(ActorId, null, request, Key(key), cancellation), true);
    [HttpPut("parking-lots/{id:int:min(1)}")]
    public async Task<IActionResult> UpdateLot(int id, ParkingLotWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Mutation(await repository.SaveAdminLotAsync(ActorId, id, request, Key(key), cancellation));
    [HttpGet("parking-lots/{id:int:min(1)}/zones")]
    public async Task<IActionResult> Zones(int id, CancellationToken cancellation) => Ok(await repository.GetAdminZonesAsync(id, cancellation));
    [HttpPost("zones")]
    public async Task<IActionResult> CreateZone(ZoneWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Mutation(await repository.SaveAdminZoneAsync(ActorId, null, request, Key(key), cancellation), true);
    [HttpPut("zones/{id:int:min(1)}")]
    public async Task<IActionResult> UpdateZone(int id, ZoneWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Mutation(await repository.SaveAdminZoneAsync(ActorId, id, request, Key(key), cancellation));
    [HttpGet("zones/{id:int:min(1)}/slots")]
    public async Task<IActionResult> Slots(int id, CancellationToken cancellation) => Ok(await repository.GetAdminSlotsAsync(id, cancellation));
    [HttpPost("slots")]
    public async Task<IActionResult> CreateSlot(SlotWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Mutation(await repository.SaveAdminSlotAsync(ActorId, null, request, Key(key), cancellation), true);
    [HttpPut("slots/{id:int:min(1)}")]
    public async Task<IActionResult> UpdateSlot(int id, SlotWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Mutation(await repository.SaveAdminSlotAsync(ActorId, id, request, Key(key), cancellation));
    [HttpPut("slots/{id:int:min(1)}/maintenance")]
    public async Task<IActionResult> Maintenance(int id, MaintenanceWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Mutation(await repository.SetSlotMaintenanceAsync(ActorId, id, request, Key(key), cancellation));
    [HttpGet("pricing")]
    public async Task<IActionResult> Prices([FromQuery] bool includeHistory = false, [FromQuery, Range(1, 1000000)] int page = 1,
        [FromQuery, Range(1, 200)] int pageSize = 20, CancellationToken cancellation = default) =>
        Ok(await repository.GetAdminPricesAsync(includeHistory, page, pageSize, cancellation));
    [HttpPut("pricing/{vehicleType:regex(^(MOTORBIKE|CAR)$)}")]
    public async Task<IActionResult> Price(string vehicleType, PriceWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation)
    {
        if (request.PricePerHour != decimal.Truncate(request.PricePerHour!.Value))
            throw new ApiException(400, "INVALID_INPUT", "Giá VND phải là số nguyên dương.");
        return Mutation(await repository.SetAdminPriceAsync(ActorId, vehicleType, request, Key(key), cancellation));
    }
}
