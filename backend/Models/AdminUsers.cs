using System.ComponentModel.DataAnnotations;

namespace ParkingLotAPI.Models;

public class AdminUserWriteRequest : AdminChangeRequest, IValidatableObject
{
    [Required, StringLength(100)] public string Name { get; init; } = "";
    [Required, EmailAddress, StringLength(256)] public string Email { get; init; } = "";
    [StringLength(20), RegularExpression(@"^[0-9+()\- .]*$")] public string? Phone { get; init; }
    [Required, RegularExpression("^(Customer|Staff|Admin)$")] public string Role { get; init; } = "";
    [Range(1, int.MaxValue)] public int? AssignedParkingLotId { get; init; }
    [Required] public bool? IsActive { get; init; }
    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if ((Role == "Staff") != AssignedParkingLotId.HasValue)
            yield return new("Nhân viên cần một bãi phân công; vai trò khác phải để trống bãi.", [nameof(AssignedParkingLotId)]);
    }
}
public sealed class AdminCreateUserRequest : AdminUserWriteRequest
{
    [Required, StringLength(128, MinimumLength = 8)] public string Password { get; init; } = "";
}
