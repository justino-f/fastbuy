using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

// Contrato que define as operações do ciclo de vida do caixa.
// Ciclo: Abrir → Sangria/Suprimento (operações intermediárias) → Fechar.
public interface ICashRegisterService
{
    // Abre um novo caixa com saldo inicial informado pelo operador
    Task<CashRegister> Open(int userId, decimal openingBalance);

    // Fecha o caixa, calculando o saldo final com base nas vendas concluídas
    Task<CashRegister?> Close(int id);

    // Retorna o caixa atualmente aberto para o usuário (apenas um permitido por vez)
    Task<CashRegister?> GetCurrent(int userId);

    // Sangria: retirada de dinheiro do caixa (ex: enviar ao cofre)
    Task Sangria(int id, decimal amount, string reason);

    // Suprimento: adição de dinheiro ao caixa (ex: troco adicional)
    Task Suprimento(int id, decimal amount, string reason);

    // Retorna o histórico dos últimos 20 caixas do usuário
    Task<List<CashRegister>> GetHistory(int userId);
}

// Implementação do serviço de caixa registradora.
// Gerencia abertura, fechamento, sangrias, suprimentos e consulta de histórico.
public class CashRegisterService : ICashRegisterService
{
    // Contexto do Entity Framework para acesso ao banco de dados
    private readonly AppDbContext _db;

    // Injeção do DbContext via construtor
    public CashRegisterService(AppDbContext db) => _db = db;

    // Abre um novo caixa com o saldo inicial informado.
    // O saldo inicial representa o dinheiro físico contado pelo operador no início do turno.
    public async Task<CashRegister> Open(int userId, decimal openingBalance)
    {
        // Cria o registro do caixa com status padrão "Aberto" (definido no modelo)
        var register = new CashRegister
        {
            UserId = userId,
            OpeningBalance = openingBalance
        };
        // Persiste o novo caixa no banco
        _db.CashRegisters.Add(register);
        await _db.SaveChangesAsync();
        return register;
    }

    // Fecha o caixa calculando o saldo de fechamento.
    // Fórmula: ClosingBalance = OpeningBalance + soma das vendas concluídas.
    // Sangrias e suprimentos já foram refletidos no OpeningBalance, então o cálculo fica correto.
    public async Task<CashRegister?> Close(int id)
    {
        // Carrega o caixa com Eager Loading das vendas e seus pagamentos
        // para calcular o total vendido durante o período do caixa
        var register = await _db.CashRegisters
            .Include(c => c.Sales).ThenInclude(s => s.Payment)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (register == null) return null;

        // Soma o FinalTotal apenas das vendas com status "Concluida" (ignora canceladas)
        var salesTotal = register.Sales
            .Where(s => s.Status == "Concluida")
            .Sum(s => s.FinalTotal);

        // Saldo de fechamento = saldo atual (já ajustado por sangrias/suprimentos) + vendas do período
        register.ClosingBalance = register.OpeningBalance + salesTotal;
        // Atualiza o status para "Fechado" (impede novas operações neste caixa)
        register.Status = "Fechado";
        // Registra o timestamp do fechamento para auditoria
        register.ClosedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return register;
    }

    // Retorna o caixa aberto do usuário, se houver.
    // Filtro: mesmo userId + status "Aberto".
    // Inclui as vendas vinculadas para exibição no frontend.
    public async Task<CashRegister?> GetCurrent(int userId)
        => await _db.CashRegisters
            .Include(c => c.Sales)
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == "Aberto");

    // Sangria: operação de retirada de dinheiro do caixa.
    // Casos de uso: enviar dinheiro ao cofre, reduzir risco de roubo.
    // Subtrai o valor do OpeningBalance para refletir no saldo de fechamento.
    public async Task Sangria(int id, decimal amount, string reason)
    {
        var register = await _db.CashRegisters.FindAsync(id);
        if (register == null) throw new Exception("Caixa não encontrado");
        // Diminui o saldo: reflete a retirada física de dinheiro do caixa
        register.OpeningBalance -= amount;
        await _db.SaveChangesAsync();
    }

    // Suprimento: operação de adição de dinheiro ao caixa.
    // Casos de uso: fornecer troco adicional, reforçar o caixa.
    // Soma o valor ao OpeningBalance para refletir no saldo de fechamento.
    public async Task Suprimento(int id, decimal amount, string reason)
    {
        var register = await _db.CashRegisters.FindAsync(id);
        if (register == null) throw new Exception("Caixa não encontrado");
        // Aumenta o saldo: reflete a adição física de dinheiro ao caixa
        register.OpeningBalance += amount;
        await _db.SaveChangesAsync();
    }

    // Retorna o histórico dos últimos 20 caixas do usuário, ordenados do mais recente ao mais antigo.
    // Limite de 20 registros para performance e usabilidade na interface.
    public async Task<List<CashRegister>> GetHistory(int userId)
        => await _db.CashRegisters
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.OpenedAt)
            .Take(20)
            .ToListAsync();
}
