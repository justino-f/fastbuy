using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FastBuy.API.DTOs.Clients;
using FastBuy.API.Services;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/clients")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly IClientService _clientService;

    public ClientsController(IClientService clientService) => _clientService = clientService;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
        => Ok(await _clientService.GetAll(search));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var client = await _clientService.GetById(id);
        if (client == null) return NotFound();
        return Ok(client);
    }

    [HttpGet("{id}/purchases")]
    public async Task<IActionResult> GetPurchaseHistory(int id)
        => Ok(await _clientService.GetPurchaseHistory(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ClientDto dto)
    {
        var client = await _clientService.Create(dto);
        return Created($"api/clients/{client.Id}", client);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ClientDto dto)
    {
        var client = await _clientService.Update(id, dto);
        if (client == null) return NotFound();
        return Ok(client);
    }
}
