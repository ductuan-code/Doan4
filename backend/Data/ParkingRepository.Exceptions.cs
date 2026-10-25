using System.Data;
using Microsoft.Data.SqlClient;
using ParkingLotAPI.Models;

namespace ParkingLotAPI.Data;

public sealed partial class ParkingRepository
{
    public Task<MutationResult> RecordReservationIssueAsync(int actorId, int id, ReservationIssueRequest request, bool unfulfilled, string key, CancellationToken cancellation) =>
        ExecuteMutationAsync("dbo.usp_ReservationServiceIssue", cancellation, Number("@ActorId",actorId), Number("@ReservationId",id),
            Text("@Reason",1000,request.Reason.Trim()), new SqlParameter("@MarkUnfulfilled",SqlDbType.Bit) { Value=unfulfilled },
            new SqlParameter("@Key",SqlDbType.VarChar,128) { Value=key });
    public Task<MutationResult> CorrectWalkInPlateAsync(int actorId, int id, CorrectPlateRequest request, string key, CancellationToken cancellation) =>
        ExecuteMutationAsync("dbo.usp_CorrectWalkInPlate", cancellation, Number("@ActorId",actorId), Number("@SessionId",id),
            Text("@Plate",32,request.PlateNumber.Trim()), Text("@Reason",1000,request.Reason.Trim()),
            new SqlParameter("@Key",SqlDbType.VarChar,128) { Value=key });
}
