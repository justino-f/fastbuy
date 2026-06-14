using FastBuy.API.DTOs.Products;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface IProductService
{
    Task<List<Product>> GetAll(string? search, int? categoryId, string? sortBy, string? sortAlgorithm);
    Task<Product?> GetById(int id);
    Task<Product?> GetByBarcode(string barcode);
    Task<Product> Create(ProductDto dto);
    Task<Product?> Update(int id, ProductDto dto);
    Task<bool> Delete(int id);
}
