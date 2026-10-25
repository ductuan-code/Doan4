using System.Data;
using Microsoft.Data.SqlClient;
using ParkingLotAPI.Models;
using ParkingLotAPI.Infrastructure;

namespace ParkingLotAPI.Data;

public sealed partial class ParkingRepository
{
    private static DateTime? OptionalUtc(SqlDataReader r, string name) => r.IsDBNull(r.GetOrdinal(name)) ? null : Utc(r, name);
    private static int? OptionalInt(SqlDataReader r, string name) => r.IsDBNull(r.GetOrdinal(name)) ? null : r.GetInt32(r.GetOrdinal(name));
    private static decimal? OptionalDecimal(SqlDataReader r, string name) => r.IsDBNull(r.GetOrdinal(name)) ? null : r.GetDecimal(r.GetOrdinal(name));

    public async Task<List<SlotOperationView>> GetSlotOperationsAsync(int actorId, int lotId, CancellationToken cancellation)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellation);
        await using var command = Command(connection, "dbo.usp_GetSlotOperations", Number("@ActorId", actorId), Number("@ParkingLotId", lotId));
        await using var r = await command.ExecuteReaderAsync(cancellation);
        var rows = new List<SlotOperationView>();
        while (await r.ReadAsync(cancellation)) rows.Add(new(r.GetInt32(r.GetOrdinal("slot_id")), r.GetString(r.GetOrdinal("code")),
            r.GetString(r.GetOrdinal("zone_name")), r.GetString(r.GetOrdinal("parking_lot_name")), r.GetString(r.GetOrdinal("vehicle_type")),
            r.GetBoolean(r.GetOrdinal("accepts_reservations")), r.GetBoolean(r.GetOrdinal("slot_is_active")) && r.GetBoolean(r.GetOrdinal("zone_is_active")) && r.GetBoolean(r.GetOrdinal("lot_is_active")),
            r.GetString(r.GetOrdinal("operational_status")), r.GetBoolean(r.GetOrdinal("is_in_buffer")), OptionalUtc(r, "buffer_until"), OptionalInt(r, "open_session_id")));
        return rows;
    }
    public Task<MutationResult> CheckInAsync(int actorId, CheckInRequest request, string key, CancellationToken cancellation) =>
        ExecuteMutationAsync("dbo.usp_CheckIn", cancellation, Number("@ActorId", actorId), Number("@SlotId", request.SlotId),
            new SqlParameter("@Key", SqlDbType.VarChar, 128) { Value = key },
            new SqlParameter("@ReservationCode", SqlDbType.VarChar, 40) { Value = (object?)request.ReservationCode ?? DBNull.Value },
            Text("@Plate", 32, request.PlateNumber?.Trim()),
            new SqlParameter("@VehicleType", SqlDbType.VarChar, 12) { Value = (object?)request.VehicleType ?? DBNull.Value },
            Text("@ReplacementReason", 1000, request.ReplacementReason?.Trim()), new SqlParameter("@CustomerAgreed", SqlDbType.Bit) { Value = request.CustomerAgreed });

    public Task<MutationResult> CheckOutAsync(int actorId, int sessionId, CheckOutRequest request, string key, CancellationToken cancellation) =>
        ExecuteMutationAsync("dbo.usp_CheckOut", cancellation, Number("@ActorId", actorId), Number("@SessionId", sessionId),
            new SqlParameter("@PaymentMethod", SqlDbType.VarChar, 12) { Value = request.PaymentMethod },
            new SqlParameter("@ConfirmedAmount", SqlDbType.Decimal) { Precision = 18, Scale = 0, Value = request.ConfirmedAmount!.Value },
            new SqlParameter("@Key", SqlDbType.VarChar, 128) { Value = key });

    public async Task<List<SessionView>> GetSessionsAsync(int actorId, int? id, string? status, string? plate,
        string? code, int page, int pageSize, CancellationToken cancellation)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellation);
        await using var command = Command(connection, "dbo.usp_ListSessions", Number("@ActorId", actorId), Number("@SessionId", id),
            new SqlParameter("@Status", SqlDbType.VarChar, 12) { Value = (object?)status ?? DBNull.Value }, Text("@Plate", 32, plate),
            new SqlParameter("@SessionCode", SqlDbType.VarChar, 40) { Value = (object?)code ?? DBNull.Value }, Number("@Page", page), Number("@PageSize", pageSize));
        await using var r = await command.ExecuteReaderAsync(cancellation);
        var rows = new List<SessionView>();
        while (await r.ReadAsync(cancellation)) rows.Add(new(r.GetInt32(r.GetOrdinal("id")), r.GetString(r.GetOrdinal("session_code")),
            OptionalInt(r, "reservation_id"), OptionalString(r, "reservation_code"), OptionalInt(r, "customer_id"), r.GetInt32(r.GetOrdinal("slot_id")),
            r.GetInt32(r.GetOrdinal("parking_lot_id")), r.GetString(r.GetOrdinal("parking_lot_name")), r.GetString(r.GetOrdinal("zone_name")), r.GetString(r.GetOrdinal("slot_code")),
            r.GetString(r.GetOrdinal("plate_number_snapshot")), r.GetString(r.GetOrdinal("vehicle_type_snapshot")), Utc(r, "check_in_time"), OptionalUtc(r, "check_out_time"),
            r.GetDecimal(r.GetOrdinal("applied_price_per_hour")), OptionalInt(r, "billable_hours"), OptionalDecimal(r, "total_fee"), r.GetString(r.GetOrdinal("status")),
            r.GetBoolean(r.GetOrdinal("is_overstay")), OptionalInt(r, "payment_id"), OptionalDecimal(r, "paid_amount"), OptionalString(r, "payment_method"), OptionalUtc(r, "paid_at"),
            OptionalUtc(r,"plate_correction_deadline"), r.GetBoolean(r.GetOrdinal("can_correct_plate"))));
        return rows;
    }
    public async Task<SessionFeeView> GetSessionFeeAsync(int actorId, int id, CancellationToken cancellation)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellation);
        await using var command = Command(connection, "dbo.usp_GetSessionFee", Number("@ActorId", actorId), Number("@SessionId", id));
        await using var r = await command.ExecuteReaderAsync(cancellation);
        if (!await r.ReadAsync(cancellation)) throw new ApiException(404, "NOT_FOUND", "Không tìm thấy lượt gửi xe.");
        return new(id, r.GetString(r.GetOrdinal("status")), r.GetDecimal(r.GetOrdinal("applied_price_per_hour")),
            r.GetInt32(r.GetOrdinal("billable_hours")), r.GetDecimal(r.GetOrdinal("amount")), Utc(r, "calculated_at"), r.GetBoolean(r.GetOrdinal("is_estimate")));
    }
}
