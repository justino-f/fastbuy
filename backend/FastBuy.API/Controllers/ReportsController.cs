using System.Security.Claims;
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
    public async Task<IActionResult> SalesReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var start = DateTime.SpecifyKind(startDate ?? DateTime.UtcNow.AddDays(-30), DateTimeKind.Utc);
        var end = DateTime.SpecifyKind(endDate ?? DateTime.UtcNow, DateTimeKind.Utc);

        var sales = await _db.Sales
            .Include(s => s.Client)
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .Include(s => s.Payment)
            .Where(s => s.CreatedAt >= start && s.CreatedAt <= end.AddDays(1))
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var active = sales.Where(s => s.Status != "Cancelada").ToList();
        var summary = new
        {
            TotalSales = sales.Count,
            TotalRevenue = active.Sum(s => s.FinalTotal),
            TotalCancelled = sales.Count - active.Count,
            AverageTicket = active.Count > 0 ? active.Average(s => s.FinalTotal) : 0m,
            ByPaymentMethod = active.Where(s => s.Payment != null)
                .GroupBy(s => s.Payment!.Method)
                .Select(g => new { Method = g.Key, Count = g.Count(), Total = g.Sum(s => s.FinalTotal) }),
            ByDay = active
                .GroupBy(s => s.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count(), Total = g.Sum(s => s.FinalTotal) })
                .OrderBy(x => x.Date),
            Sales = sales.Select(s => new
            {
                s.Id, s.CreatedAt, s.Total, s.Discount, s.FinalTotal, s.Status,
                ClientName = s.Client?.Name,
                PaymentMethod = s.Payment?.Method,
                ItemCount = s.Items.Sum(i => i.Quantity)
            })
        };
        return Ok(summary);
    }

    [HttpGet("cash-registers")]
    public async Task<IActionResult> CashRegisterReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var start = DateTime.SpecifyKind(startDate ?? DateTime.UtcNow.AddDays(-30), DateTimeKind.Utc);
        var end = DateTime.SpecifyKind(endDate ?? DateTime.UtcNow, DateTimeKind.Utc);

        var registers = await _db.CashRegisters
            .Include(c => c.Sales)
            .Where(c => c.OpenedAt >= start && c.OpenedAt <= end.AddDays(1))
            .OrderByDescending(c => c.OpenedAt)
            .ToListAsync();

        var result = registers.Select(r => {
            var activeSales = r.Sales.Where(s => s.Status != "Cancelada").ToList();
            return new
            {
                r.Id, r.UserId, r.OpeningBalance, r.ClosingBalance, r.Status,
                r.OpenedAt, r.ClosedAt,
                SalesCount = activeSales.Count,
                SalesTotal = activeSales.Sum(s => s.FinalTotal)
            };
        });

        return Ok(new
        {
            TotalOpened = registers.Count,
            TotalClosed = registers.Count(r => r.Status == "Fechado"),
            Registers = result
        });
    }

    [HttpGet("products")]
    public async Task<IActionResult> ProductsReport()
    {
        var products = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .OrderBy(p => p.Name)
            .ToListAsync();

        var lowStock = products.Where(p => p.CurrentStock <= p.MinStock).ToList();

        var topSold = await _db.SaleItems
            .Include(i => i.Product)
            .Where(i => i.Sale != null && i.Sale.Status != "Cancelada")
            .GroupBy(i => new { i.ProductId, i.Product!.Name })
            .Select(g => new { g.Key.ProductId, g.Key.Name, TotalQty = g.Sum(i => i.Quantity), TotalRevenue = g.Sum(i => i.Subtotal) })
            .OrderByDescending(x => x.TotalQty)
            .Take(20)
            .ToListAsync();

        return Ok(new
        {
            TotalProducts = products.Count,
            ActiveProducts = products.Count(p => p.Active),
            LowStockCount = lowStock.Count,
            LowStock = lowStock.Select(p => new { p.Id, p.Name, p.CurrentStock, p.MinStock }),
            TopSold = topSold
        });
    }

    [HttpGet("suppliers")]
    public async Task<IActionResult> SuppliersReport()
    {
        var suppliers = await _db.Suppliers
            .Include(s => s.Products)
            .Where(s => s.Active)
            .OrderBy(s => s.CompanyName)
            .ToListAsync();

        return Ok(suppliers.Select(s => new
        {
            s.Id, s.CompanyName, s.CNPJ, s.Phone, s.Email,
            ProductCount = s.Products.Count,
            Products = s.Products.Select(p => new { p.Id, p.Name, p.CurrentStock, p.SalePrice })
        }));
    }
}
