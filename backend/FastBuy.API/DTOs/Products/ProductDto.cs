namespace FastBuy.API.DTOs.Products;

public class ProductDto
{
    public string Name { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Unit { get; set; } = "UN";
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public int MinStock { get; set; }
    public int CurrentStock { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}
