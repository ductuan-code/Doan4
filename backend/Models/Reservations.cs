using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.RegularExpressions;
using ParkingLotAPI.Infrastructure;

namespace ParkingLotAPI.Models;

public class ReservationWindow
{
    [Range(1, int.MaxValue)] public int VehicleId { get; init; }
    [Required, StringLength(40)] public string StartTime { get; init; } = "";
    [Required, StringLength(40)] public string EndTime { get; init; } = "";

    public (DateTime Start, DateTime End) UtcWindow()
    {
        static DateTime Parse(string value)
        {
            if (!Regex.IsMatch(value, @"\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?(?:Z|[+-]\d{2}:\d{2})\z") ||
                !DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var time))
                throw new ApiException(400, "INVALID_TIME", "Thời gian cần đúng ISO 8601, kèm Z hoặc múi giờ, ví dụ +07:00.");
            return time.UtcDateTime;
        }
        var start = Parse(StartTime);
        var end = Parse(EndTime);
        if (start > DateTime.MaxValue.AddDays(-1) || end - start < TimeSpan.FromMinutes(30) || end - start > TimeSpan.FromHours(24))
            throw new ApiException(400, "INVALID_TIME", "Thời gian gửi phải từ 30 phút đến 24 giờ.");
        // Giờ bắt đầu được SQL kiểm tra sau bước replay, để retry một lệnh đã thành công vẫn hoạt động.
        return (start, end);
    }
}
public sealed class CreateReservationRequest : ReservationWindow
{
    [Range(1, int.MaxValue)] public int SlotId { get; init; }
}
public sealed record ParkingLotView(int Id, string Name, string Address);
public sealed record AvailableSlotView(int Id, string Code, int ZoneId, string ZoneName, string VehicleType);
public sealed record ReservationView(int Id, string ReservationCode, int VehicleId, int SlotId,
    int ParkingLotId, string ParkingLotName, string ZoneName, string SlotCode, string PlateNumber,
    string VehicleType, DateTime StartTime, DateTime EndTime, DateTime ExpiresAt,
    string Status, DateTime CreatedAt, DateTime? CancelledAt, bool CanCancel,
    DateTime? ServiceIssueAt, string? IssueReason, DateTime? ResolutionDeadline, DateTime? ResolvedAt,
    bool CanRecordIssue, bool CanMarkUnfulfilled);
public sealed record ReservationMutation(int Id, string Status, string? ReservationCode);
