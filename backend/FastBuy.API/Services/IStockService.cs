using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface IStockService
{
    Task<List<StockMovement>> GetMovements(int? productId);
    Task<StockMovement> AddMovement(int productId, string type, int quantity, string? reason, int userId);
    Task<List<Product>> GetLowStock();
}
