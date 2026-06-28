using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.DTOs;

namespace FastBuy.API.Services;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboard();
}

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db) => _db = db;

    public async Task<DashboardDto> GetDashboard()
    {
        var today = DateTime.UtcNow.Date;

        var todaySales = await _db.Sales
            .Include(s => s.Items)
            .Where(s => s.CreatedAt.Date == today && s.Status == "Concluida")
            .ToListAsync();

        var salesByHour = todaySales
            .GroupBy(s => s.CreatedAt.Hour)
            .Select(g => new SalesByHourDto { Hour = g.Key, Total = g.Sum(s => s.FinalTotal) })
            .ToList();

        var topProducts = await _db.SaleItems
            .Include(si => si.Product)
            .Include(si => si.Sale)
            .Where(si => si.Sale!.CreatedAt.Date == today && si.Sale.Status == "Concluida")
            .GroupBy(si => si.Product!.Name)
            .Select(g => new TopProductDto { Name = g.Key, Quantity = g.Sum(si => si.Quantity) })
            .OrderByDescending(t => t.Quantity)
            .Take(10)
            .ToListAsync();

        var outOfStock = await _db.Products
            .CountAsync(p => p.Active && p.CurrentStock <= 0);

        var clientsServed = todaySales
            .Where(s => s.ClientId.HasValue)
            .Select(s => s.ClientId)
            .Distinct()
            .Count();

        return new DashboardDto
        {
            TotalSoldToday = todaySales.Sum(s => s.FinalTotal),
            ProductsSoldToday = todaySales.Sum(s => s.Items.Sum(i => i.Quantity)),
            OutOfStockCount = outOfStock,
            ClientsServedToday = clientsServed,
            SalesByHour = salesByHour,
            TopProducts = topProducts
        };
    }
}
