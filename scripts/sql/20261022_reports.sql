-- Dashboard theo vai trò và báo cáo ngày Việt Nam, chỉ thêm/cập nhật thủ tục đọc.
-- Không thay bảng, giá, tài khoản hoặc giao dịch.
IF DB_ID(N'ParkingLotOnline') IS NULL THROW 51999, 'Database ParkingLotOnline does not exist; run section 1 of sql.md first.', 1;
GO
USE [ParkingLotOnline];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_GetDashboard @ActorId int
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @Lock int;
        EXEC @Lock=sys.sp_getapplock @Resource=N'ParkingLotOnline.BusinessWrite',@LockMode='Shared',@LockOwner='Transaction',@LockTimeout=10000;
        IF @Lock<0 THROW 51010,N'Chưa lấy được khóa đọc dữ liệu.',1;
        EXEC dbo.usp_InternalAssertActor @ActorId;
        DECLARE @Role varchar(20),@Lot int,@Scope nvarchar(150),@Now datetime2(7)=SYSUTCDATETIME();
        DECLARE @Today date=CONVERT(date,DATEADD(HOUR,7,@Now));
        DECLARE @From datetime2(7)=DATEADD(HOUR,-7,CONVERT(datetime2(7),@Today)),@To datetime2(7);
        SET @To=DATEADD(DAY,1,@From);
        SELECT @Role=role,@Lot=assigned_parking_lot_id FROM dbo.Users WHERE id=@ActorId;
        SELECT @Scope=name FROM dbo.ParkingLot WHERE id=@Lot;
        SELECT @Role AS role,@Now AS generated_at,@Today AS date_vn,
            CASE WHEN @Role='Admin' THEN N'Toàn hệ thống' WHEN @Role='Staff' THEN @Scope ELSE N'Tài khoản của bạn' END AS scope_name;
        IF @Role='Customer'
        BEGIN
            SELECT (SELECT COUNT(*) FROM dbo.Vehicle WHERE user_id=@ActorId AND is_active=1) AS active_vehicle_count,
                (SELECT COUNT(*) FROM dbo.fn_EffectiveReservations(@Now) WHERE user_id=@ActorId) AS confirmed_reservations,
                (SELECT COUNT(*) FROM dbo.ParkingSession WHERE customer_id=@ActorId AND status='OPEN') AS open_sessions,
                (SELECT COUNT(*) FROM dbo.ParkingSession WHERE customer_id=@ActorId AND status='COMPLETED') AS completed_sessions,
                (SELECT COALESCE(SUM(pay.amount),0) FROM dbo.Payment pay JOIN dbo.ParkingSession ps ON ps.id=pay.session_id
                    WHERE ps.customer_id=@ActorId AND pay.status='PAID') AS total_paid;
        END
        ELSE
        BEGIN
            SELECT p.id AS parking_lot_id,p.name AS parking_lot_name,p.is_active,
                COUNT(i.slot_id) AS total_active_slots,
                SUM(CASE WHEN i.operational_status='AVAILABLE' THEN 1 ELSE 0 END) AS available_slots,
                SUM(CASE WHEN i.operational_status='OCCUPIED' THEN 1 ELSE 0 END) AS occupied_slots,
                SUM(CASE WHEN i.operational_status='MAINTENANCE' THEN 1 ELSE 0 END) AS maintenance_slots,
                SUM(CASE WHEN i.operational_status='AVAILABLE' AND i.buffer_until>@Now THEN 1 ELSE 0 END) AS buffer_slots,
                SUM(CASE WHEN i.operational_status='AVAILABLE' AND i.accepts_reservations=0
                    AND (i.buffer_until IS NULL OR i.buffer_until<=@Now) THEN 1 ELSE 0 END) AS walk_in_ready_slots,
                CAST(100.0*SUM(CASE WHEN i.operational_status='OCCUPIED' THEN 1 ELSE 0 END)
                    /NULLIF(SUM(CASE WHEN i.operational_status IN ('AVAILABLE','OCCUPIED') THEN 1 ELSE 0 END),0) AS decimal(6,2)) AS occupancy_percent
            INTO #Lots FROM dbo.ParkingLot p LEFT JOIN dbo.vw_SlotInventory i ON i.parking_lot_id=p.id
                AND i.lot_is_active=1 AND i.zone_is_active=1 AND i.slot_is_active=1
            WHERE @Role='Admin' OR p.id=@Lot GROUP BY p.id,p.name,p.is_active;
            SELECT (SELECT COUNT(*) FROM #Lots WHERE is_active=1) AS active_lot_count,
                COALESCE(SUM(total_active_slots),0) AS total_active_slots,COALESCE(SUM(available_slots),0) AS available_slots,
                COALESCE(SUM(occupied_slots),0) AS occupied_slots,COALESCE(SUM(maintenance_slots),0) AS maintenance_slots,
                COALESCE(SUM(buffer_slots),0) AS buffer_slots,COALESCE(SUM(walk_in_ready_slots),0) AS walk_in_ready_slots,
                (SELECT COUNT(*) FROM dbo.fn_EffectiveReservations(@Now) r JOIN dbo.vw_SlotInventory i ON i.slot_id=r.slot_id
                    WHERE @Role='Admin' OR i.parking_lot_id=@Lot) AS confirmed_reservations,
                (SELECT COUNT(*) FROM dbo.ParkingSession ps JOIN dbo.vw_SlotInventory i ON i.slot_id=ps.slot_id
                    WHERE ps.status='OPEN' AND (@Role='Admin' OR i.parking_lot_id=@Lot)) AS open_sessions,
                (SELECT COUNT_BIG(*) FROM dbo.ParkingSession ps JOIN dbo.vw_SlotInventory i ON i.slot_id=ps.slot_id
                    WHERE ps.check_in_time>=@From AND ps.check_in_time<@To AND (@Role='Admin' OR i.parking_lot_id=@Lot)) AS today_check_ins,
                (SELECT COUNT_BIG(*) FROM dbo.ParkingSession ps JOIN dbo.vw_SlotInventory i ON i.slot_id=ps.slot_id
                    WHERE ps.check_out_time>=@From AND ps.check_out_time<@To AND (@Role='Admin' OR i.parking_lot_id=@Lot)) AS today_check_outs,
                CASE WHEN @Role='Admin' THEN (SELECT COALESCE(SUM(amount),0) FROM dbo.Payment WHERE status='PAID' AND paid_at>=@From AND paid_at<@To) END AS today_revenue
            FROM #Lots;
            SELECT * FROM #Lots ORDER BY parking_lot_id;
        END;
        COMMIT;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()<>0 ROLLBACK;
        THROW;
    END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_AdminDailyReport
    @ActorId int,@FromDateVN date,@ToDateVNExclusive date,@ParkingLotId int=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @Lock int;
        EXEC @Lock=sys.sp_getapplock @Resource=N'ParkingLotOnline.BusinessWrite',@LockMode='Shared',@LockOwner='Transaction',@LockTimeout=10000;
        IF @Lock<0 THROW 51010,N'Chưa lấy được khóa đọc dữ liệu.',1;
        EXEC dbo.usp_InternalAssertActor @ActorId,'Admin';
        IF @FromDateVN IS NULL OR @ToDateVNExclusive IS NULL OR @FromDateVN<'20000101' OR @ToDateVNExclusive>'21000101'
            OR @ToDateVNExclusive<=@FromDateVN OR DATEDIFF(DAY,@FromDateVN,@ToDateVNExclusive)>366
            THROW 51000,N'Chọn khoảng ngày từ 2000 đến 2099, tối đa 366 ngày.',1;
        IF @ParkingLotId IS NOT NULL AND NOT EXISTS(SELECT 1 FROM dbo.ParkingLot WHERE id=@ParkingLotId)
            THROW 51004,N'Không tìm thấy bãi báo cáo.',1;
        DECLARE @From datetime2(7)=DATEADD(HOUR,-7,CONVERT(datetime2(7),@FromDateVN)),
            @To datetime2(7)=DATEADD(HOUR,-7,CONVERT(datetime2(7),@ToDateVNExclusive));
        SELECT SYSUTCDATETIME() AS generated_at;
        SELECT CONVERT(date,DATEADD(HOUR,7,ps.check_in_time)) AS date_vn,i.parking_lot_id,COUNT_BIG(*) AS total
        INTO #Ins FROM dbo.ParkingSession ps JOIN dbo.vw_SlotInventory i ON i.slot_id=ps.slot_id
        WHERE ps.check_in_time>=@From AND ps.check_in_time<@To AND (@ParkingLotId IS NULL OR i.parking_lot_id=@ParkingLotId)
        GROUP BY CONVERT(date,DATEADD(HOUR,7,ps.check_in_time)),i.parking_lot_id;
        SELECT CONVERT(date,DATEADD(HOUR,7,ps.check_out_time)) AS date_vn,i.parking_lot_id,COUNT_BIG(*) AS total
        INTO #Outs FROM dbo.ParkingSession ps JOIN dbo.vw_SlotInventory i ON i.slot_id=ps.slot_id
        WHERE ps.check_out_time>=@From AND ps.check_out_time<@To AND (@ParkingLotId IS NULL OR i.parking_lot_id=@ParkingLotId)
        GROUP BY CONVERT(date,DATEADD(HOUR,7,ps.check_out_time)),i.parking_lot_id;
        SELECT CONVERT(date,DATEADD(HOUR,7,pay.paid_at)) AS date_vn,i.parking_lot_id,COUNT_BIG(*) AS total,SUM(pay.amount) AS revenue,
            SUM(CASE WHEN pay.method='CASH' THEN pay.amount ELSE 0 END) AS cash,
            SUM(CASE WHEN pay.method='SIMULATED' THEN pay.amount ELSE 0 END) AS simulated
        INTO #Paid FROM dbo.Payment pay JOIN dbo.ParkingSession ps ON ps.id=pay.session_id JOIN dbo.vw_SlotInventory i ON i.slot_id=ps.slot_id
        WHERE pay.status='PAID' AND pay.paid_at>=@From AND pay.paid_at<@To AND (@ParkingLotId IS NULL OR i.parking_lot_id=@ParkingLotId)
        GROUP BY CONVERT(date,DATEADD(HOUR,7,pay.paid_at)),i.parking_lot_id;
        ;WITH Days AS (SELECT @FromDateVN AS d UNION ALL SELECT DATEADD(DAY,1,d) FROM Days WHERE DATEADD(DAY,1,d)<@ToDateVNExclusive)
        SELECT d AS date_vn,
            COALESCE((SELECT SUM(total) FROM #Ins WHERE date_vn=d),0) AS check_in_count,
            COALESCE((SELECT SUM(total) FROM #Outs WHERE date_vn=d),0) AS check_out_count,
            COALESCE((SELECT SUM(total) FROM #Paid WHERE date_vn=d),0) AS payment_count,
            COALESCE((SELECT SUM(revenue) FROM #Paid WHERE date_vn=d),0) AS revenue_vnd,
            COALESCE((SELECT SUM(cash) FROM #Paid WHERE date_vn=d),0) AS cash_revenue_vnd,
            COALESCE((SELECT SUM(simulated) FROM #Paid WHERE date_vn=d),0) AS simulated_revenue_vnd
        FROM Days ORDER BY d OPTION(MAXRECURSION 366);
        SELECT p.id AS parking_lot_id,p.name AS parking_lot_name,p.is_active,
            COALESCE((SELECT SUM(total) FROM #Ins WHERE parking_lot_id=p.id),0) AS check_in_count,
            COALESCE((SELECT SUM(total) FROM #Outs WHERE parking_lot_id=p.id),0) AS check_out_count,
            COALESCE((SELECT SUM(total) FROM #Paid WHERE parking_lot_id=p.id),0) AS payment_count,
            COALESCE((SELECT SUM(revenue) FROM #Paid WHERE parking_lot_id=p.id),0) AS revenue_vnd,
            COALESCE((SELECT SUM(cash) FROM #Paid WHERE parking_lot_id=p.id),0) AS cash_revenue_vnd,
            COALESCE((SELECT SUM(simulated) FROM #Paid WHERE parking_lot_id=p.id),0) AS simulated_revenue_vnd
        FROM dbo.ParkingLot p WHERE @ParkingLotId IS NULL OR p.id=@ParkingLotId ORDER BY p.id;
        COMMIT;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()<>0 ROLLBACK;
        THROW;
    END CATCH;
END;
GO
GRANT EXECUTE ON OBJECT::dbo.usp_GetDashboard TO parking_backend;
GRANT EXECUTE ON OBJECT::dbo.usp_AdminDailyReport TO parking_backend;
GO
