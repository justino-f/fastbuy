using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.DTOs;
using FastBuy.API.Models;
using FastBuy.API.Services;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/sales")]
[Authorize]
public class SalesController : ControllerBase
{
    private readonly ISaleService _saleService;
    private readonly AppDbContext _db;

    // Pilha LIFO de cupons cancelados — estrutura de dados acadêmica (Stack)
    // Singleton estático para manter estado entre requisições
    private static readonly Stack<CancelledCoupon> _couponStack = new();

    public SalesController(ISaleService saleService, AppDbContext db)
    {
        _saleService = saleService;
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSaleRequest request)
    {
        var userId = this.GetUserId();
        var sale = await _saleService.CreateSale(request, userId);
        return Created($"api/sales/{sale.Id}", sale);
    }

    // Cancela venda e empilha cupom cancelado na Stack
    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelRequest request)
    {
        var userId = this.GetUserId();
        var coupon = await _saleService.CancelSale(id, request.Reason, userId);

        // Push: empilha cupom cancelado no topo da pilha — O(1), LIFO
        _couponStack.Push(coupon);
        return Ok(coupon);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] DateTime? date, [FromQuery] string? status)
        => Ok(await _saleService.GetSales(date, status));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var sale = await _saleService.GetById(id);
        if (sale == null) return NotFound();
        return Ok(sale);
    }

    // ==========================================
    // PILHA DE CUPONS CANCELADOS (Stack LIFO)
    // Estrutura de dados acadêmica: Stack<CancelledCoupon>
    // Armazena histórico de cancelamentos em ordem reversa
    // ==========================================

    // Retorna todos os cupons cancelados (do banco, ordenados por data desc)
    [HttpGet("stack")]
    public async Task<IActionResult> GetStack()
    {
        // Consulta persistida no banco para não perder dados entre reinícios
        var dbCoupons = await _db.CancelledCoupons
            .OrderByDescending(c => c.CancelledAt)
            .Take(50)
            .ToListAsync();
        return Ok(new { size = dbCoupons.Count, stack = dbCoupons });
    }

    // Consulta o topo da pilha sem remover (Peek)
    [HttpGet("stack/peek")]
    public IActionResult PeekStack()
    {
        if (_couponStack.Count == 0) return Ok(new { message = "Pilha vazia" });

        // Peek: lê o elemento do topo sem alterar a pilha — O(1)
        return Ok(_couponStack.Peek());
    }

    // Remove e retorna o cupom do topo da pilha (Pop)
    [HttpPost("stack/pop")]
    public IActionResult PopStack()
    {
        if (_couponStack.Count == 0) return BadRequest(new { message = "Pilha vazia" });

        // Pop: remove do topo da pilha — O(1), LIFO
        return Ok(_couponStack.Pop());
    }
}

// DTO para requisição de cancelamento
public class CancelRequest
{
    public string Reason { get; set; } = string.Empty;
}
