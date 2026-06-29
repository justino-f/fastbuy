// DTOs (Data Transfer Objects) — objetos de entrada/saída da API
// Separam a camada de transporte dos modelos de domínio
namespace FastBuy.API.DTOs;

// ========================
// AUTENTICAÇÃO
// ========================

// Requisição de login — recebe credenciais do usuário
public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

// Resposta de login — retorna token JWT e dados do usuário autenticado
public class LoginResponse
{
    // Token JWT para autenticação nas demais requisições (Bearer)
    public string Token { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    // Role do usuário para controle de acesso no frontend
    public string Role { get; set; } = string.Empty;
}

// ========================
// PRODUTOS
// ========================

// DTO para criação/atualização de produtos — exclui campos auto-gerados (Id, CreatedAt)
public class ProductDto
{
    public string Name { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Unit { get; set; } = "UN";
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public int MinStock { get; set; }
    public int CurrentStock { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}

// ========================
// CLIENTES
// ========================

// DTO para criação/atualização de clientes
public class ClientDto
{
    public string Name { get; set; } = string.Empty;
    public string CPF { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
}

// ========================
// VENDAS
// ========================

// Requisição para criar uma venda completa (itens + pagamento)
public class CreateSaleRequest
{
    // Opcional: null para venda avulsa
    public int? ClientId { get; set; }
    // Caixa registradora onde a venda será vinculada
    public int CashRegisterId { get; set; }
    // Lista de itens (produto + quantidade)
    public List<SaleItemRequest> Items { get; set; } = new();
    // Desconto em reais
    public decimal Discount { get; set; }
    // Método de pagamento: Dinheiro, PIX, Credito, Debito
    public string PaymentMethod { get; set; } = string.Empty;
    // Valor pago pelo cliente (para cálculo de troco)
    public decimal AmountPaid { get; set; }
}

// Item da requisição de venda — apenas produto e quantidade
public class SaleItemRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}

// ========================
// DASHBOARD
// ========================

// Dados agregados do dashboard — calculados em tempo real
public class DashboardDto
{
    // Faturamento total do dia
    public decimal TotalSoldToday { get; set; }
    // Quantidade total de produtos vendidos hoje
    public int ProductsSoldToday { get; set; }
    // Produtos com estoque zerado
    public int OutOfStockCount { get; set; }
    // Clientes distintos atendidos hoje
    public int ClientsServedToday { get; set; }
    // Distribuição de vendas por hora para gráfico de barras
    public List<SalesByHourDto> SalesByHour { get; set; } = new();
    // Top 10 produtos mais vendidos no dia
    public List<TopProductDto> TopProducts { get; set; } = new();
}

// Vendas agrupadas por hora para gráfico
public class SalesByHourDto
{
    public int Hour { get; set; }
    public decimal Total { get; set; }
}

// Produto no ranking de mais vendidos
public class TopProductDto
{
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
}
