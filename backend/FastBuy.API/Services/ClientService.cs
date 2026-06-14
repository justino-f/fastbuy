using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.DTOs.Clients;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

public class ClientService : IClientService
{
    private readonly AppDbContext _db;

    public ClientService(AppDbContext db) => _db = db;

    public async Task<List<Client>> GetAll(string? search)
    {
        var query = _db.Clients.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Name.Contains(search) || c.CPF.Contains(search));
        return await query.ToListAsync();
    }

    public async Task<Client?> GetById(int id)
        => await _db.Clients.FindAsync(id);

    public async Task<Client> Create(ClientDto dto)
    {
        var client = new Client
        {
            Name = dto.Name,
            CPF = dto.CPF,
            Phone = dto.Phone,
            Email = dto.Email
        };
        _db.Clients.Add(client);
        await _db.SaveChangesAsync();
        return client;
    }

    public async Task<Client?> Update(int id, ClientDto dto)
    {
        var client = await _db.Clients.FindAsync(id);
        if (client == null) return null;
        client.Name = dto.Name;
        client.CPF = dto.CPF;
        client.Phone = dto.Phone;
        client.Email = dto.Email;
        await _db.SaveChangesAsync();
        return client;
    }

    public async Task<List<Sale>> GetPurchaseHistory(int clientId)
        => await _db.Sales
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .Include(s => s.Payment)
            .Where(s => s.ClientId == clientId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
}
