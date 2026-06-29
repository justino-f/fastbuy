using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FastBuy.API.DTOs;
using FastBuy.API.Models;
using FastBuy.API.Services;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/clients")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly IClientService _clientService;

    // Fila FIFO de atendimento — estrutura de dados acadêmica (Queue)
    // Singleton estático para manter estado entre requisições
    private static readonly Queue<Client> _queue = new();

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

    // ==========================================
    // FILA DE ATENDIMENTO (Queue FIFO)
    // Estrutura de dados acadêmica: Queue<Client>
    // Simula fila de atendimento no supermercado
    // ==========================================

    // Adiciona cliente ao final da fila (Enqueue)
    [HttpPost("queue/enqueue")]
    public async Task<IActionResult> Enqueue([FromBody] EnqueueRequest request)
    {
        var client = await _clientService.GetById(request.ClientId);
        if (client == null) return NotFound(new { message = "Cliente não encontrado" });

        // Enqueue: insere no final da fila — O(1)
        _queue.Enqueue(client);
        return Ok(new { message = "Cliente adicionado à fila", position = _queue.Count });
    }

    // Remove e retorna o primeiro cliente da fila (Dequeue)
    [HttpPost("queue/dequeue")]
    public IActionResult Dequeue()
    {
        if (_queue.Count == 0) return BadRequest(new { message = "Fila vazia" });

        // Dequeue: remove do início da fila — O(1), FIFO
        var client = _queue.Dequeue();
        return Ok(client);
    }

    // Consulta o primeiro cliente sem remover (Peek)
    [HttpGet("queue/peek")]
    public IActionResult PeekQueue()
    {
        if (_queue.Count == 0) return Ok(new { message = "Fila vazia" });

        // Peek: lê o primeiro elemento sem alterar a fila — O(1)
        return Ok(_queue.Peek());
    }

    // Retorna toda a fila e seu tamanho
    [HttpGet("queue")]
    public IActionResult GetQueue()
        => Ok(new { count = _queue.Count, clients = _queue.ToList() });
}

// DTO para requisição de enfileiramento
public class EnqueueRequest
{
    public int ClientId { get; set; }
}
