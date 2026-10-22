using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.Json.Serialization;
using ParkingLotAPI.Infrastructure;

namespace ParkingLotAPI.Models;

public sealed class ReportQuery
{
    [Required, StringLength(10)] public string FromDate { get; init; } = "";
    [Required, StringLength(10)] public string ToDate { get; init; } = "";
    [Range(1, int.MaxValue)] public int? ParkingLotId { get; init; }
    public (DateOnly From, DateOnly To) Dates()
    {
        if (!DateOnly.TryParseExact(FromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var from)
            || !DateOnly.TryParseExact(ToDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var to)
            || from < new DateOnly(2000, 1, 1) || to >= new DateOnly(2100, 1, 1) || to < from || to.DayNumber - from.DayNumber >= 366)
            throw new ApiException(400, "INVALID_DATE_RANGE", "Chọn ngày hợp lệ từ 2000 đến 2099, tối đa 366 ngày; ngày kết thúc được tính trong báo cáo.");
        return (from, to);
    }
}
public sealed record CustomerDashboardSummary(int ActiveVehicleCount, int ConfirmedReservations, int OpenSessions, int CompletedSessions, decimal TotalPaid);
public sealed record OperationDashboardSummary(int ActiveLotCount, int TotalActiveSlots, int AvailableSlots, int OccupiedSlots,
    int MaintenanceSlots, int BufferSlots, int WalkInReadySlots, int ConfirmedReservations, int OpenSessions,
    long TodayCheckIns, long TodayCheckOuts,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] decimal? TodayRevenue);
public sealed record OccupancyView(int ParkingLotId, string ParkingLotName, bool IsActive, int TotalActiveSlots,
    int AvailableSlots, int OccupiedSlots, int MaintenanceSlots, int BufferSlots, int WalkInReadySlots, decimal? OccupancyPercent);
public sealed record DashboardView(string Role, string ScopeName, DateOnly DateVn, DateTime GeneratedAt, object Summary, List<OccupancyView> Lots);
public sealed record ReportTotals(long CheckInCount, long CheckOutCount, long PaymentCount, decimal RevenueVnd, decimal CashRevenueVnd, decimal SimulatedRevenueVnd);
public sealed record ReportDay(DateOnly Date, long CheckInCount, long CheckOutCount, long PaymentCount, decimal RevenueVnd, decimal CashRevenueVnd, decimal SimulatedRevenueVnd);
public sealed record ReportLot(int ParkingLotId, string ParkingLotName, bool IsActive, long CheckInCount, long CheckOutCount,
    long PaymentCount, decimal RevenueVnd, decimal CashRevenueVnd, decimal SimulatedRevenueVnd);
public sealed record DailyReportView(DateOnly FromDate, DateOnly ToDate, int? ParkingLotId, DateTime GeneratedAt,
    ReportTotals Totals, List<ReportDay> Days, List<ReportLot> Lots);
