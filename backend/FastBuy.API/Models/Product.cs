namespace FastBuy.API.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Unit { get; set; } = "UN";
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public int MinStock { get; set; }
    public int CurrentStock { get; set; }
    public string? Description { get; set; }
    public bool Active { get; set; } = true;
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
