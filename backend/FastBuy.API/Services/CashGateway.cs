namespace FastBuy.API.Services;

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
