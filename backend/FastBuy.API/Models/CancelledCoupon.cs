namespace FastBuy.API.Models;

public class CancelledCoupon
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public decimal Total { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int CancelledByUserId { get; set; }
    public DateTime CancelledAt { get; set; } = DateTime.UtcNow;
    public string ItemsSummary { get; set; } = string.Empty;
}
