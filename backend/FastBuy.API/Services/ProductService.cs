using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.DataStructures;
using FastBuy.API.DTOs.Products;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _db;

    public ProductService(AppDbContext db) => _db = db;

    public async Task<List<Product>> GetAll(string? search, int? categoryId, string? sortBy, string? sortAlgorithm)
    {
        var query = _db.Products.Include(p => p.Category).Include(p => p.Supplier).Where(p => p.Active).AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.Name.Contains(search) || p.Barcode.Contains(search));

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        var products = await query.ToListAsync();

        if (!string.IsNullOrEmpty(sortBy) && !string.IsNullOrEmpty(sortAlgorithm))
        {
            products = sortAlgorithm.ToLower() switch
            {
                "bubble" => ProductSorter.BubbleSort(products, sortBy),
                "insertion" => ProductSorter.InsertionSort(products, sortBy),
                "quick" => ProductSorter.QuickSort(products, sortBy),
                "merge" => ProductSorter.MergeSort(products, sortBy),
                _ => products
            };
        }

        return products;
    }

    public async Task<Product?> GetById(int id)
        => await _db.Products.Include(p => p.Category).Include(p => p.Supplier).FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Product?> GetByBarcode(string barcode)
        => await _db.Products.Include(p => p.Category).Include(p => p.Supplier).FirstOrDefaultAsync(p => p.Barcode == barcode);

    public async Task<Product> Create(ProductDto dto)
    {
        var product = new Product
        {
            Name = dto.Name,
            Barcode = dto.Barcode,
            SKU = dto.SKU,
            CategoryId = dto.CategoryId,
            Brand = dto.Brand,
            Unit = dto.Unit,
            CostPrice = dto.CostPrice,
            SalePrice = dto.SalePrice,
            MinStock = dto.MinStock,
            CurrentStock = dto.CurrentStock,
            Description = dto.Description,
            ImageUrl = dto.ImageUrl
        };
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return product;
    }

    public async Task<Product?> Update(int id, ProductDto dto)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return null;

        product.Name = dto.Name;
        product.Barcode = dto.Barcode;
        product.SKU = dto.SKU;
        product.CategoryId = dto.CategoryId;
        product.Brand = dto.Brand;
        product.Unit = dto.Unit;
        product.CostPrice = dto.CostPrice;
        product.SalePrice = dto.SalePrice;
        product.MinStock = dto.MinStock;
        product.CurrentStock = dto.CurrentStock;
        product.Description = dto.Description;
        product.ImageUrl = dto.ImageUrl;

        await _db.SaveChangesAsync();
        return product;
    }

    public async Task<bool> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return false;
        product.Active = false;
        await _db.SaveChangesAsync();
        return true;
    }
}
