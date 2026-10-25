using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingLotAPI.Data;
using ParkingLotAPI.Infrastructure;
using ParkingLotAPI.Models;

namespace ParkingLotAPI.Controllers;

[ApiController, Route("api"), Authorize(Roles="Staff")]
public sealed class StaffExceptionsController(ParkingRepository repository) : ControllerBase
{
    private int ActorId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static string Key(string? key)
    {
        if (key is null || !Regex.IsMatch(key,@"\A[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\z"))
            throw new ApiException(400,"IDEMPOTENCY_KEY_REQUIRED","Cần mã yêu cầu hợp lệ cho thao tác xử lý sự cố.");
        return key;
    }
    private static DateTime? OptionalTime(JsonElement body, string name) => body.TryGetProperty(name,out var value) && value.ValueKind!=JsonValueKind.Null
        ? DateTime.SpecifyKind(value.GetDateTime(),DateTimeKind.Utc) : null;
    private async Task<IActionResult> Issue(int id, ReservationIssueRequest request, string? key, bool unfulfilled, CancellationToken cancellation)
    {
        if (request.CustomerPresent != true) throw new ApiException(400,"CUSTOMER_NOT_VERIFIED","Cần xác nhận đã đối chiếu khách và xe thực tế tại bãi.");
        var result=await repository.RecordReservationIssueAsync(ActorId,id,request,unfulfilled,Key(key),cancellation);
        using var json=JsonDocument.Parse(result.Json);
        var b=json.RootElement;
        if (result.IsReplay) Response.Headers["Idempotency-Replayed"]="true";
        return StatusCode(result.Status,new ReservationIssueResult(b.GetProperty("id").GetInt32(),b.GetProperty("status").GetString()!,
            OptionalTime(b,"serviceIssueAt"),OptionalTime(b,"resolutionDeadline"),OptionalTime(b,"resolvedAt")));
    }
    [HttpPost("reservations/{id:int:min(1)}/service-issue")]
    public Task<IActionResult> RecordIssue(int id, ReservationIssueRequest request, [FromHeader(Name="Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Issue(id,request,key,false,cancellation);
    [HttpPost("reservations/{id:int:min(1)}/unfulfilled")]
    public Task<IActionResult> Unfulfilled(int id, ReservationIssueRequest request, [FromHeader(Name="Idempotency-Key")] string? key, CancellationToken cancellation) =>
        Issue(id,request,key,true,cancellation);
    [HttpPatch("sessions/{id:int:min(1)}/plate")]
    public async Task<IActionResult> CorrectPlate(int id, CorrectPlateRequest request, [FromHeader(Name="Idempotency-Key")] string? key, CancellationToken cancellation)
    {
        if (request.VehicleVerified!=true) throw new ApiException(400,"VEHICLE_NOT_VERIFIED","Cần xác nhận đã đối chiếu biển số với xe thực tế.");
        var result=await repository.CorrectWalkInPlateAsync(ActorId,id,request,Key(key),cancellation);
        using var json=JsonDocument.Parse(result.Json);
        var b=json.RootElement;
        if (result.IsReplay) Response.Headers["Idempotency-Replayed"]="true";
        return StatusCode(result.Status,new CorrectPlateResult(b.GetProperty("id").GetInt32(),b.GetProperty("oldPlate").GetString()!,b.GetProperty("newPlate").GetString()!));
    }
}
