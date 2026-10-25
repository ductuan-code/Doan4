using System.ComponentModel.DataAnnotations;

namespace ParkingLotAPI.Models;

public sealed class CheckInRequest
{
    [Range(1, int.MaxValue)] public int SlotId { get; init; }
    [StringLength(40), RegularExpression(@"^RS-[A-F0-9]{32}$")] public string? ReservationCode { get; init; }
    [StringLength(32), RegularExpression(@"^[A-Za-z0-9 .\-]+$")] public string? PlateNumber { get; init; }
    [RegularExpression("^(MOTORBIKE|CAR)$")] public string? VehicleType { get; init; }
    [StringLength(1000)] public string? ReplacementReason { get; init; }
    public bool CustomerAgreed { get; init; }
}
public sealed class CheckOutRequest
{
    [Required, RegularExpression("^(CASH|SIMULATED)$")] public string PaymentMethod { get; init; } = "";
    [Required, Range(typeof(decimal), "1", "999999999999999999")] public decimal? ConfirmedAmount { get; init; }
}
public sealed record SlotOperationView(int Id, string Code, string ZoneName, string ParkingLotName, string VehicleType,
    bool AcceptsReservations, bool IsActive, string Status, bool IsInBuffer, DateTime? BufferUntil, int? OpenSessionId,
    int ParkingLotId, int ZoneId, string? FloorLabel, int ConfirmedReservationCount, string? PlateNumber);
public sealed class StaffMaintenanceRequest
{
    [Required] public bool? IsMaintenance { get; init; }
    [Required, StringLength(1000)] public string Reason { get; init; } = "";
    [Required] public bool? PositionVerified { get; init; }
}
public sealed record SessionView(int Id, string SessionCode, int? ReservationId, string? ReservationCode,
    int? CustomerId, int SlotId, int ParkingLotId, string ParkingLotName, string ZoneName, string SlotCode,
    string PlateNumber, string VehicleType, DateTime CheckInTime, DateTime? CheckOutTime,
    decimal AppliedPricePerHour, int? BillableHours, decimal? TotalFee, string Status, bool IsOverstay,
    int? PaymentId, decimal? PaidAmount, string? PaymentMethod, DateTime? PaidAt, DateTime? PlateCorrectionDeadline, bool CanCorrectPlate);
public sealed record SessionFeeView(int Id, string Status, decimal AppliedPricePerHour, int BillableHours,
    decimal Amount, DateTime CalculatedAt, bool IsEstimate);
public sealed record CheckInResult(int Id, string SessionCode, string Status, DateTime CheckInTime, int SlotId, decimal AppliedPricePerHour);
public sealed record CheckOutResult(int Id, string Status, int PaymentId, decimal Amount, int BillableHours, DateTime CheckOutTime, DateTime BufferUntil);
