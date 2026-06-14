namespace FastBuy.API.Models;

public class Sale
{
    public int Id { get; set; }
    public int? ClientId { get; set; }
    public Client? Client { get; set; }
    public int UserId { get; set; }
    public int CashRegisterId { get; set; }
    public decimal Total { get; set; }
    public decimal Discount { get; set; }
    public decimal FinalTotal { get; set; }
    public string Status { get; set; } = "Concluida";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<SaleItem> Items { get; set; } = new();
    public Payment? Payment { get; set; }
}
