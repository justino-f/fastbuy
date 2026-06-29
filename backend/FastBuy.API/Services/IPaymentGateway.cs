namespace FastBuy.API.Services;

// ========================
// STRATEGY PATTERN — Padrão de Projeto GoF
// Interface define contrato; cada implementação processa um método de pagamento
// SaleService recebe IEnumerable<IPaymentGateway> via DI e seleciona pelo Method
// ========================

// Interface do gateway de pagamento — cada método implementa sua própria lógica
public interface IPaymentGateway
{
    // Identifica o método: "Dinheiro", "PIX", "Credito", "Debito"
    string Method { get; }
    // Processa pagamento e retorna resultado (sucesso, troco, transactionId)
    PaymentResult ProcessPayment(decimal amount, decimal? amountPaid);
}

// Resultado do processamento de pagamento
public class PaymentResult
{
    public bool Success { get; set; }
    // Troco: diferença entre valor pago e valor da venda (apenas Dinheiro)
    public decimal? Change { get; set; }
    // ID único da transação para rastreabilidade
    public string TransactionId { get; set; } = string.Empty;
}

// Gateway para pagamento em dinheiro — calcula troco e valida valor suficiente
public class CashGateway : IPaymentGateway
{
    public string Method => "Dinheiro";

    public PaymentResult ProcessPayment(decimal amount, decimal? amountPaid)
    {
        // Se valor pago não informado, assume pagamento exato
        var paid = amountPaid ?? amount;
        return new PaymentResult
        {
            // Falha se valor pago for menor que o total
            Success = paid >= amount,
            // Troco = valor pago - valor da venda
            Change = paid - amount,
            TransactionId = $"CASH-{Guid.NewGuid():N}"
        };
    }
}

// Gateway genérico para métodos que aprovam automaticamente (PIX, Crédito, Débito)
// Instanciado via DI com parâmetros: new SimpleGateway("PIX", "PIX")
public class SimpleGateway : IPaymentGateway
{
    public string Method { get; }
    // Prefixo do TransactionId para identificar o método no log
    private readonly string _prefix;

    public SimpleGateway(string method, string prefix) { Method = method; _prefix = prefix; }

    // Aprovação automática sem validação — simula integração com adquirente
    public PaymentResult ProcessPayment(decimal amount, decimal? amountPaid)
        => new() { Success = true, Change = 0, TransactionId = $"{_prefix}-{Guid.NewGuid():N}" };
}
