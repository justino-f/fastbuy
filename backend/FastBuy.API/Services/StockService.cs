using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

// Contrato do serviço de estoque.
// Define operações para movimentação, consulta e alerta de estoque baixo.
public interface IStockService
{
    // Lista movimentações de estoque, opcionalmente filtradas por produto
    Task<List<StockMovement>> GetMovements(int? productId);

    // Registra uma nova movimentação de estoque e atualiza o saldo do produto
    Task<StockMovement> AddMovement(int productId, string type, int quantity, string? reason, int userId);

    // Retorna produtos ativos com estoque abaixo do mínimo configurado (alerta de reposição)
    Task<List<Product>> GetLowStock();
}

// Implementação do serviço de estoque.
// Gerencia movimentações (entrada, saída, perda, ajuste) e mantém o saldo de cada produto atualizado.
// Cada operação gera um registro de StockMovement para rastreabilidade e auditoria.
public class StockService : IStockService
{
    // Contexto do Entity Framework para acesso ao banco de dados
    private readonly AppDbContext _db;

    // Injeção do DbContext via construtor
    public StockService(AppDbContext db) => _db = db;

    // Consulta movimentações de estoque com filtro opcional por produto.
    // Retorna todas as movimentações ordenadas da mais recente à mais antiga.
    public async Task<List<StockMovement>> GetMovements(int? productId)
    {
        // Inicia a query com Include do Produto para exibir o nome na listagem
        var query = _db.StockMovements.Include(m => m.Product).AsQueryable();
        // Filtro opcional: se informado, mostra apenas movimentações do produto específico
        if (productId.HasValue)
            query = query.Where(m => m.ProductId == productId.Value);
        // Ordena por data decrescente (movimentações mais recentes primeiro)
        return await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
    }

    // Registra uma movimentação de estoque e atualiza o saldo do produto.
    // Tipos de movimentação suportados:
    //   - "Entrada": adiciona quantidade ao estoque (compra, devolução)
    //   - "Saida": subtrai quantidade do estoque (venda manual, transferência)
    //   - "Perda": subtrai quantidade do estoque (avaria, vencimento, extravio)
    //   - "Ajuste": substitui o estoque atual pelo valor informado (inventário/contagem física)
    public async Task<StockMovement> AddMovement(int productId, string type, int quantity, string? reason, int userId)
    {
        // Busca o produto para atualizar o estoque atual
        var product = await _db.Products.FindAsync(productId);
        if (product == null) throw new Exception("Produto não encontrado");

        // Aplica a movimentação ao estoque conforme o tipo
        switch (type)
        {
            case "Entrada":
                // Soma a quantidade ao estoque atual (reposição de mercadoria)
                product.CurrentStock += quantity;
                break;
            case "Saida":
            case "Perda":
                // Subtrai a quantidade do estoque atual (saída ou perda de mercadoria)
                product.CurrentStock -= quantity;
                break;
            case "Ajuste":
                // Substitui o estoque atual pelo valor informado (corrige divergências do inventário)
                product.CurrentStock = quantity;
                break;
        }

        // Cria o registro de movimentação para rastreabilidade e auditoria.
        // Armazena quem fez, quando, qual produto, tipo, quantidade e motivo.
        var movement = new StockMovement
        {
            ProductId = productId,
            Type = type,
            Quantity = quantity,
            Reason = reason,
            UserId = userId
        };
        // Persiste a movimentação e a atualização do estoque do produto em uma única transação
        _db.StockMovements.Add(movement);
        await _db.SaveChangesAsync();
        return movement;
    }

    // Retorna produtos ativos cujo estoque atual está igual ou abaixo do estoque mínimo configurado.
    // Usado para alertas de reposição no dashboard e relatórios.
    // Inclui a Categoria do produto para exibição agrupada na interface.
    public async Task<List<Product>> GetLowStock()
        => await _db.Products
            .Include(p => p.Category)
            .Where(p => p.Active && p.CurrentStock <= p.MinStock)
            .ToListAsync();
}
