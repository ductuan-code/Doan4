-- Cập nhật quản lý tài khoản: fingerprint yêu cầu tạo user và bộ lọc danh sách.
-- Chỉ ALTER procedure; không đổi bảng, không tạo/xóa tài khoản hoặc thay mật khẩu.
IF DB_ID(N'ParkingLotOnline') IS NULL THROW 51999, 'Database ParkingLotOnline does not exist; run section 1 of sql.md first.', 1;
GO
USE [ParkingLotOnline];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_AdminSaveUser
    @ActorId int,@UserId int,@Name nvarchar(100),@Email nvarchar(256),@Role varchar(20),@AssignedLotId int,
    @IsActive bit,@Reason nvarchar(1000),@Key varchar(128),@Phone varchar(20) = NULL,@PasswordHash nvarchar(512) = NULL,
    @PasswordRequestFingerprint binary(32) = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    -- Backend cung cấp fingerprint PBKDF2 theo ActorId/Key khi tạo user để hash Identity
    -- có salt ngẫu nhiên vẫn replay được. Không lưu mật khẩu/hash Identity trong audit/request.
    -- Caller SQL cũ không truyền tham số mới vẫn đối chiếu hash như trước.
    DECLARE @PasswordFingerprint varchar(64) = COALESCE(CONVERT(varchar(64),@PasswordRequestFingerprint,2),
        CONVERT(varchar(64),HASHBYTES('SHA2_256',CONVERT(varbinary(max),@PasswordHash)),2));
    DECLARE @Payload nvarchar(max) = (SELECT @UserId AS userId,@Name AS name,@Email AS email,@Role AS role,@AssignedLotId AS assignedLotId,
        @IsActive AS isActive,@Phone AS phone,@Reason AS reason,@PasswordFingerprint AS passwordFingerprint
        FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER),@Hash binary(32),@Replay nvarchar(max),@Http smallint,@Response nvarchar(max);
    BEGIN TRY
        BEGIN TRANSACTION;
        EXEC dbo.usp_InternalLock;
        EXEC dbo.usp_InternalAssertActor @ActorId,'Admin';
        EXEC dbo.usp_InternalBeginRequest @ActorId,'ADMIN_SAVE_USER',@Key,@Payload,@Hash OUTPUT,@Replay OUTPUT,@Http OUTPUT;
        IF @Replay IS NOT NULL BEGIN COMMIT; SELECT @Http AS http_status,@Replay AS response_json,CAST(1 AS bit) AS is_replay; RETURN; END;
        DECLARE @NormalizedEmail nvarchar(256) = LOWER(LTRIM(RTRIM(@Email))),@OldRole varchar(20),@OldLot int,@Now datetime2(7) = SYSUTCDATETIME();
        EXEC dbo.usp_InternalExpireReservations @Now;
        IF @Name IS NULL OR LEN(LTRIM(RTRIM(@Name))) = 0 OR @NormalizedEmail IS NULL OR @NormalizedEmail NOT LIKE N'%_@_%._%'
            OR @Role IS NULL OR @Role NOT IN ('Customer','Staff','Admin') OR @IsActive IS NULL
            OR @Reason IS NULL OR LEN(LTRIM(RTRIM(@Reason))) = 0
            OR (@PasswordHash IS NOT NULL AND LEN(@PasswordHash) < 50)
            OR (@Role = 'Staff' AND @AssignedLotId IS NULL) OR (@Role <> 'Staff' AND @AssignedLotId IS NOT NULL)
            THROW 51000, N'Thông tin tài khoản/phân công/lý do không hợp lệ.', 1;
        IF @UserId IS NOT NULL
        BEGIN
            SELECT @OldRole = role,@OldLot = assigned_parking_lot_id FROM dbo.Users WHERE id = @UserId;
            IF @OldRole IS NULL THROW 51004, N'Không tìm thấy tài khoản.', 1;
        END;
        IF @Role = 'Staff' AND NOT EXISTS (SELECT 1 FROM dbo.ParkingLot WHERE id = @AssignedLotId AND is_active = 1)
            AND NOT (@UserId IS NOT NULL AND @IsActive=0 AND EXISTS
                (SELECT 1 FROM dbo.Users WHERE id=@UserId AND role='Staff' AND assigned_parking_lot_id=@AssignedLotId))
            THROW 51009, N'Bãi phân công không hoạt động.', 1;
        IF EXISTS (SELECT 1 FROM dbo.Users WHERE normalized_email = @NormalizedEmail AND (@UserId IS NULL OR id <> @UserId))
            THROW 51009, N'Email đã tồn tại.', 1;
        IF @UserId IS NOT NULL
        BEGIN
            IF @OldRole = 'Admin' AND (@Role <> 'Admin' OR @IsActive = 0)
                AND NOT EXISTS (SELECT 1 FROM dbo.Users WHERE role = 'Admin' AND is_active = 1 AND id <> @UserId)
                THROW 51009, N'Phải còn ít nhất một Admin hoạt động.', 1;
            IF @OldRole = 'Customer' AND @Role <> 'Customer'
                AND (EXISTS (SELECT 1 FROM dbo.Reservation WHERE user_id = @UserId AND status = 'CONFIRMED')
                    OR EXISTS (SELECT 1 FROM dbo.ParkingSession WHERE customer_id = @UserId AND status = 'OPEN'))
                THROW 51009, N'Chưa đổi vai trò Customer khi còn giao dịch đang xử lý.', 1;
            UPDATE dbo.Users SET name = LTRIM(RTRIM(@Name)),normalized_email = @NormalizedEmail,phone = @Phone,role = @Role,
                assigned_parking_lot_id = @AssignedLotId,is_active = @IsActive,password_hash = COALESCE(@PasswordHash,password_hash) WHERE id = @UserId;
        END
        ELSE
        BEGIN
            IF @PasswordHash IS NULL THROW 51000, N'Tài khoản mới cần hash mật khẩu từ backend.', 1;
            INSERT dbo.Users(name,normalized_email,password_hash,phone,role,is_active,assigned_parking_lot_id)
            VALUES (LTRIM(RTRIM(@Name)),@NormalizedEmail,@PasswordHash,@Phone,@Role,@IsActive,@AssignedLotId);
            SET @UserId = CONVERT(int,SCOPE_IDENTITY());
        END;
        SET @Response = (SELECT @UserId AS id,@NormalizedEmail AS email,@OldRole AS oldRole,@Role AS role,
            @OldLot AS oldAssignedLotId,@AssignedLotId AS assignedLotId,@IsActive AS isActive
            FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER);
        INSERT dbo.AuditLog(actor_user_id,action,entity_type,entity_id,reason,details_json,request_id)
        VALUES (@ActorId,'USER_ROLE_ASSIGNMENT_SAVED','Users',@UserId,@Reason,@Response,@Key);
        EXEC dbo.usp_InternalSaveRequest @ActorId,'ADMIN_SAVE_USER',@Key,@Hash,@UserId,200,@Response;
        COMMIT; SELECT 200 AS http_status,@Response AS response_json,CAST(0 AS bit) AS is_replay;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_AdminListUsers @ActorId int,@Page int = 1,@PageSize int = 50,
    @Role varchar(20) = NULL,@Query nvarchar(256) = NULL,@IsActive bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.usp_InternalAssertActor @ActorId,'Admin';
    IF @Page IS NULL OR @Page < 1 OR @Page > 1000000 OR @PageSize IS NULL OR @PageSize NOT BETWEEN 1 AND 200
        THROW 51000, N'Tham số phân trang không hợp lệ.', 1;
    IF @Role IS NOT NULL AND @Role NOT IN ('Customer','Staff','Admin')
        THROW 51000, N'Vai trò lọc không hợp lệ.', 1;
    SET @Query = NULLIF(LTRIM(RTRIM(@Query)),N'');
    SELECT id,name,normalized_email,phone,role,is_active,assigned_parking_lot_id,created_at
    FROM dbo.Users WHERE (@Role IS NULL OR role=@Role) AND (@IsActive IS NULL OR is_active=@IsActive)
        AND (@Query IS NULL OR CHARINDEX(@Query,name)>0 OR CHARINDEX(LOWER(@Query),normalized_email)>0
            OR CHARINDEX(@Query,phone)>0)
    ORDER BY id OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO
