using System.Data;
using Microsoft.Data.SqlClient;
using ParkingLotAPI.Models;

namespace ParkingLotAPI.Data;

public sealed partial class ParkingRepository
{
    public async Task<DashboardView> GetDashboardAsync(int actorId, CancellationToken cancellation)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellation);
        await using var command = Command(connection, "dbo.usp_GetDashboard", Number("@ActorId", actorId));
        await using var r = await command.ExecuteReaderAsync(cancellation);
        await r.ReadAsync(cancellation);
        var role = r.GetString(r.GetOrdinal("role"));
        var scope = r.GetString(r.GetOrdinal("scope_name"));
        var today = DateOnly.FromDateTime(r.GetDateTime(r.GetOrdinal("date_vn")));
        var timestamp = Utc(r, "generated_at");
        await r.NextResultAsync(cancellation);
        await r.ReadAsync(cancellation);
        int Count(string name) => r.GetInt32(r.GetOrdinal(name));
        object summary = role == "Customer" ? new CustomerDashboardSummary(Count("active_vehicle_count"), Count("confirmed_reservations"),
            Count("open_sessions"), Count("completed_sessions"), r.GetDecimal(r.GetOrdinal("total_paid"))) :
            new OperationDashboardSummary(Count("active_lot_count"), Count("total_active_slots"), Count("available_slots"), Count("occupied_slots"),
                Count("maintenance_slots"), Count("buffer_slots"), Count("walk_in_ready_slots"), Count("confirmed_reservations"), Count("open_sessions"),
                r.GetInt64(r.GetOrdinal("today_check_ins")), r.GetInt64(r.GetOrdinal("today_check_outs")),
                r.IsDBNull(r.GetOrdinal("today_revenue")) ? null : r.GetDecimal(r.GetOrdinal("today_revenue")));
        var lots = new List<OccupancyView>();
        if (role != "Customer")
        {
            await r.NextResultAsync(cancellation);
            while (await r.ReadAsync(cancellation)) lots.Add(new(Count("parking_lot_id"), r.GetString(r.GetOrdinal("parking_lot_name")),
                r.GetBoolean(r.GetOrdinal("is_active")), Count("total_active_slots"), Count("available_slots"), Count("occupied_slots"),
                Count("maintenance_slots"), Count("buffer_slots"), Count("walk_in_ready_slots"),
                r.IsDBNull(r.GetOrdinal("occupancy_percent")) ? null : r.GetDecimal(r.GetOrdinal("occupancy_percent"))));
        }
        // Đọc hết result trước khi trả dữ liệu để procedure hoàn tất transaction.
        while (await r.NextResultAsync(cancellation)) { }
        return new(role, scope, today, timestamp, summary, lots);
    }
    public async Task<DailyReportView> GetDailyReportAsync(int actorId, ReportQuery query, CancellationToken cancellation)
    {
        var (from, to) = query.Dates();
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellation);
        await using var command = Command(connection, "dbo.usp_AdminDailyReport", Number("@ActorId", actorId),
            new SqlParameter("@FromDateVN", SqlDbType.Date) { Value = from.ToDateTime(TimeOnly.MinValue) },
            new SqlParameter("@ToDateVNExclusive", SqlDbType.Date) { Value = to.AddDays(1).ToDateTime(TimeOnly.MinValue) }, Number("@ParkingLotId", query.ParkingLotId));
        await using var r = await command.ExecuteReaderAsync(cancellation);
        await r.ReadAsync(cancellation);
        var timestamp = Utc(r, "generated_at");
        await r.NextResultAsync(cancellation);
        long Count(string name) => r.GetInt64(r.GetOrdinal(name));
        decimal Money(string name) => r.GetDecimal(r.GetOrdinal(name));
        var days = new List<ReportDay>();
        while (await r.ReadAsync(cancellation)) days.Add(new(DateOnly.FromDateTime(r.GetDateTime(r.GetOrdinal("date_vn"))),
            Count("check_in_count"), Count("check_out_count"), Count("payment_count"), Money("revenue_vnd"), Money("cash_revenue_vnd"), Money("simulated_revenue_vnd")));
        await r.NextResultAsync(cancellation);
        var lots = new List<ReportLot>();
        while (await r.ReadAsync(cancellation)) lots.Add(new(r.GetInt32(r.GetOrdinal("parking_lot_id")), r.GetString(r.GetOrdinal("parking_lot_name")),
            r.GetBoolean(r.GetOrdinal("is_active")), Count("check_in_count"), Count("check_out_count"), Count("payment_count"), Money("revenue_vnd"), Money("cash_revenue_vnd"), Money("simulated_revenue_vnd")));
        while (await r.NextResultAsync(cancellation)) { }
        var totals = new ReportTotals(days.Sum(d => d.CheckInCount), days.Sum(d => d.CheckOutCount), days.Sum(d => d.PaymentCount),
            days.Sum(d => d.RevenueVnd), days.Sum(d => d.CashRevenueVnd), days.Sum(d => d.SimulatedRevenueVnd));
        return new(from, to, query.ParkingLotId, timestamp, totals, days, lots);
    }
}
