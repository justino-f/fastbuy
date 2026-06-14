namespace FastBuy.API.Models;

public class Client
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CPF { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Sale> Sales { get; set; } = new();
}
