using FastBuy.API.DTOs.Sales;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface ISaleService
{
    Task<Sale> CreateSale(CreateSaleRequest request, int userId);
    Task<CancelledCoupon> CancelSale(int saleId, string reason, int userId);
    Task<List<Sale>> GetSales(DateTime? date, string? status);
    Task<Sale?> GetById(int id);
}
