using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface ICashRegisterService
{
    Task<CashRegister> Open(int userId, decimal openingBalance);
    Task<CashRegister?> Close(int id);
    Task<CashRegister?> GetCurrent(int userId);
    Task Sangria(int id, decimal amount, string reason);
    Task Suprimento(int id, decimal amount, string reason);
}
