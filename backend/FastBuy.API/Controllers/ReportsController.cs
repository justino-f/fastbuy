// Importações necessárias para o controller de relatórios
using System.Security.Claims;              // Claims do JWT (não utilizado diretamente aqui, mas disponível para extensões)
using Microsoft.AspNetCore.Authorization;  // [Authorize] para exigir autenticação JWT
using Microsoft.AspNetCore.Mvc;            // Base para controllers REST
using Microsoft.EntityFrameworkCore;       // Métodos assíncronos do EF Core (ToListAsync, Include, etc.)
using FastBuy.API.Data;                    // AppDbContext — contexto do Entity Framework Core

namespace FastBuy.API.Controllers;

/// <summary>
/// Controller de relatórios gerenciais do sistema.
/// Diferente dos outros controllers, este acessa o DbContext diretamente (sem camada de serviço),
/// pois relatórios são consultas de leitura (read-only) que agregam dados de múltiplas entidades.
/// Essa decisão arquitetural evita criar serviços intermediários para queries que não alteram estado.
/// Todos os endpoints exigem autenticação — relatórios contêm dados sensíveis do negócio.
/// </summary>
[ApiController]                // Habilita binding automático e validação de ModelState
[Route("api/reports")]         // Rota base: /api/reports
[Authorize]                    // Exige JWT válido — relatórios são restritos a usuários autenticados
public class ReportsController : ControllerBase
{
    // DbContext injetado diretamente — padrão aceitável para controllers de consulta (CQRS simplificado)
    // Em CQRS (Command Query Responsibility Segregation), queries podem acessar o banco diretamente
    private readonly AppDbContext _db;

    // Injeção de dependência via construtor com expression body
    public ReportsController(AppDbContext db) => _db = db;

    /// <summary>
    /// Método auxiliar privado para parsing de intervalo de datas.
    /// Converte datas opcionais recebidas da query string para DateTime UTC.
    /// Se nenhuma data for informada, assume os últimos 30 dias como padrão —
    /// evita que o relatório retorne TODOS os dados do banco (proteção de performance).
    /// DateTime.SpecifyKind garante que o DateTimeKind seja UTC, necessário para
    /// comparação correta com timestamps armazenados em UTC no PostgreSQL.
    /// Retorna uma tupla nomeada (start, end) — pattern de retorno múltiplo em C#.
    /// </summary>
    private static (DateTime start, DateTime end) ParseDateRange(DateTime? startDate, DateTime? endDate) => (
        DateTime.SpecifyKind(startDate ?? DateTime.UtcNow.AddDays(-30), DateTimeKind.Utc), // Fallback: 30 dias atrás
        DateTime.SpecifyKind(endDate ?? DateTime.UtcNow, DateTimeKind.Utc)                  // Fallback: agora
    );

    /// <summary>
    /// Relatório completo de vendas com sumarização agregada.
    /// Retorna um objeto com:
    /// - TotalSales: quantidade total de vendas no período (incluindo canceladas)
    /// - TotalRevenue: receita total (apenas vendas ativas, excluindo canceladas)
    /// - TotalCancelled: quantidade de vendas canceladas
    /// - AverageTicket: ticket médio (receita / quantidade de vendas ativas)
    /// - ByPaymentMethod: agrupamento por método de pagamento (PIX, Cartão, Dinheiro, etc.)
    /// - ByDay: agrupamento por dia (para gráficos de tendência no frontend)
    /// - Sales: lista detalhada de todas as vendas no período
    /// Usa Eager Loading (Include/ThenInclude) para carregar dados relacionados em uma única query,
    /// evitando o problema N+1 de consultas ao banco.
    /// </summary>
    [HttpGet("sales")]         // GET /api/reports/sales?startDate=2024-01-01&endDate=2024-12-31
    public async Task<IActionResult> SalesReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        // Converte datas com fallback de 30 dias via helper
        var (start, end) = ParseDateRange(startDate, endDate);

        // Query com Eager Loading: carrega Client, Items→Product e Payment em uma única consulta SQL
        // .Include() gera JOINs no SQL — evita lazy loading e o problema de N+1 queries
        // .ThenInclude() carrega navegações de segundo nível (Items → Product)
        var sales = await _db.Sales
            .Include(s => s.Client)                        // JOIN com tabela de clientes
            .Include(s => s.Items).ThenInclude(i => i.Product) // JOIN com itens da venda e seus produtos
            .Include(s => s.Payment)                       // JOIN com tabela de pagamentos
            .Where(s => s.CreatedAt >= start && s.CreatedAt <= end.AddDays(1)) // +1 dia para incluir o dia final completo
            .OrderByDescending(s => s.CreatedAt)           // Mais recentes primeiro
            .ToListAsync();                                // Materializa a query no banco de forma assíncrona

