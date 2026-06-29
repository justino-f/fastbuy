using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.DTOs;

namespace FastBuy.API.Services;

// Contrato do serviço de dashboard.
// Responsável por agregar KPIs em tempo real para a tela principal do sistema.
public interface IDashboardService
{
    // Retorna todos os indicadores do dashboard consolidados em um único DTO
    Task<DashboardDto> GetDashboard();
}

// Implementação do serviço de dashboard.
// Agrega dados de vendas, produtos e clientes do dia atual para exibição em tempo real.
// Todas as métricas são calculadas com base apenas nas vendas com status "Concluida".
public class DashboardService : IDashboardService
{
    // Contexto do Entity Framework para acesso ao banco de dados
    private readonly AppDbContext _db;

    // Injeção do DbContext via construtor
    public DashboardService(AppDbContext db) => _db = db;

    // Consolida todos os KPIs do dia em uma única chamada.
    // Estratégia: carrega as vendas do dia uma vez e reutiliza em memória para múltiplos cálculos,
    // reduzindo o número de queries ao banco.
    public async Task<DashboardDto> GetDashboard()
    {
        // Data de referência: dia atual em UTC (ignora hora para filtrar o dia inteiro)
        var today = DateTime.UtcNow.Date;

        // Carrega todas as vendas concluídas do dia com seus itens (Eager Loading).
        // Materializa em memória (ToList) para reutilizar nos cálculos abaixo sem novas queries.
        var todaySales = await _db.Sales
            .Include(s => s.Items)
            .Where(s => s.CreatedAt.Date == today && s.Status == "Concluida")
            .ToListAsync();

        // Agrupa as vendas por hora para gerar dados do gráfico de barras.
        // Cada grupo contém a hora e o total vendido naquele período.
        // Permite visualizar picos de movimento ao longo do dia.
        var salesByHour = todaySales
            .GroupBy(s => s.CreatedAt.Hour)
            .Select(g => new SalesByHourDto { Hour = g.Key, Total = g.Sum(s => s.FinalTotal) })
            .ToList();

        // Ranking dos 10 produtos mais vendidos do dia (por quantidade).
        // Consulta diretamente os SaleItems no banco (não usa todaySales em memória)
        // porque precisa do Include de Product para obter o nome.
        // Agrupa por nome do produto e soma as quantidades vendidas.
        var topProducts = await _db.SaleItems
            .Include(si => si.Product)
            .Include(si => si.Sale)
            .Where(si => si.Sale!.CreatedAt.Date == today && si.Sale.Status == "Concluida")
            .GroupBy(si => si.Product!.Name)
            .Select(g => new TopProductDto { Name = g.Key, Quantity = g.Sum(si => si.Quantity) })
            .OrderByDescending(t => t.Quantity)
            .Take(10)
            .ToListAsync();

        // Conta produtos ativos com estoque zerado ou negativo.
        // Indicador crítico para alertar o gestor sobre necessidade de reposição.
        var outOfStock = await _db.Products
            .CountAsync(p => p.Active && p.CurrentStock <= 0);

        // Conta clientes distintos atendidos no dia.
        // Filtra apenas vendas com ClientId preenchido (vendas avulsas sem cliente são ignoradas).
        // Usa Distinct para evitar contagem duplicada de um mesmo cliente com múltiplas compras.
        var clientsServed = todaySales
            .Where(s => s.ClientId.HasValue)
            .Select(s => s.ClientId)
            .Distinct()
            .Count();

        // Monta o DTO de resposta consolidando todos os KPIs
        return new DashboardDto
        {
            // Total em reais vendido no dia (soma dos FinalTotal)
            TotalSoldToday = todaySales.Sum(s => s.FinalTotal),
            // Quantidade total de produtos vendidos no dia (soma das quantidades de todos os itens)
            ProductsSoldToday = todaySales.Sum(s => s.Items.Sum(i => i.Quantity)),
            // Quantidade de produtos com estoque zerado
            OutOfStockCount = outOfStock,
            // Quantidade de clientes únicos atendidos
            ClientsServedToday = clientsServed,
            // Dados para o gráfico de vendas por hora
            SalesByHour = salesByHour,
            // Ranking dos produtos mais vendidos
            TopProducts = topProducts
        };
    }
}
