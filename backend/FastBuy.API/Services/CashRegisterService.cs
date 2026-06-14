using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

public class CashRegisterService : ICashRegisterService
{
    private readonly AppDbContext _db;

    public CashRegisterService(AppDbContext db) => _db = db;

    public async Task<CashRegister> Open(int userId, decimal openingBalance)
    {
        var register = new CashRegister
        {
            UserId = userId,
            OpeningBalance = openingBalance
        };
        _db.CashRegisters.Add(register);
        await _db.SaveChangesAsync();
        return register;
    }

    public async Task<CashRegister?> Close(int id)
    {
        var register = await _db.CashRegisters
            .Include(c => c.Sales).ThenInclude(s => s.Payment)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (register == null) return null;

        var salesTotal = register.Sales
            .Where(s => s.Status == "Concluida")
            .Sum(s => s.FinalTotal);

        register.ClosingBalance = register.OpeningBalance + salesTotal;
        register.Status = "Fechado";
        register.ClosedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return register;
    }

    public async Task<CashRegister?> GetCurrent(int userId)
        => await _db.CashRegisters
            .Include(c => c.Sales)
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == "Aberto");

    public async Task Sangria(int id, decimal amount, string reason)
    {
        var register = await _db.CashRegisters.FindAsync(id);
        if (register == null) throw new Exception("Caixa não encontrado");
        register.OpeningBalance -= amount;
        await _db.SaveChangesAsync();
    }

    public async Task Suprimento(int id, decimal amount, string reason)
    {
        var register = await _db.CashRegisters.FindAsync(id);
        if (register == null) throw new Exception("Caixa não encontrado");
        register.OpeningBalance += amount;
        await _db.SaveChangesAsync();
    }

    public async Task<List<CashRegister>> GetHistory(int userId)
        => await _db.CashRegisters
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.OpenedAt)
            .Take(20)
            .ToListAsync();
}
