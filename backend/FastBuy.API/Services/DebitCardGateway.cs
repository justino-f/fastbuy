namespace FastBuy.API.Services;

public class DebitCardGateway : IPaymentGateway
{
    public string Method => "Debito";

    public PaymentResult ProcessPayment(decimal amount, decimal? amountPaid)
    {
        return new PaymentResult
        {
            Success = true,
            Change = 0,
            TransactionId = $"DC-{Guid.NewGuid():N}"
        };
    }
}