        // Filtra vendas ativas (não canceladas) para cálculos financeiros
        // Vendas canceladas contam no total mas NÃO entram na receita, ticket médio nem agrupamentos
        var active = sales.Where(s => s.Status != "Cancelada").ToList();

        // Objeto anônimo com sumarização — padrão de resposta agregada para dashboards
        var summary = new
        {
            TotalSales = sales.Count,                      // Total geral (incluindo canceladas)
            TotalRevenue = active.Sum(s => s.FinalTotal),  // Receita: soma do valor final das vendas ativas
            TotalCancelled = sales.Count - active.Count,   // Canceladas: diferença entre total e ativas
            // Ticket médio: receita dividida pela quantidade — proteção contra divisão por zero
            AverageTicket = active.Count > 0 ? active.Average(s => s.FinalTotal) : 0m,

            // Agrupamento por método de pagamento usando LINQ GroupBy
            // Filtra vendas que têm pagamento registrado (s.Payment != null)
            // Cada grupo contém: método, quantidade de vendas e valor total
            ByPaymentMethod = active.Where(s => s.Payment != null)
                .GroupBy(s => s.Payment!.Method)           // Agrupa por método (PIX, Cartão, Dinheiro, etc.)
                .Select(g => new { Method = g.Key, Count = g.Count(), Total = g.Sum(s => s.FinalTotal) }),

            // Agrupamento por dia — usado para gráficos de tendência temporal no frontend
            // .Date remove a hora, agrupando todas as vendas do mesmo dia
            ByDay = active
                .GroupBy(s => s.CreatedAt.Date)            // Agrupa por data (sem hora)
                .Select(g => new { Date = g.Key, Count = g.Count(), Total = g.Sum(s => s.FinalTotal) })
                .OrderBy(x => x.Date),                     // Ordem cronológica para gráficos

            // Lista detalhada de todas as vendas — projeção com Select para retornar apenas campos necessários
            // Usa operador ?. (null-conditional) para navegações que podem ser null (Client, Payment)
            Sales = sales.Select(s => new
            {
                s.Id, s.CreatedAt, s.Total, s.Discount, s.FinalTotal, s.Status,
                ClientName = s.Client?.Name,               // Nome do cliente (pode ser null se venda sem cliente)
                PaymentMethod = s.Payment?.Method,         // Método de pagamento (pode ser null se pendente)
                ItemCount = s.Items.Sum(i => i.Quantity)   // Total de itens na venda (soma das quantidades)
            })
        };
        return Ok(summary);                                // HTTP 200 com o relatório completo
    }

    /// <summary>
    /// Relatório de caixas (PDV) com totais de vendas por caixa.
    /// Retorna resumo com quantidade de caixas abertos/fechados no período
    /// e detalhamento por caixa incluindo vendas ativas e totais.
    /// Útil para conciliação financeira: comparar saldo esperado vs. saldo real ao fechar o caixa.
    /// </summary>
    [HttpGet("cash-registers")] // GET /api/reports/cash-registers?startDate=...&endDate=...
    public async Task<IActionResult> CashRegisterReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var (start, end) = ParseDateRange(startDate, endDate);

        // Carrega caixas com suas vendas via Eager Loading
        // Filtra pela data de abertura (OpenedAt) dentro do intervalo
        var registers = await _db.CashRegisters
            .Include(c => c.Sales)                         // JOIN com vendas vinculadas ao caixa
            .Where(c => c.OpenedAt >= start && c.OpenedAt <= end.AddDays(1))
            .OrderByDescending(c => c.OpenedAt)            // Mais recentes primeiro
            .ToListAsync();

        // Projeção por caixa: calcula vendas ativas (exclui canceladas) e seus totais
        var result = registers.Select(r => {
            // Filtra vendas não canceladas para cálculos financeiros corretos
            var activeSales = r.Sales.Where(s => s.Status != "Cancelada").ToList();
            return new
            {
                r.Id, r.UserId, r.OpeningBalance, r.ClosingBalance, r.Status,
                r.OpenedAt, r.ClosedAt,
                SalesCount = activeSales.Count,            // Quantidade de vendas efetivas neste caixa
                SalesTotal = activeSales.Sum(s => s.FinalTotal) // Receita total deste caixa
            };
        });

        // Resumo geral: total de caixas abertos e quantos foram fechados
        return Ok(new
        {
            TotalOpened = registers.Count,                 // Total de caixas no período
            TotalClosed = registers.Count(r => r.Status == "Fechado"), // Quantos foram devidamente fechados
            Registers = result                             // Detalhamento por caixa
        });
    }

    /// <summary>
    /// Relatório de produtos com alerta de estoque baixo e ranking de mais vendidos.
    /// Combina duas visões essenciais para gestão de estoque:
    /// 1. Produtos com estoque abaixo do mínimo (alerta de reposição)
    /// 2. Top 20 produtos mais vendidos (ranking por quantidade)
    /// Não recebe filtro de data — estoque baixo é uma situação atual,
    /// e o ranking considera todas as vendas ativas do sistema.
    /// </summary>
    [HttpGet("products")]      // GET /api/reports/products
    public async Task<IActionResult> ProductsReport()
    {
        // Carrega todos os produtos com suas categorias e fornecedores via Eager Loading
        var products = await _db.Products
            .Include(p => p.Category)                      // JOIN com categoria do produto
            .Include(p => p.Supplier)                      // JOIN com fornecedor do produto
            .OrderBy(p => p.Name)                          // Ordem alfabética
            .ToListAsync();

        // Filtra produtos com estoque atual menor ou igual ao mínimo configurado
        // Regra de negócio: quando CurrentStock <= MinStock, o produto precisa de reposição
        var lowStock = products.Where(p => p.CurrentStock <= p.MinStock).ToList();

        // Ranking dos 20 produtos mais vendidos — consulta direta na tabela de itens de venda
        // Exclui itens de vendas canceladas para não distorcer o ranking
        // GroupBy agrupa por ProductId+Nome, depois ordena por quantidade total descendente
        var topSold = await _db.SaleItems
            .Include(i => i.Product)                       // JOIN para obter o nome do produto
            .Where(i => i.Sale != null && i.Sale.Status != "Cancelada") // Apenas vendas efetivas
            .GroupBy(i => new { i.ProductId, i.Product!.Name })        // Agrupa por produto (ID + Nome)
            .Select(g => new {
                g.Key.ProductId,
                g.Key.Name,
                TotalQty = g.Sum(i => i.Quantity),         // Quantidade total vendida
                TotalRevenue = g.Sum(i => i.Subtotal)      // Receita total gerada pelo produto
            })
            .OrderByDescending(x => x.TotalQty)            // Ranking: mais vendidos primeiro
            .Take(20)                                       // Limita ao top 20 — evita payload excessivo
            .ToListAsync();

        // Resposta agregada com visão geral, alertas e ranking
        return Ok(new
        {
            TotalProducts = products.Count,                // Total de produtos cadastrados
            ActiveProducts = products.Count(p => p.Active),// Produtos ativos (não descontinuados)
            LowStockCount = lowStock.Count,                // Quantidade de produtos em estoque crítico
            // Projeção reduzida: apenas campos relevantes para o alerta de reposição
            LowStock = lowStock.Select(p => new { p.Id, p.Name, p.CurrentStock, p.MinStock }),
            TopSold = topSold                              // Ranking dos mais vendidos
        });
    }

    /// <summary>
    /// Relatório de fornecedores ativos com contagem de produtos por fornecedor.
    /// Lista apenas fornecedores ativos (s.Active == true) para focar em parceiros vigentes.
    /// Para cada fornecedor, inclui a lista de seus produtos com estoque e preço atual.
    /// Útil para análise de dependência de fornecedores e diversificação de compras.
    /// </summary>
    [HttpGet("suppliers")]     // GET /api/reports/suppliers
    public async Task<IActionResult> SuppliersReport()
    {
        // Carrega fornecedores ativos com seus produtos via Eager Loading
        var suppliers = await _db.Suppliers
            .Include(s => s.Products)                      // JOIN com produtos deste fornecedor
            .Where(s => s.Active)                          // Filtra apenas fornecedores ativos
            .OrderBy(s => s.CompanyName)                   // Ordem alfabética por razão social
            .ToListAsync();

        // Projeção: dados do fornecedor + contagem e lista de seus produtos
        // Padrão de projeção com Select: retorna apenas campos necessários, reduzindo payload JSON
        return Ok(suppliers.Select(s => new
        {
            s.Id, s.CompanyName, s.CNPJ, s.Phone, s.Email,
            ProductCount = s.Products.Count,               // Quantidade de produtos deste fornecedor
            // Lista resumida dos produtos — apenas campos relevantes para visão gerencial
            Products = s.Products.Select(p => new { p.Id, p.Name, p.CurrentStock, p.SalePrice })
        }));
    }
}
