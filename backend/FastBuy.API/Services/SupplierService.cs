using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface ISupplierService
{
    Task<List<Supplier>> GetAll();
    Task<Supplier> Create(Supplier supplier);
    Task<Supplier?> Update(int id, Supplier supplier);
    Task<bool> Delete(int id);
}

public class SupplierService : ISupplierService
{
    private readonly AppDbContext _db;

    public SupplierService(AppDbContext db) => _db = db;

    public async Task<List<Supplier>> GetAll()
        => await _db.Suppliers.Where(s => s.Active).ToListAsync();

    public async Task<Supplier> Create(Supplier supplier)
    {
        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();
        return supplier;
    }

    public async Task<Supplier?> Update(int id, Supplier supplier)
    {
        var existing = await _db.Suppliers.FindAsync(id);
        if (existing == null) return null;
        existing.CompanyName = supplier.CompanyName;
        existing.CNPJ = supplier.CNPJ;
        existing.Phone = supplier.Phone;
        existing.Email = supplier.Email;
        existing.Address = supplier.Address;
        await _db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> Delete(int id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null) return false;
        supplier.Active = false;
        await _db.SaveChangesAsync();
        return true;
    }
}
