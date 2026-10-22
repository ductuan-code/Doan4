using System.Data;
using Microsoft.Data.SqlClient;
using ParkingLotAPI.Models;

namespace ParkingLotAPI.Data;

public sealed partial class ParkingRepository
{
    public async Task<List<UserView>> GetAdminUsersAsync(int actorId, int page, int pageSize, string? role, string? query, bool? active, CancellationToken cancellation)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellation);
        await using var command = Command(connection, "dbo.usp_AdminListUsers", Number("@ActorId", actorId),
            Number("@Page", page), Number("@PageSize", pageSize),
            new SqlParameter("@Role", SqlDbType.VarChar, 20) { Value = (object?)role ?? DBNull.Value },
            Text("@Query", 256, query?.Trim()), new SqlParameter("@IsActive", SqlDbType.Bit) { Value = (object?)active ?? DBNull.Value });
        await using var reader = await command.ExecuteReaderAsync(cancellation);
        var users = new List<UserView>();
        while (await reader.ReadAsync(cancellation)) users.Add(ReadUser(reader));
        return users;
    }

    public Task<MutationResult> SaveAdminUserAsync(int actorId, int? id, AdminUserWriteRequest request, string key,
        CancellationToken cancellation, string? passwordHash = null, byte[]? fingerprint = null) =>
        ExecuteMutationAsync("dbo.usp_AdminSaveUser", cancellation, Number("@ActorId", actorId), Number("@UserId", id),
            Text("@Name", 100, request.Name.Trim()), Text("@Email", 256, request.Email.Trim().ToLowerInvariant()),
            new SqlParameter("@Role", SqlDbType.VarChar, 20) { Value = request.Role },
            Number("@AssignedLotId", request.AssignedParkingLotId),
            new SqlParameter("@IsActive", SqlDbType.Bit) { Value = request.IsActive!.Value },
            Text("@Reason", 1000, request.Reason.Trim()),
            new SqlParameter("@Key", SqlDbType.VarChar, 128) { Value = key },
            new SqlParameter("@Phone", SqlDbType.VarChar, 20) { Value = string.IsNullOrWhiteSpace(request.Phone) ? DBNull.Value : request.Phone.Trim() },
            Text("@PasswordHash", 512, passwordHash),
            new SqlParameter("@PasswordRequestFingerprint", SqlDbType.Binary, 32) { Value = (object?)fingerprint ?? DBNull.Value });
}
