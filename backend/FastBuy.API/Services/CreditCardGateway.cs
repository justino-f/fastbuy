namespace FastBuy.API.Services;

public class CreditCardGateway : IPaymentGateway
{
    public string Method => "Credito";

    public PaymentResult ProcessPayment(decimal amount, decimal? amountPaid)
    {
        return new PaymentResult
        {
            Success = true,
            Change = 0,
            TransactionId = $"CC-{Guid.NewGuid():N}"
        };
    }
}
