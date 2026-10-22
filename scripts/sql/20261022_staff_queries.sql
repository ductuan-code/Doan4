-- Bổ sung bộ lọc mã đặt/mã phiên; không thay bảng hoặc xóa dữ liệu.
IF DB_ID(N'ParkingLotOnline') IS NULL THROW 51999, 'Database ParkingLotOnline does not exist; run section 1 of sql.md first.', 1;
GO
USE [ParkingLotOnline];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_ListReservations
    @ActorId int,@ReservationId int = NULL,@ParkingLotId int = NULL,@Status varchar(15) = NULL,
    @Page int = 1,@PageSize int = 50,@ReservationCode varchar(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.usp_InternalAssertActor @ActorId;
    IF @Page IS NULL OR @Page < 1 OR @Page > 1000000 OR @PageSize IS NULL OR @PageSize NOT BETWEEN 1 AND 200
        THROW 51000, N'Tham số phân trang không hợp lệ.', 1;
    DECLARE @Now datetime2(7) = SYSUTCDATETIME();
    SELECT r.*,z.parking_lot_id,s.code AS slot_code,z.name AS zone_name,p.name AS parking_lot_name,
        CASE WHEN r.status = 'CONFIRMED' AND r.service_issue_at IS NULL AND @Now >= r.expires_at THEN 'EXPIRED'
            WHEN r.status = 'CONFIRMED' AND r.service_issue_at IS NOT NULL
                AND (@Now >= DATEADD(MINUTE,15,r.service_issue_at) OR @Now >= r.end_time) THEN 'UNFULFILLED'
            ELSE r.status END AS effective_status
    FROM dbo.Reservation r JOIN dbo.ParkingSlot s ON s.id = r.slot_id JOIN dbo.Zone z ON z.id = s.zone_id
    JOIN dbo.ParkingLot p ON p.id = z.parking_lot_id JOIN dbo.Users u ON u.id = @ActorId
    WHERE (@ReservationId IS NULL OR r.id = @ReservationId) AND (@ParkingLotId IS NULL OR z.parking_lot_id = @ParkingLotId)
        AND (@ReservationCode IS NULL OR r.reservation_code = @ReservationCode)
        AND (@Status IS NULL OR r.status = @Status)
        AND (u.role = 'Admin' OR (u.role = 'Customer' AND r.user_id = @ActorId)
            OR (u.role = 'Staff' AND u.assigned_parking_lot_id = z.parking_lot_id))
    ORDER BY r.created_at DESC,r.id DESC OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_ListSessions
    @ActorId int,@SessionId int = NULL,@ParkingLotId int = NULL,@Status varchar(12) = NULL,
    @Plate nvarchar(32) = NULL,@Page int = 1,@PageSize int = 50,@SessionCode varchar(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.usp_InternalAssertActor @ActorId;
    IF @Page IS NULL OR @Page < 1 OR @Page > 1000000 OR @PageSize IS NULL OR @PageSize NOT BETWEEN 1 AND 200
        THROW 51000, N'Tham số phân trang không hợp lệ.', 1;
    DECLARE @Normalized varchar(32) = dbo.fn_NormalizePlate(@Plate),@Now datetime2(7) = SYSUTCDATETIME();
    SELECT d.*,CAST(CASE WHEN d.status = 'OPEN' AND d.planned_end_time < @Now THEN 1 ELSE 0 END AS bit) AS is_overstay
    FROM dbo.vw_SessionDetails d JOIN dbo.Users u ON u.id = @ActorId
    WHERE (@SessionId IS NULL OR d.id = @SessionId) AND (@ParkingLotId IS NULL OR d.parking_lot_id = @ParkingLotId)
        AND (@SessionCode IS NULL OR d.session_code = @SessionCode)
        AND (@Status IS NULL OR d.status = @Status) AND (@Plate IS NULL OR d.normalized_plate_number_snapshot = @Normalized)
        AND (u.role = 'Admin' OR (u.role = 'Customer' AND d.customer_id = @ActorId)
            OR (u.role = 'Staff' AND u.assigned_parking_lot_id = d.parking_lot_id))
    ORDER BY d.check_in_time DESC,d.id DESC OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO
