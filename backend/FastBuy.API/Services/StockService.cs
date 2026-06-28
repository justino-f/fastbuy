using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface IStockService
{
    Task<List<StockMovement>> GetMovements(int? productId);
    Task<StockMovement> AddMovement(int productId, string type, int quantity, string? reason, int userId);
    Task<List<Product>> GetLowStock();
}

public class StockService : IStockService
{
    private readonly AppDbContext _db;

    public StockService(AppDbContext db) => _db = db;

    public async Task<List<StockMovement>> GetMovements(int? productId)
    {
        var query = _db.StockMovements.Include(m => m.Product).AsQueryable();
        if (productId.HasValue)
            query = query.Where(m => m.ProductId == productId.Value);
        return await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
    }

    public async Task<StockMovement> AddMovement(int productId, string type, int quantity, string? reason, int userId)
    {
        var product = await _db.Products.FindAsync(productId);
        if (product == null) throw new Exception("Produto não encontrado");

        switch (type)
        {
            case "Entrada":
                product.CurrentStock += quantity;
                break;
            case "Saida":
            case "Perda":
                product.CurrentStock -= quantity;
                break;
            case "Ajuste":
                product.CurrentStock = quantity;
                break;
        }

        var movement = new StockMovement
        {
            ProductId = productId,
            Type = type,
            Quantity = quantity,
            Reason = reason,
            UserId = userId
        };
        _db.StockMovements.Add(movement);
        await _db.SaveChangesAsync();
        return movement;
    }

    public async Task<List<Product>> GetLowStock()
        => await _db.Products
            .Include(p => p.Category)
            .Where(p => p.Active && p.CurrentStock <= p.MinStock)
            .ToListAsync();
}
