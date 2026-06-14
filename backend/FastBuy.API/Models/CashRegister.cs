namespace FastBuy.API.Models;

public class CashRegister
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal? ClosingBalance { get; set; }
    public string Status { get; set; } = "Aberto";
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    public List<Sale> Sales { get; set; } = new();
}
