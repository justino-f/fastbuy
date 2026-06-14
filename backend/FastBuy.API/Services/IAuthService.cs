using FastBuy.API.DTOs.Auth;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface IAuthService
{
    Task<LoginResponse?> Login(string email, string password);
    Task<User> Register(string name, string email, string password, string role);
}
