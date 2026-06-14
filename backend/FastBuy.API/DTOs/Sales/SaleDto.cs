namespace FastBuy.API.DTOs.Sales;

public class SaleDto
{
    public int Id { get; set; }
    public string? ClientName { get; set; }
    public decimal Total { get; set; }
    public decimal Discount { get; set; }
    public decimal FinalTotal { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<SaleItemDto> Items { get; set; } = new();
    public string? PaymentMethod { get; set; }
}

public class SaleItemDto
{
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
}
