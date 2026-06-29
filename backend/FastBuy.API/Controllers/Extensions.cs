using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace FastBuy.API.Controllers;

// Extrai userId do JWT — usado em StockController, CashRegisterController, SalesController
public static class ControllerExtensions
{
    public static int GetUserId(this ControllerBase controller)
        => int.Parse(controller.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}
