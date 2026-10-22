using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingLotAPI.Data;
using ParkingLotAPI.Models;

namespace ParkingLotAPI.Controllers;

[ApiController, Route("api"), Authorize]
public sealed class ReportingController(ParkingRepository repository) : ControllerBase
{
    private int ActorId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet("dashboard"), Authorize(Roles = "Admin,Staff,Customer")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellation) => Ok(await repository.GetDashboardAsync(ActorId, cancellation));
    [HttpGet("admin/reports"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Report([FromQuery] ReportQuery query, CancellationToken cancellation) =>
        Ok(await repository.GetDailyReportAsync(ActorId, query, cancellation));
}
