using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ParkingLotAPI.Services;

public sealed class TokenService(string signingKey, string issuer, string audience)
{
    public string Issuer { get; } = issuer;
    public string Audience { get; } = audience;
    public SymmetricSecurityKey Key { get; } = new(Encoding.UTF8.GetBytes(signingKey));
    public (string Token, DateTime ExpiresAt) Create(int userId)
    {
        var now = DateTime.UtcNow;
        var expires = now.AddHours(1);
        var token = new JwtSecurityToken(Issuer, Audience,
            [new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
             new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())],
            now, expires, new SigningCredentials(Key, SecurityAlgorithms.HmacSha256));
        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
