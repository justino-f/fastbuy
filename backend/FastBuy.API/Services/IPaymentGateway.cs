namespace FastBuy.API.Services;

public interface IPaymentGateway
{
    string Method { get; }
    PaymentResult ProcessPayment(decimal amount, decimal? amountPaid);
}

public class PaymentResult
{
    public bool Success { get; set; }
    public decimal? Change { get; set; }
    public string TransactionId { get; set; } = string.Empty;
}

public class CashGateway : IPaymentGateway
{
    public string Method => "Dinheiro";

    public PaymentResult ProcessPayment(decimal amount, decimal? amountPaid)
    {
        var paid = amountPaid ?? amount;
        return new PaymentResult
        {
            Success = paid >= amount,
            Change = paid - amount,
            TransactionId = $"CASH-{Guid.NewGuid():N}"
        };
    }
}

public class PixGateway : IPaymentGateway
{
    public string Method => "PIX";

    public PaymentResult ProcessPayment(decimal amount, decimal? amountPaid)
        => new() { Success = true, Change = 0, TransactionId = $"PIX-{Guid.NewGuid():N}" };
}

public class CreditCardGateway : IPaymentGateway
{
    public string Method => "Credito";

    public PaymentResult ProcessPayment(decimal amount, decimal? amountPaid)
        => new() { Success = true, Change = 0, TransactionId = $"CC-{Guid.NewGuid():N}" };
}

public class DebitCardGateway : IPaymentGateway
{
    public string Method => "Debito";

    public PaymentResult ProcessPayment(decimal amount, decimal? amountPaid)
        => new() { Success = true, Change = 0, TransactionId = $"DC-{Guid.NewGuid():N}" };
}
