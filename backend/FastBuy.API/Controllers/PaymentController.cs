using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FastBuy.API.Services;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/payment")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IEnumerable<IPaymentGateway> _gateways;

    public PaymentController(IEnumerable<IPaymentGateway> gateways) => _gateways = gateways;

    [HttpPost("process")]
    public IActionResult Process([FromBody] ProcessPaymentRequest request)
    {
        var gateway = _gateways.FirstOrDefault(g => g.Method == request.Method);
        if (gateway == null) return BadRequest(new { message = "Método de pagamento inválido" });

        var result = gateway.ProcessPayment(request.Amount, request.AmountPaid);
        return Ok(result);
    }
}

public class ProcessPaymentRequest
{
    public string Method { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal? AmountPaid { get; set; }
}
