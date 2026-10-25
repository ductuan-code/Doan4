using System.ComponentModel.DataAnnotations;

namespace ParkingLotAPI.Models;

public sealed class ReservationIssueRequest
{
    [Required, StringLength(1000)] public string Reason { get; init; } = "";
    [Required] public bool? CustomerPresent { get; init; }
}
public sealed class CorrectPlateRequest
{
    [Required, StringLength(32), RegularExpression(@"^[A-Za-z0-9 .\-]+$")] public string PlateNumber { get; init; } = "";
    [Required, StringLength(1000)] public string Reason { get; init; } = "";
    [Required] public bool? VehicleVerified { get; init; }
}
public sealed record ReservationIssueResult(int Id, string Status, DateTime? ServiceIssueAt, DateTime? ResolutionDeadline, DateTime? ResolvedAt);
public sealed record CorrectPlateResult(int Id, string OldPlate, string NewPlate);
