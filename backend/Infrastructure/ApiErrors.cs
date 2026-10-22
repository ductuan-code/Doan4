using Microsoft.Data.SqlClient;

namespace ParkingLotAPI.Infrastructure;

public sealed class ApiException(int status, string code, string message) : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
}
public sealed record ApiError(int Status, string Code, string Message);
public static class ApiErrors
{
    public static ApiError From(Exception exception) => exception switch
    {
        ApiException error => new(error.Status, error.Code, error.Message),
        SqlException error when error.Number == 51000 => new(400, "INVALID_INPUT", error.Message),
        SqlException error when error.Number == 51001 => new(403, "FORBIDDEN", "Tài khoản không có quyền thực hiện thao tác này."),
        SqlException error when error.Number == 51004 => new(404, "NOT_FOUND", "Không tìm thấy dữ liệu trong phạm vi tài khoản."),
        SqlException error when error.Number == 51009 => new(409, "CONFLICT", error.Message),
        SqlException error when error.Number is 2601 or 2627 or 547 => new(409, "CONFLICT", "Dữ liệu trùng hoặc đang được sử dụng."),
        SqlException error when error.Number is 51010 or 1205 => new(503, "RETRY_LATER", "Hệ thống đang bận. Vui lòng thử lại với cùng mã yêu cầu."),
        SqlException => new(503, "DATABASE_UNAVAILABLE", "Chưa kết nối được database. Vui lòng kiểm tra SQL Server và cấu hình kết nối."),
        _ => new(500, "INTERNAL_ERROR", "Không thể hoàn tất yêu cầu. Vui lòng thử lại sau.")
    };
}
