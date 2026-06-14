using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FastBuy.API.Services;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService) => _dashboardService = dashboardService;

    [HttpGet]
    public async Task<IActionResult> Get()
        => Ok(await _dashboardService.GetDashboard());
}
