using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FastBuy.API.Services;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/stock")]
[Authorize]
public class StockController : ControllerBase
{
    private readonly IStockService _stockService;

    public StockController(IStockService stockService) => _stockService = stockService;

    [HttpGet("movements")]
    public async Task<IActionResult> GetMovements([FromQuery] int? productId)
        => Ok(await _stockService.GetMovements(productId));

    [HttpPost("movement")]
    public async Task<IActionResult> AddMovement([FromBody] StockMovementRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var movement = await _stockService.AddMovement(request.ProductId, request.Type, request.Quantity, request.Reason, userId);
        return Created($"api/stock/movements/{movement.Id}", movement);
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
        => Ok(await _stockService.GetLowStock());
}

public class StockMovementRequest
{
    public int ProductId { get; set; }
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Reason { get; set; }
}
