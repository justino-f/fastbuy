using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.DataStructures;
using FastBuy.API.Services;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/data-structures")]
[Authorize]
public class DataStructuresController : ControllerBase
{
    private readonly ClientQueue _clientQueue;
    private readonly CouponStack _couponStack;
    private readonly AppDbContext _db;

    public DataStructuresController(ClientQueue clientQueue, CouponStack couponStack, AppDbContext db)
    {
        _clientQueue = clientQueue;
        _couponStack = couponStack;
        _db = db;
    }

    [HttpPost("queue/enqueue")]
    public async Task<IActionResult> Enqueue([FromBody] EnqueueRequest request)
    {
        var client = await _db.Clients.FindAsync(request.ClientId);
        if (client == null) return NotFound(new { message = "Cliente não encontrado" });
        _clientQueue.EnqueueClient(client);
        return Ok(new { message = "Cliente adicionado à fila", position = _clientQueue.Count });
    }

    [HttpPost("queue/dequeue")]
    public IActionResult Dequeue()
    {
        if (_clientQueue.Count == 0) return BadRequest(new { message = "Fila vazia" });
        var client = _clientQueue.DequeueClient();
        return Ok(client);
    }

    [HttpGet("queue/peek")]
    public IActionResult PeekQueue()
    {
        if (_clientQueue.Count == 0) return Ok(new { message = "Fila vazia" });
        return Ok(_clientQueue.PeekClient());
    }

    [HttpGet("queue")]
    public IActionResult GetQueue()
        => Ok(new { count = _clientQueue.Count, clients = _clientQueue.GetQueue() });

    [HttpGet("stack")]
    public IActionResult GetStack()
        => Ok(new { count = _couponStack.Count, coupons = _couponStack.GetAll() });

    [HttpGet("stack/peek")]
    public IActionResult PeekStack()
    {
        if (_couponStack.Count == 0) return Ok(new { message = "Pilha vazia" });
        return Ok(_couponStack.PeekCoupon());
    }

    [HttpPost("stack/pop")]
    public IActionResult PopStack()
    {
        if (_couponStack.Count == 0) return BadRequest(new { message = "Pilha vazia" });
        return Ok(_couponStack.PopCoupon());
    }

    [HttpGet("matrix")]
    public async Task<IActionResult> GetMatrix()
    {
        var products = await _db.Products.Include(p => p.Category).Where(p => p.Active).ToListAsync();
        var matrix = ProductMatrix.ToMatrix(products);
        var list = ProductMatrix.ToList(matrix);
        return Ok(new { rows = matrix.GetLength(0), cols = matrix.GetLength(1), data = list });
    }

    [HttpPost("sort")]
    public async Task<IActionResult> Sort([FromBody] SortRequest request)
    {
        var products = await _db.Products.Include(p => p.Category).Where(p => p.Active).ToListAsync();

        var sorted = request.Algorithm.ToLower() switch
        {
            "bubble" => ProductSorter.BubbleSort(products, request.Criteria),
            "insertion" => ProductSorter.InsertionSort(products, request.Criteria),
            "quick" => ProductSorter.QuickSort(products, request.Criteria),
            "merge" => ProductSorter.MergeSort(products, request.Criteria),
            _ => products
        };

        return Ok(sorted);
    }
}

public class EnqueueRequest
{
    public int ClientId { get; set; }
}

public class SortRequest
{
    public string Algorithm { get; set; } = "bubble";
    public string Criteria { get; set; } = "name";
}
