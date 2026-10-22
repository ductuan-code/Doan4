$ErrorActionPreference = 'Stop'
$taskProjectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $taskProjectRoot
try {
    dotnet run --project backend/ParkingLotAPI.csproj --launch-profile http
} finally {
    Pop-Location
}
