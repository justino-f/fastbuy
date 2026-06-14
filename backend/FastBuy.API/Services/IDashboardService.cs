using FastBuy.API.DTOs.Dashboard;

namespace FastBuy.API.Services;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboard();
}
