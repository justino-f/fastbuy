namespace FastBuy.API.Models;

public class Supplier
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string CNPJ { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public bool Active { get; set; } = true;
}
