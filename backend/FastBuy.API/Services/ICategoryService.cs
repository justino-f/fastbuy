using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface ICategoryService
{
    Task<List<Category>> GetAll();
    Task<Category> Create(string name);
    Task<Category?> Update(int id, string name);
    Task<bool> Delete(int id);
}
