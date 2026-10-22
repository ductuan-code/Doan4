using ParkingLotAPI.Data;

namespace ParkingLotAPI.Services;

// Chạy cả khi SQL Server Agent không có; procedure dùng cùng khóa/transaction với lệnh đặt và check-in.
public sealed class ReservationExpiryService(IServiceScopeFactory scopes, ILogger<ReservationExpiryService> logger,
    IConfiguration configuration) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var seconds = Math.Clamp(configuration.GetValue("ReservationExpiry:IntervalSeconds", 60), 1, 3600);
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(seconds));
        do
        {
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<ParkingRepository>().ExpireReservationsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
            catch (Exception error)
            {
                // Một lần lỗi SQL không được làm dừng toàn bộ website; thử lại ở chu kỳ sau.
                logger.LogError(error, "Không cập nhật được lịch đặt hết hạn; sẽ thử lại ở chu kỳ tiếp theo.");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
