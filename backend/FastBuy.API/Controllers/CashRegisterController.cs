using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FastBuy.API.Services;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/cash-register")]
[Authorize]
public class CashRegisterController : ControllerBase
{
    private readonly ICashRegisterService _cashRegisterService;

    public CashRegisterController(ICashRegisterService cashRegisterService) => _cashRegisterService = cashRegisterService;

    [HttpPost("open")]
    public async Task<IActionResult> Open([FromBody] OpenCashRegisterRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var register = await _cashRegisterService.Open(userId, request.OpeningBalance);
        return Created($"api/cash-register/{register.Id}", register);
    }

    [HttpPut("{id}/close")]
    public async Task<IActionResult> Close(int id)
    {
        var register = await _cashRegisterService.Close(id);
        if (register == null) return NotFound();
        return Ok(register);
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrent()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var register = await _cashRegisterService.GetCurrent(userId);
        if (register == null) return NotFound(new { message = "Nenhum caixa aberto" });
        return Ok(register);
    }

    [HttpPost("{id}/sangria")]
    public async Task<IActionResult> Sangria(int id, [FromBody] CashAdjustmentRequest request)
    {
        await _cashRegisterService.Sangria(id, request.Amount, request.Reason);
        return Ok(new { message = "Sangria realizada" });
    }

    [HttpPost("{id}/suprimento")]
    public async Task<IActionResult> Suprimento(int id, [FromBody] CashAdjustmentRequest request)
    {
        await _cashRegisterService.Suprimento(id, request.Amount, request.Reason);
        return Ok(new { message = "Suprimento realizado" });
    }
}

public class OpenCashRegisterRequest
{
    public decimal OpeningBalance { get; set; }
}

public class CashAdjustmentRequest
{
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
}
