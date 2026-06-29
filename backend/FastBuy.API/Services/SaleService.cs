using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.DTOs;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

// Contrato (interface) que define as operações de venda disponíveis no sistema.
// Segue o princípio de Inversão de Dependência (DIP): consumidores dependem da abstração, não da implementação.
public interface ISaleService
{
    // Cria uma nova venda completa: itens, pagamento e baixa de estoque
    Task<Sale> CreateSale(CreateSaleRequest request, int userId);

    // Cancela uma venda existente, restaura estoque e gera cupom de cancelamento para auditoria
    Task<CancelledCoupon> CancelSale(int saleId, string reason, int userId);

    // Lista vendas com filtros opcionais de data e status
    Task<List<Sale>> GetSales(DateTime? date, string? status);

    // Busca uma venda específica por ID com todos os relacionamentos carregados
    Task<Sale?> GetById(int id);
}

// Implementação concreta do serviço de vendas.
// Centraliza toda a lógica de negócio relacionada a criação, cancelamento e consulta de vendas.
public class SaleService : ISaleService
{
    // Contexto do Entity Framework para acesso ao banco de dados
    private readonly AppDbContext _db;

    // Strategy Pattern: coleção de gateways de pagamento injetados via DI.
    // Cada gateway implementa IPaymentGateway e processa um método específico (Dinheiro, Cartão, Pix, etc.).
    // Isso permite adicionar novos métodos de pagamento sem alterar o SaleService (Open/Closed Principle).
    private readonly IEnumerable<IPaymentGateway> _gateways;

    // Construtor com injeção de dependência: recebe o DbContext e todos os gateways registrados no container DI
    public SaleService(AppDbContext db, IEnumerable<IPaymentGateway> gateways)
    {
        _db = db;
        _gateways = gateways;
    }

    // Fluxo completo de criação de venda:
    // 1. Monta o objeto Sale com dados do request
    // 2. Itera os itens, calcula subtotais e acumula o total
    // 3. Seleciona o gateway de pagamento correto via Strategy Pattern
    // 4. Processa o pagamento e valida aprovação
    // 5. Deduz o estoque de cada produto vendido
    // 6. Persiste tudo no banco em uma única transação (SaveChanges)
    public async Task<Sale> CreateSale(CreateSaleRequest request, int userId)
    {
        // Valida todos os itens antes de iniciar a venda
        var erros = new List<string>();
        foreach (var item in request.Items)
        {
            var product = await _db.Products.FindAsync(item.ProductId);
            if (product == null)
                erros.Add($"Produto {item.ProductId} não encontrado");
            else if (product.CurrentStock < item.Quantity)
                erros.Add($"Estoque insuficiente: {product.Name} ({product.CurrentStock} disponível)");
        }
        if (erros.Count > 0)
            throw new Exception(string.Join(" | ", erros));

        // Cria a entidade Sale com os dados básicos: cliente, operador, caixa e desconto
        var sale = new Sale
        {
            ClientId = request.ClientId,
            UserId = userId,
            CashRegisterId = request.CashRegisterId,
            Discount = request.Discount
        };

        // Acumulador do valor total da venda antes do desconto
        decimal total = 0;

        // Itera cada item do pedido para montar os SaleItems e calcular valores
        foreach (var item in request.Items)
        {
            // Busca o produto no banco para obter o preço de venda atual
            var product = await _db.Products.FindAsync(item.ProductId);
            if (product == null) throw new Exception($"Produto {item.ProductId} não encontrado");

            // Cria o item de venda com preço unitário capturado no momento da venda (snapshot do preço)
            var saleItem = new SaleItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = product.SalePrice,
                // Subtotal = preço unitário * quantidade (cálculo no momento da venda)
                Subtotal = product.SalePrice * item.Quantity
            };

            // Acumula o subtotal no total geral da venda
            total += saleItem.Subtotal;
            // Adiciona o item à coleção de navegação da venda (EF rastreia automaticamente)
            sale.Items.Add(saleItem);
            // Baixa imediata do estoque: deduz a quantidade vendida do estoque atual do produto
            product.CurrentStock -= item.Quantity;
        }

        // Total bruto (soma de todos os subtotais)
        sale.Total = total;
        // Total líquido (total bruto menos desconto aplicado)
        sale.FinalTotal = total - request.Discount;

        // Strategy Pattern em ação: seleciona o gateway cujo Method corresponde ao solicitado.
        // FirstOrDefault percorre a lista de gateways registrados e encontra o compatível.
        // Se nenhum gateway suportar o método, lança exceção (fail-fast).
        var gateway = _gateways.FirstOrDefault(g => g.Method == request.PaymentMethod)
            ?? throw new Exception("Método de pagamento inválido");

