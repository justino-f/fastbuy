using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.DTOs;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

// Interface do serviço de produtos — operações CRUD com soft delete
public interface IProductService
{
    Task<List<Product>> GetAll(string? search, int? categoryId);
    Task<Product?> GetById(int id);
    Task<Product?> GetByBarcode(string barcode);
    Task<Product> Create(ProductDto dto);
    Task<Product?> Update(int id, ProductDto dto);
    Task<bool> Delete(int id);
}

// Serviço de produtos — CRUD completo com filtros e soft delete
public class ProductService : IProductService
{
    private readonly AppDbContext _db;

    public ProductService(AppDbContext db) => _db = db;

    // Lista produtos ativos com filtro por nome/barcode e categoria
    public async Task<List<Product>> GetAll(string? search, int? categoryId)
    {
        var query = ProductsWithIncludes().Where(p => p.Active).AsQueryable();

        // Filtro de busca: nome ou código de barras
        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.Name.Contains(search) || p.Barcode.Contains(search));

        // Filtro por categoria
        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        return await query.ToListAsync();
    }

    // IQueryable com includes padrão (Category + Supplier) — reutilizado em todas as consultas
    private IQueryable<Product> ProductsWithIncludes()
        => _db.Products.Include(p => p.Category).Include(p => p.Supplier);

    // Busca produto por ID com includes
    public async Task<Product?> GetById(int id)
        => await ProductsWithIncludes().FirstOrDefaultAsync(p => p.Id == id);

    // Busca produto por código de barras — usado no PDV para leitura rápida
    public async Task<Product?> GetByBarcode(string barcode)
        => await ProductsWithIncludes().FirstOrDefaultAsync(p => p.Barcode == barcode);

    // Mapeia campos do DTO para entidade Product — reutilizado em Create e Update
    private static void MapDto(ProductDto dto, Product product)
    {
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
    }

    // Cria novo produto a partir do DTO
    public async Task<Product> Create(ProductDto dto)
    {
        var product = new Product();
        MapDto(dto, product);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return product;
    }

    // Atualiza produto existente — retorna null se não encontrado
    public async Task<Product?> Update(int id, ProductDto dto)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return null;
        MapDto(dto, product);
        await _db.SaveChangesAsync();
        return product;
    }

    // Soft delete: marca Active=false em vez de excluir registro
    public async Task<bool> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return false;
        product.Active = false;
        await _db.SaveChangesAsync();
        return true;
    }
}
