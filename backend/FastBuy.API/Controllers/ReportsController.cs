using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportsController(AppDbContext db) => _db = db;

    [HttpGet("sales")]
    public async Task<IActionResult> SalesReport([FromQuery] string period = "daily")
    {
        var now = DateTime.UtcNow;
        var startDate = period switch
        {
            "weekly" => now.AddDays(-7),
            "monthly" => now.AddMonths(-1),
            _ => now.Date
        };

        var sales = await _db.Sales
            .Where(s => s.CreatedAt >= startDate && s.Status == "Concluida")
            .Select(s => new { s.Id, s.FinalTotal, s.CreatedAt })
            .ToListAsync();

        return Ok(new
        {
            Period = period,
            TotalSales = sales.Count,
            TotalRevenue = sales.Sum(s => s.FinalTotal),
            Sales = sales
        });
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> TopProducts()
    {
        var top = await _db.SaleItems
            .Include(si => si.Product)
            .Include(si => si.Sale)
            .Where(si => si.Sale!.Status == "Concluida")
            .GroupBy(si => new { si.ProductId, si.Product!.Name })
            .Select(g => new
            {
                g.Key.Name,
                QuantitySold = g.Sum(si => si.Quantity),
                TotalRevenue = g.Sum(si => si.Subtotal)
            })
            .OrderByDescending(x => x.QuantitySold)
            .Take(20)
            .ToListAsync();

        return Ok(top);
    }

    [HttpGet("stock-low")]
    public async Task<IActionResult> StockLow()
    {
        var products = await _db.Products
            .Include(p => p.Category)
            .Where(p => p.Active && p.CurrentStock <= p.MinStock)
            .Select(p => new
            {
                p.Id,
                p.Name,
                Category = p.Category!.Name,
                p.CurrentStock,
                p.MinStock
            })
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> Revenue()
    {
        var last30Days = DateTime.UtcNow.AddDays(-30);
        var revenue = await _db.Sales
            .Where(s => s.CreatedAt >= last30Days && s.Status == "Concluida")
            .GroupBy(s => s.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Total = g.Sum(s => s.FinalTotal),
                Count = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        return Ok(revenue);
    }
}
