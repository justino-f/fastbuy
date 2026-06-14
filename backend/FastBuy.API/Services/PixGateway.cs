namespace FastBuy.API.Services;

public class PixGateway : IPaymentGateway
{
    public string Method => "PIX";

    public PaymentResult ProcessPayment(decimal amount, decimal? amountPaid)
    {
        return new PaymentResult
        {
            Success = true,
            Change = 0,
            TransactionId = $"PIX-{Guid.NewGuid():N}"
        };
    }
}
