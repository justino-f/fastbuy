namespace FastBuy.API.DTOs.Dashboard;

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
