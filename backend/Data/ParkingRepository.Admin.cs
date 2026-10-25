using System.Data;
using Microsoft.Data.SqlClient;
using ParkingLotAPI.Models;

namespace ParkingLotAPI.Data;

public sealed partial class ParkingRepository
{
    public async Task<List<AdminLotView>> GetAdminLotsAsync(CancellationToken cancellation)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellation);
        // Các bảng catalog đã cấp SELECT cho parking_backend. Route này yêu cầu Admin.
        await using var command = new SqlCommand("""
            SELECT p.id,p.name,p.address,p.is_active,
                (SELECT COUNT(*) FROM dbo.Zone z WHERE z.parking_lot_id=p.id) AS zone_count,
                (SELECT COUNT(*) FROM dbo.ParkingSlot s JOIN dbo.Zone z ON z.id=s.zone_id WHERE z.parking_lot_id=p.id) AS slot_count,
                (SELECT COUNT(*) FROM dbo.ParkingSlot s JOIN dbo.Zone z ON z.id=s.zone_id
                    WHERE z.parking_lot_id=p.id AND p.is_active=1 AND z.is_active=1 AND s.is_active=1) AS active_slot_count
            FROM dbo.ParkingLot p ORDER BY p.id
            """, connection);
        await using var r = await command.ExecuteReaderAsync(cancellation);
        var rows = new List<AdminLotView>();
        while (await r.ReadAsync(cancellation)) rows.Add(new(r.GetInt32(0), r.GetString(1), r.GetString(2), r.GetBoolean(3), r.GetInt32(4), r.GetInt32(5), r.GetInt32(6)));
        return rows;
    }
    public async Task<List<AdminZoneView>> GetAdminZonesAsync(int lotId, CancellationToken cancellation)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellation);
        await using var command = new SqlCommand("""
            IF NOT EXISTS(SELECT 1 FROM dbo.ParkingLot WHERE id=@Id) THROW 51004,N'Không tìm thấy bãi.',1;
            SELECT z.id,z.parking_lot_id,z.name,z.floor_label,z.vehicle_type,z.is_active,
                (SELECT COUNT(*) FROM dbo.ParkingSlot s WHERE s.zone_id=z.id) AS slot_count
            FROM dbo.Zone z WHERE z.parking_lot_id=@Id ORDER BY z.id
            """, connection);
        command.Parameters.Add(Number("@Id", lotId));
        await using var r = await command.ExecuteReaderAsync(cancellation);
        var rows = new List<AdminZoneView>();
        while (await r.ReadAsync(cancellation)) rows.Add(new(r.GetInt32(0), r.GetInt32(1), r.GetString(2), OptionalString(r, "floor_label"), r.GetString(4), r.GetBoolean(5), r.GetInt32(6)));
        return rows;
    }
    public async Task<List<AdminSlotView>> GetAdminSlotsAsync(int zoneId, CancellationToken cancellation)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellation);
        await using var command = new SqlCommand("""
            IF NOT EXISTS(SELECT 1 FROM dbo.Zone WHERE id=@Id) THROW 51004,N'Không tìm thấy khu vực.',1;
            SELECT id,zone_id,code,accepts_reservations,is_active,operational_status,buffer_until
            FROM dbo.ParkingSlot WHERE zone_id=@Id ORDER BY id
            """, connection);
        command.Parameters.Add(Number("@Id", zoneId));
        await using var r = await command.ExecuteReaderAsync(cancellation);
        var rows = new List<AdminSlotView>();
        while (await r.ReadAsync(cancellation)) rows.Add(new(r.GetInt32(0), r.GetInt32(1), r.GetString(2), r.GetBoolean(3), r.GetBoolean(4), r.GetString(5), OptionalUtc(r, "buffer_until")));
        return rows;
    }
    public Task<MutationResult> SaveAdminLotAsync(int actorId, int? id, ParkingLotWriteRequest r, string key, CancellationToken cancellation) =>
        SaveAdminConfigAsync(actorId, "ParkingLot", id, r.Name.Trim(), r, key, cancellation, address: r.Address.Trim());
    public Task<MutationResult> SaveAdminZoneAsync(int actorId, int? id, ZoneWriteRequest r, string key, CancellationToken cancellation) =>
        SaveAdminConfigAsync(actorId, "Zone", id, r.Name.Trim(), r, key, cancellation, parentId: r.ParkingLotId, floor: r.FloorLabel?.Trim(), type: r.VehicleType);
    public Task<MutationResult> SaveAdminSlotAsync(int actorId, int? id, SlotWriteRequest r, string key, CancellationToken cancellation) =>
        SaveAdminConfigAsync(actorId, "ParkingSlot", id, r.Code, r, key, cancellation, parentId: r.ZoneId, reserves: r.AcceptsReservations);
    private Task<MutationResult> SaveAdminConfigAsync(int actorId, string entity, int? id, string name, ParkingConfigRequest r,
        string key, CancellationToken cancellation, int? parentId = null, string? address = null, string? floor = null, string? type = null, bool? reserves = null) =>
        ExecuteMutationAsync("dbo.usp_AdminSaveParkingConfig", cancellation, Number("@ActorId", actorId), Number("@Id", id),
            new SqlParameter("@Entity", SqlDbType.VarChar, 20) { Value = entity }, Text("@Name", 150, name),
            new SqlParameter("@IsActive", SqlDbType.Bit) { Value = r.IsActive!.Value },
            new SqlParameter("@Key", SqlDbType.VarChar, 128) { Value = key }, Number("@ParentId", parentId),
            Text("@Address", 500, address), Text("@FloorLabel", 50, floor),
            new SqlParameter("@VehicleType", SqlDbType.VarChar, 12) { Value = (object?)type ?? DBNull.Value },
            new SqlParameter("@AcceptsReservations", SqlDbType.Bit) { Value = (object?)reserves ?? DBNull.Value }, Text("@Reason", 1000, r.Reason.Trim()));
    public Task<MutationResult> SetSlotMaintenanceAsync(int actorId, int id, MaintenanceWriteRequest r, string key, CancellationToken cancellation) =>
        ExecuteMutationAsync("dbo.usp_SetSlotMaintenance", cancellation, Number("@ActorId", actorId), Number("@SlotId", id),
            new SqlParameter("@IsMaintenance", SqlDbType.Bit) { Value = r.IsMaintenance!.Value }, Text("@Reason", 1000, r.Reason.Trim()),
            new SqlParameter("@Key", SqlDbType.VarChar, 128) { Value = key });
    public async Task<List<AdminPriceView>> GetAdminPricesAsync(bool history, int page, int pageSize, CancellationToken cancellation)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellation);
        await using var command = new SqlCommand("""
            SELECT id,vehicle_type,price_per_hour,is_active,updated_at FROM dbo.PricingRule
            WHERE @History=1 OR is_active=1 ORDER BY updated_at DESC,id DESC
            OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
            """, connection);
        command.Parameters.AddRange([new SqlParameter("@History", SqlDbType.Bit) { Value = history }, Number("@Page", page), Number("@PageSize", pageSize)]);
        await using var r = await command.ExecuteReaderAsync(cancellation);
        var rows = new List<AdminPriceView>();
        while (await r.ReadAsync(cancellation)) rows.Add(new(r.GetInt32(0), r.GetString(1), r.GetDecimal(2), r.GetBoolean(3), Utc(r, "updated_at")));
        return rows;
    }
    public Task<MutationResult> SetAdminPriceAsync(int actorId, string type, PriceWriteRequest r, string key, CancellationToken cancellation) =>
        ExecuteMutationAsync("dbo.usp_AdminSetPrice", cancellation, Number("@ActorId", actorId),
            new SqlParameter("@VehicleType", SqlDbType.VarChar, 12) { Value = type },
            new SqlParameter("@PricePerHour", SqlDbType.Decimal) { Precision = 18, Scale = 0, Value = r.PricePerHour!.Value },
            Text("@Reason", 1000, r.Reason.Trim()), new SqlParameter("@Key", SqlDbType.VarChar, 128) { Value = key });
}
