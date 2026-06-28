namespace FastBuy.API.DTOs;

// Auth
public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

// Products
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

// Clients
public class ClientDto
{
    public string Name { get; set; } = string.Empty;
    public string CPF { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
}

// Sales
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

// Dashboard
public class DashboardDto
{
    public decimal TotalSoldToday { get; set; }
    public int ProductsSoldToday { get; set; }
    public int OutOfStockCount { get; set; }
    public int ClientsServedToday { get; set; }
    public List<SalesByHourDto> SalesByHour { get; set; } = new();
    public List<TopProductDto> TopProducts { get; set; } = new();
}

public class SalesByHourDto
{
    public int Hour { get; set; }
    public decimal Total { get; set; }
}

public class TopProductDto
{
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
}
