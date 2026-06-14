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
