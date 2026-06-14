namespace FastBuy.API.DTOs.Sales;

public class CreateSaleRequest
{
    public int? ClientId { get; set; }
    public int CashRegisterId { get; set; }
    public List<SaleItemRequest> Items { get; set; } = new();
    public decimal Discount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal AmountPaid { get; set; }
}

public class SaleItemRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}
