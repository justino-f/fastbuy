namespace FastBuy.API.DTOs.Clients;

public class ClientDto
{
    public string Name { get; set; } = string.Empty;
    public string CPF { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
}
