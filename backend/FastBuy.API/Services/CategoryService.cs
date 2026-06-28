using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface ICategoryService
{
    Task<List<Category>> GetAll();
    Task<Category> Create(string name);
    Task<Category?> Update(int id, string name);
    Task<bool> Delete(int id);
}

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;

    public CategoryService(AppDbContext db) => _db = db;

    public async Task<List<Category>> GetAll()
        => await _db.Categories.Where(c => c.Active).ToListAsync();

    public async Task<Category> Create(string name)
    {
        var category = new Category { Name = name };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return category;
    }

    public async Task<Category?> Update(int id, string name)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null) return null;
        category.Name = name;
        await _db.SaveChangesAsync();
        return category;
    }

    public async Task<bool> Delete(int id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null) return false;
        category.Active = false;
        await _db.SaveChangesAsync();
        return true;
    }
}
