using System.ComponentModel.DataAnnotations;

namespace ParkingLotAPI.Models;

public class AdminChangeRequest
{
    [Required, StringLength(1000)] public string Reason { get; init; } = "";
}
public class ParkingConfigRequest : AdminChangeRequest
{
    [Required] public bool? IsActive { get; init; }
}
public sealed class ParkingLotWriteRequest : ParkingConfigRequest
{
    [Required, StringLength(150)] public string Name { get; init; } = "";
    [Required, StringLength(500)] public string Address { get; init; } = "";
}
public sealed class ZoneWriteRequest : ParkingConfigRequest
{
    [Range(1, int.MaxValue)] public int ParkingLotId { get; init; }
    [Required, StringLength(100)] public string Name { get; init; } = "";
    [StringLength(50)] public string? FloorLabel { get; init; }
    [Required, RegularExpression("^(MOTORBIKE|CAR)$")] public string VehicleType { get; init; } = "";
}
public sealed class SlotWriteRequest : ParkingConfigRequest
{
    [Range(1, int.MaxValue)] public int ZoneId { get; init; }
    [Required, StringLength(30), RegularExpression(@"^[A-Za-z0-9_-]+$")] public string Code { get; init; } = "";
    [Required] public bool? AcceptsReservations { get; init; }
}
public sealed class MaintenanceWriteRequest : AdminChangeRequest
{
    [Required] public bool? IsMaintenance { get; init; }
}
public sealed class PriceWriteRequest : AdminChangeRequest
{
    [Required, Range(typeof(decimal), "1", "1000000000")] public decimal? PricePerHour { get; init; }
}
public sealed record AdminLotView(int Id, string Name, string Address, bool IsActive, int ZoneCount, int SlotCount, int ActiveSlotCount);
public sealed record AdminZoneView(int Id, int ParkingLotId, string Name, string? FloorLabel, string VehicleType, bool IsActive, int SlotCount);
public sealed record AdminSlotView(int Id, int ZoneId, string Code, bool AcceptsReservations, bool IsActive, string OperationalStatus, DateTime? BufferUntil);
public sealed record AdminPriceView(int Id, string VehicleType, decimal PricePerHour, bool IsActive, DateTime UpdatedAt);