        // Delega o processamento ao gateway selecionado (cada um valida regras próprias, ex: troco em dinheiro)
        var paymentResult = gateway.ProcessPayment(sale.FinalTotal, request.AmountPaid);
        // Se o pagamento for recusado (ex: valor insuficiente), aborta a operação
        if (!paymentResult.Success) throw new Exception("Pagamento recusado");

        // Cria o registro de pagamento vinculado à venda
        sale.Payment = new Payment
        {
            Method = request.PaymentMethod,
            // Se o valor pago foi informado, usa-o; caso contrário, assume o valor total (ex: cartão/Pix)
            Amount = request.AmountPaid > 0 ? request.AmountPaid : sale.FinalTotal,
            // Troco calculado pelo gateway (relevante apenas para pagamentos em dinheiro)
            Change = paymentResult.Change,
            Status = "Aprovado"
        };

        // Adiciona a venda ao contexto e persiste todas as alterações em uma única transação
        // (Sale, SaleItems, Payment e atualizações de estoque são salvos atomicamente)
        _db.Sales.Add(sale);
        await _db.SaveChangesAsync();
        return sale;
    }

    // Fluxo de cancelamento de venda:
    // 1. Busca a venda com itens e produtos relacionados
    // 2. Marca a venda como "Cancelada"
    // 3. Restaura o estoque de cada produto vendido
    // 4. Gera um CancelledCoupon com resumo JSON dos itens para auditoria/fiscal
    public async Task<CancelledCoupon> CancelSale(int saleId, string reason, int userId)
    {
        // Carrega a venda com Eager Loading (Include) dos itens e produtos para restaurar o estoque
        var sale = await _db.Sales
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(s => s.Id == saleId)
            ?? throw new Exception("Venda não encontrada");

        // Altera o status da venda para "Cancelada" (soft cancel, mantém o registro para auditoria)
        sale.Status = "Cancelada";

        // Restaura o estoque: devolve a quantidade de cada item ao estoque do produto
        foreach (var item in sale.Items)
        {
            if (item.Product != null)
                item.Product.CurrentStock += item.Quantity;
        }

        // Serializa os itens da venda em JSON para registro no cupom de cancelamento.
        // Esse snapshot garante que os dados do momento da venda fiquem preservados,
        // mesmo que produtos sejam alterados ou excluídos futuramente.
        var itemsSummary = JsonSerializer.Serialize(sale.Items.Select(i => new
        {
            Product = i.Product?.Name,
            i.Quantity,
            i.Subtotal
        }));

        // Cria o cupom de cancelamento para fins de auditoria e compliance fiscal
        var coupon = new CancelledCoupon
        {
            SaleId = saleId,
            Total = sale.FinalTotal,
            Reason = reason,
            CancelledByUserId = userId,
            // Resumo JSON dos itens cancelados (snapshot imutável para auditoria)
            ItemsSummary = itemsSummary
        };

        // Persiste o cupom e as alterações (status da venda + estoque restaurado)
        _db.CancelledCoupons.Add(coupon);
        await _db.SaveChangesAsync();

        return coupon;
    }

    // Query reutilizável que retorna vendas com todos os relacionamentos carregados via Eager Loading.
    // Centraliza os Includes para evitar duplicação em GetSales e GetById.
    // Inclui: Cliente, Itens da venda, Produto de cada item e Pagamento.
    private IQueryable<Sale> SalesWithIncludes()
        => _db.Sales.Include(s => s.Client).Include(s => s.Items).ThenInclude(i => i.Product).Include(s => s.Payment);

    // Consulta vendas com filtros opcionais de data e status.
    // Utiliza composição de queries (IQueryable) para aplicar filtros condicionalmente,
    // garantindo que apenas os filtros necessários sejam enviados ao SQL.
    public async Task<List<Sale>> GetSales(DateTime? date, string? status)
    {
        // Parte da query base com todos os includes
        var query = SalesWithIncludes();

        // Filtro opcional por data: compara apenas a parte Date (ignora hora)
        if (date.HasValue)
            query = query.Where(s => s.CreatedAt.Date == date.Value.Date);

        // Filtro opcional por status: "Concluida", "Cancelada", etc.
        if (!string.IsNullOrEmpty(status))
            query = query.Where(s => s.Status == status);

        // Ordena por data decrescente (vendas mais recentes primeiro) e materializa a query
        return await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
    }

    // Busca uma venda específica por ID com todos os relacionamentos (reutiliza SalesWithIncludes)
    public async Task<Sale?> GetById(int id)
        => await SalesWithIncludes().FirstOrDefaultAsync(s => s.Id == id);
}
