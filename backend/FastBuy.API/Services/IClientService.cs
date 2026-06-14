using FastBuy.API.DTOs.Clients;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface IClientService
{
    Task<List<Client>> GetAll(string? search);
    Task<Client?> GetById(int id);
    Task<Client> Create(ClientDto dto);
    Task<Client?> Update(int id, ClientDto dto);
    Task<List<Sale>> GetPurchaseHistory(int clientId);
}
