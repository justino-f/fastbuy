using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface ISupplierService
{
    Task<List<Supplier>> GetAll();
    Task<Supplier> Create(Supplier supplier);
    Task<Supplier?> Update(int id, Supplier supplier);
    Task<bool> Delete(int id);
}
