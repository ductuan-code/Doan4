-- Bổ sung hạn/khả năng xử lý sự cố và sửa biển số cho giao diện nhân viên.
-- Chỉ cập nhật ba procedure; không đổi bảng, tài khoản hoặc giao dịch.
IF DB_ID(N'ParkingLotOnline') IS NULL THROW 51999, 'Database ParkingLotOnline does not exist; run section 1 of sql.md first.', 1;
GO
USE [ParkingLotOnline];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_ReservationServiceIssue
    @ActorId int,@ReservationId int,@Reason nvarchar(1000),@MarkUnfulfilled bit,@Key varchar(128)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    DECLARE @Payload nvarchar(max) = (SELECT @ReservationId AS reservationId,@Reason AS reason,@MarkUnfulfilled AS markUnfulfilled
        FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER),@Hash binary(32),@Replay nvarchar(max),@Http smallint,@Response nvarchar(max);
    BEGIN TRY
        BEGIN TRANSACTION;
        EXEC dbo.usp_InternalLock;
        DECLARE @Lot int,@Now datetime2(7),@Issue datetime2(7),@Start datetime2(7),@End datetime2(7),@Expires datetime2(7),@Status varchar(15);
        SELECT @Lot = z.parking_lot_id,@Issue = r.service_issue_at,@Start = r.start_time,@End = r.end_time,@Expires = r.expires_at,@Status = r.status
        FROM dbo.Reservation r JOIN dbo.ParkingSlot s ON s.id = r.slot_id JOIN dbo.Zone z ON z.id = s.zone_id WHERE r.id = @ReservationId;
        IF @Lot IS NULL THROW 51004, N'Không tìm thấy lượt đặt.', 1;
        EXEC dbo.usp_InternalAssertActor @ActorId,'Staff',@Lot;
        EXEC dbo.usp_InternalBeginRequest @ActorId,'RESERVATION_ISSUE',@Key,@Payload,@Hash OUTPUT,@Replay OUTPUT,@Http OUTPUT;
        IF @Replay IS NOT NULL BEGIN COMMIT; SELECT @Http AS http_status,@Replay AS response_json,CAST(1 AS bit) AS is_replay; RETURN; END;
        SET @Now = SYSUTCDATETIME();
        IF @Reason IS NULL OR LEN(LTRIM(RTRIM(@Reason))) = 0 OR @MarkUnfulfilled IS NULL
            THROW 51000, N'Phải có lý do và lựa chọn xử lý sự cố.', 1;
        IF @Status <> 'CONFIRMED' OR @Now < DATEADD(MINUTE,-15,@Start)
            OR (@Issue IS NULL AND @Now >= @Expires)
            OR (@Issue IS NOT NULL AND (@Now >= DATEADD(MINUTE,15,@Issue) OR @Now >= @End))
            THROW 51009, N'Lượt đặt không còn trong thời gian ghi nhận/xử lý sự cố.', 1;
        IF @MarkUnfulfilled = 0 AND @Issue IS NOT NULL
            THROW 51009, N'Sự cố đã được ghi; không được kéo dài deadline.', 1;
        UPDATE dbo.Reservation SET service_issue_at = COALESCE(service_issue_at,@Now),issue_reason = @Reason,
            status = CASE WHEN @MarkUnfulfilled = 1 THEN 'UNFULFILLED' ELSE 'CONFIRMED' END,
            resolved_by_staff_id = CASE WHEN @MarkUnfulfilled = 1 THEN @ActorId ELSE NULL END,
            resolved_at = CASE WHEN @MarkUnfulfilled = 1 THEN @Now ELSE NULL END
        WHERE id = @ReservationId;
        DECLARE @IssueAt datetime2(7)=COALESCE(@Issue,@Now),@Deadline datetime2(7);
        SET @Deadline=CASE WHEN DATEADD(MINUTE,15,@IssueAt)<@End THEN DATEADD(MINUTE,15,@IssueAt) ELSE @End END;
        SET @Response = (SELECT @ReservationId AS id,CASE WHEN @MarkUnfulfilled = 1 THEN 'UNFULFILLED' ELSE 'CONFIRMED' END AS status,
            @IssueAt AS serviceIssueAt,@Deadline AS resolutionDeadline,CASE WHEN @MarkUnfulfilled=1 THEN @Now END AS resolvedAt
            FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER);
        INSERT dbo.AuditLog(actor_user_id,action,entity_type,entity_id,reason,details_json,request_id)
        VALUES (@ActorId,CASE WHEN @MarkUnfulfilled = 1 THEN 'RESERVATION_UNFULFILLED' ELSE 'SERVICE_ISSUE_RECORDED' END,
            'Reservation',@ReservationId,@Reason,@Payload,@Key);
        EXEC dbo.usp_InternalSaveRequest @ActorId,'RESERVATION_ISSUE',@Key,@Hash,@ReservationId,200,@Response;
        COMMIT; SELECT 200 AS http_status,@Response AS response_json,CAST(0 AS bit) AS is_replay;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
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
            ELSE r.status END AS effective_status,
        CASE WHEN r.service_issue_at IS NOT NULL THEN
            CASE WHEN DATEADD(MINUTE,15,r.service_issue_at)<r.end_time THEN DATEADD(MINUTE,15,r.service_issue_at) ELSE r.end_time END END AS resolution_deadline,
        CAST(CASE WHEN u.role='Staff' AND r.status='CONFIRMED' AND r.service_issue_at IS NULL
            AND @Now>=DATEADD(MINUTE,-15,r.start_time) AND @Now<r.expires_at THEN 1 ELSE 0 END AS bit) AS can_record_issue,
        CAST(CASE WHEN u.role='Staff' AND r.status='CONFIRMED' AND @Now>=DATEADD(MINUTE,-15,r.start_time)
            AND ((r.service_issue_at IS NULL AND @Now<r.expires_at) OR (r.service_issue_at IS NOT NULL
                AND @Now<DATEADD(MINUTE,15,r.service_issue_at) AND @Now<r.end_time)) THEN 1 ELSE 0 END AS bit) AS can_mark_unfulfilled
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
    SELECT d.*,CAST(CASE WHEN d.status = 'OPEN' AND d.planned_end_time < @Now THEN 1 ELSE 0 END AS bit) AS is_overstay,
        CASE WHEN d.reservation_id IS NULL THEN DATEADD(MINUTE,5,d.check_in_time) END AS plate_correction_deadline,
        CAST(CASE WHEN u.role='Staff' AND d.reservation_id IS NULL AND d.status='OPEN'
            AND @Now<=DATEADD(MINUTE,5,d.check_in_time) THEN 1 ELSE 0 END AS bit) AS can_correct_plate
    FROM dbo.vw_SessionDetails d JOIN dbo.Users u ON u.id = @ActorId
    WHERE (@SessionId IS NULL OR d.id = @SessionId) AND (@ParkingLotId IS NULL OR d.parking_lot_id = @ParkingLotId)
        AND (@SessionCode IS NULL OR d.session_code = @SessionCode)
        AND (@Status IS NULL OR d.status = @Status) AND (@Plate IS NULL OR d.normalized_plate_number_snapshot = @Normalized)
        AND (u.role = 'Admin' OR (u.role = 'Customer' AND d.customer_id = @ActorId)
            OR (u.role = 'Staff' AND u.assigned_parking_lot_id = d.parking_lot_id))
    ORDER BY d.check_in_time DESC,d.id DESC OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO
