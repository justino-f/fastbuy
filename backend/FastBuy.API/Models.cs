// Modelos de domínio — entidades mapeadas pelo EF Core para tabelas PostgreSQL
// Todas usam soft delete (Active=false) em vez de exclusão física
namespace FastBuy.API.Models;

// Usuário do sistema com autenticação JWT e controle de acesso por Role
public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    // Hash BCrypt da senha — nunca armazena senha em texto plano
    public string PasswordHash { get; set; } = string.Empty;
    // Roles: Administrador, Gerente, Operador — usadas no [Authorize(Roles)]
    public string Role { get; set; } = "Operador";
    // Soft delete: quando false, login é recusado
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// Categoria de produtos (ex: Bebidas, Hortifruti) — relacionamento 1:N com Product
public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Active { get; set; } = true;
    // Navigation property: lista de produtos desta categoria
    public List<Product> Products { get; set; } = new();
}

// Cliente do supermercado — usado na fila de atendimento (Queue FIFO) e histórico de compras
public class Client
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    // CPF com índice único no banco para evitar duplicidade
    public string CPF { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // Navigation property: histórico de vendas deste cliente
    public List<Sale> Sales { get; set; } = new();
}

// Produto do supermercado — entidade central do sistema
// Usado nos algoritmos de ordenação (Bubble, Insertion, Quick, Merge) e na Matriz 2D
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    // Barcode e SKU com índices únicos — usados na busca rápida do PDV
    public string Barcode { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    // FK para Category — relacionamento N:1 obrigatório
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    // FK para Supplier — relacionamento N:1 opcional (ON DELETE SET NULL)
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public string Brand { get; set; } = string.Empty;
    // Unidade de medida: UN, KG, L, etc.
    public string Unit { get; set; } = "UN";
    // Preços monetários — precisão (18,2) configurada no AppDbContext
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    // Controle de estoque: alerta quando CurrentStock <= MinStock
    public int MinStock { get; set; }
    public int CurrentStock { get; set; }
    public string? Description { get; set; }
    public bool Active { get; set; } = true;
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// Fornecedor de produtos — relacionamento 1:N com Product
public class Supplier
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    // CNPJ com índice único no banco
    public string CNPJ { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public bool Active { get; set; } = true;
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

// Venda — registra transação completa com itens, pagamento e vínculo ao caixa
// ClientId é opcional para vendas avulsas (sem cliente identificado)
public class Sale
{
    public int Id { get; set; }
    // Nullable: venda avulsa não exige cliente
    public int? ClientId { get; set; }
    public Client? Client { get; set; }
    // Operador que realizou a venda (extraído do JWT)
    public int UserId { get; set; }
    // Caixa onde a venda foi registrada
    public int CashRegisterId { get; set; }
    // Total bruto (soma dos subtotais dos itens)
    public decimal Total { get; set; }
    // Desconto em reais aplicado sobre o total
    public decimal Discount { get; set; }
    // Total final = Total - Discount
    public decimal FinalTotal { get; set; }
    // Status: "Concluida" ou "Cancelada"
    public string Status { get; set; } = "Concluida";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // Itens da venda — relacionamento 1:N
    public List<SaleItem> Items { get; set; } = new();
    // Pagamento vinculado — relacionamento 1:1
    public Payment? Payment { get; set; }
}

// Item individual de uma venda — armazena preço no momento da venda (snapshot)
public class SaleItem
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public Sale? Sale { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int Quantity { get; set; }
    // Preço unitário no momento da venda (pode diferir do preço atual do produto)
    public decimal UnitPrice { get; set; }
    // Subtotal = UnitPrice * Quantity
    public decimal Subtotal { get; set; }
}

// Pagamento de uma venda — processado via Strategy Pattern (IPaymentGateway)
// Relacionamento 1:1 com Sale
public class Payment
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public Sale? Sale { get; set; }
    // Método: Dinheiro, PIX, Credito, Debito
    public string Method { get; set; } = string.Empty;
    // Valor efetivamente pago pelo cliente
    public decimal Amount { get; set; }
    // Troco calculado pelo gateway (apenas para Dinheiro)
    public decimal? Change { get; set; }
    public string Status { get; set; } = "Aprovado";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// Caixa registradora — controla sessão de trabalho do operador
// Fluxo: Open → vendas → Close (calcula saldo final)
public class CashRegister
{
    public int Id { get; set; }
    // Operador responsável pelo caixa
    public int UserId { get; set; }
    // Saldo inicial informado na abertura
    public decimal OpeningBalance { get; set; }
    // Saldo final calculado: OpeningBalance + soma das vendas concluídas
    public decimal? ClosingBalance { get; set; }
    // Status: "Aberto" ou "Fechado"
    public string Status { get; set; } = "Aberto";
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    // Vendas registradas neste caixa
    public List<Sale> Sales { get; set; } = new();
}

// Cupom cancelado — armazenado na pilha (Stack LIFO) para consulta rápida
// Também persiste no banco para não perder dados entre reinícios
public class CancelledCoupon
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    // Total da venda no momento do cancelamento
    public decimal Total { get; set; }
    // Motivo informado pelo operador
    public string Reason { get; set; } = string.Empty;
    public int CancelledByUserId { get; set; }
    public DateTime CancelledAt { get; set; } = DateTime.UtcNow;
    // JSON com resumo dos itens da venda cancelada
    public string ItemsSummary { get; set; } = string.Empty;
}

// Movimentação de estoque — registra entradas, saídas, perdas e ajustes
// Cada movimentação atualiza automaticamente o CurrentStock do produto
public class StockMovement
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    // Tipo: Entrada (soma), Saida/Perda (subtrai), Ajuste (substitui)
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // Operador que registrou a movimentação
    public int UserId { get; set; }
}
