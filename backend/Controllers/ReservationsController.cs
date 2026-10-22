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

[ApiController, Route("api/parking-lots"), Authorize(Roles = "Customer")]
public sealed class ParkingLotsController(ParkingRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellation) => Ok(await repository.GetParkingLotsAsync(cancellation));
    [HttpGet("{id:int:min(1)}/availability")]
    public async Task<IActionResult> Availability(int id, [FromQuery] ReservationWindow request, CancellationToken cancellation) =>
        Ok(await repository.GetAvailabilityAsync(int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), id, request, cancellation));
}

[ApiController, Route("api/reservations"), Authorize(Roles = "Customer")]
public sealed class ReservationsController(ParkingRepository repository) : ControllerBase
{
    private int ActorId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static string Key(string? key)
    {
        if (key is null || !Regex.IsMatch(key, @"\A[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\z"))
            throw new ApiException(400, "IDEMPOTENCY_KEY_REQUIRED", "Cần mã yêu cầu hợp lệ để đặt hoặc hủy chỗ.");
        return key;
    }
    private IActionResult Mutation(MutationResult result)
    {
        using var json = JsonDocument.Parse(result.Json);
        var body = json.RootElement;
        var code = body.TryGetProperty("reservationCode", out var property) ? property.GetString() : null;
        if (result.IsReplay) Response.Headers["Idempotency-Replayed"] = "true";
        return StatusCode(result.Status, new ReservationMutation(body.GetProperty("id").GetInt32(), body.GetProperty("status").GetString()!, code));
    }
    [HttpPost]
    public async Task<IActionResult> Create(CreateReservationRequest request, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Mutation(await repository.CreateReservationAsync(ActorId, request, Key(key), cancellation));
    [HttpPost("{id:int:min(1)}/cancel")]
    public async Task<IActionResult> Cancel(int id, [FromHeader(Name = "Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Mutation(await repository.CancelReservationAsync(ActorId, id, Key(key), cancellation));
    [HttpGet("my")]
    public async Task<IActionResult> Mine([FromQuery, Range(1, 1000000)] int page = 1,
        [FromQuery, Range(1, 200)] int pageSize = 20, CancellationToken cancellation = default) =>
        Ok(await repository.GetReservationsAsync(ActorId, null, page, pageSize, cancellation));
    [HttpGet("{id:int:min(1)}")]
    public async Task<IActionResult> Detail(int id, CancellationToken cancellation)
    {
        var rows = await repository.GetReservationsAsync(ActorId, id, 1, 1, cancellation);
        return rows.Count == 0 ? throw new ApiException(404, "NOT_FOUND", "Không tìm thấy lượt đặt của bạn.") : Ok(rows[0]);
    }
}
