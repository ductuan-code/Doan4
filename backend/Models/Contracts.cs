using System.ComponentModel.DataAnnotations;

namespace ParkingLotAPI.Models;

public sealed class RegisterRequest
{
    [Required, StringLength(100, MinimumLength = 1)] public string Name { get; init; } = "";
    [Required, EmailAddress, StringLength(256)] public string Email { get; init; } = "";
    [Required, StringLength(128, MinimumLength = 8)] public string Password { get; init; } = "";
    [StringLength(20), RegularExpression(@"^[0-9+()\- .]*$")] public string? Phone { get; init; }
}

public sealed class LoginRequest
{
    [Required, EmailAddress, StringLength(256)] public string Email { get; init; } = "";
    [Required, StringLength(128)] public string Password { get; init; } = "";
}

// PATCH nhận trạng thái đầy đủ của biểu mẫu để nội dung replay ổn định.
public sealed class VehicleWriteRequest
{
    [Required, StringLength(32), RegularExpression(@"^[A-Za-z0-9 .\-]+$")]
    public string PlateNumber { get; init; } = "";
    [Required, RegularExpression("^(MOTORBIKE|CAR)$")]
    public string VehicleType { get; init; } = "";
    public bool IsActive { get; init; } = true;
}

public sealed record UserView(int Id, string Name, string Email, string? Phone, string Role,
    bool IsActive, int? AssignedParkingLotId, DateTime CreatedAt);
public sealed record LoginUser(UserView User, string PasswordHash);
public sealed record VehicleView(int Id, int UserId, string PlateNumber, string NormalizedPlateNumber,
    string VehicleType, bool IsActive, DateTime CreatedAt);
public sealed record VehicleMutation(int Id, string PlateNumber, string VehicleType, bool IsActive);
public sealed record MutationResult(int Status, string Json, bool IsReplay);
