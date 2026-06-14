namespace FastBuy.API.Models;

public class Payment
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public Sale? Sale { get; set; }
    public string Method { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal? Change { get; set; }
    public string Status { get; set; } = "Aprovado";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
