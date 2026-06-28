using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.DataStructures;
using FastBuy.API.DTOs;
using FastBuy.API.Models;

namespace FastBuy.API.Services;

public interface ISaleService
{
    Task<Sale> CreateSale(CreateSaleRequest request, int userId);
    Task<CancelledCoupon> CancelSale(int saleId, string reason, int userId);
    Task<List<Sale>> GetSales(DateTime? date, string? status);
    Task<Sale?> GetById(int id);
}

public class SaleService : ISaleService
{
    private readonly AppDbContext _db;
    private readonly IEnumerable<IPaymentGateway> _gateways;
    private readonly CouponStack _couponStack;

    public SaleService(AppDbContext db, IEnumerable<IPaymentGateway> gateways, CouponStack couponStack)
    {
        _db = db;
        _gateways = gateways;
        _couponStack = couponStack;
    }

    public async Task<Sale> CreateSale(CreateSaleRequest request, int userId)
    {
        var sale = new Sale
        {
            ClientId = request.ClientId,
            UserId = userId,
            CashRegisterId = request.CashRegisterId,
            Discount = request.Discount
        };

        decimal total = 0;
        var productNames = new List<string>();

        foreach (var item in request.Items)
        {
            var product = await _db.Products.FindAsync(item.ProductId);
            if (product == null) throw new Exception($"Produto {item.ProductId} não encontrado");

            var saleItem = new SaleItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = product.SalePrice,
                Subtotal = product.SalePrice * item.Quantity
            };

            total += saleItem.Subtotal;
            sale.Items.Add(saleItem);
            productNames.Add(product.Name);

            product.CurrentStock -= item.Quantity;
        }

        sale.Total = total;
        sale.FinalTotal = total - request.Discount;

        var gateway = _gateways.FirstOrDefault(g => g.Method == request.PaymentMethod)
            ?? throw new Exception("Método de pagamento inválido");

        var paymentResult = gateway.ProcessPayment(sale.FinalTotal, request.AmountPaid);
        if (!paymentResult.Success) throw new Exception("Pagamento recusado");

        sale.Payment = new Payment
        {
            Method = request.PaymentMethod,
            Amount = request.AmountPaid > 0 ? request.AmountPaid : sale.FinalTotal,
            Change = paymentResult.Change,
            Status = "Aprovado"
        };

        _db.Sales.Add(sale);
        await _db.SaveChangesAsync();
        return sale;
    }

    public async Task<CancelledCoupon> CancelSale(int saleId, string reason, int userId)
    {
        var sale = await _db.Sales
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(s => s.Id == saleId)
            ?? throw new Exception("Venda não encontrada");

        sale.Status = "Cancelada";

        foreach (var item in sale.Items)
        {
            if (item.Product != null)
                item.Product.CurrentStock += item.Quantity;
        }

        var itemsSummary = JsonSerializer.Serialize(sale.Items.Select(i => new
        {
            Product = i.Product?.Name,
            i.Quantity,
            i.Subtotal
        }));

        var coupon = new CancelledCoupon
        {
            SaleId = saleId,
            Total = sale.FinalTotal,
            Reason = reason,
            CancelledByUserId = userId,
            ItemsSummary = itemsSummary
        };

        _db.CancelledCoupons.Add(coupon);
        await _db.SaveChangesAsync();

        _couponStack.PushCoupon(coupon);

        return coupon;
    }

    public async Task<List<Sale>> GetSales(DateTime? date, string? status)
    {
        var query = _db.Sales
            .Include(s => s.Client)
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .Include(s => s.Payment)
            .AsQueryable();

        if (date.HasValue)
            query = query.Where(s => s.CreatedAt.Date == date.Value.Date);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(s => s.Status == status);

        return await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
    }

    public async Task<Sale?> GetById(int id)
        => await _db.Sales
            .Include(s => s.Client)
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .Include(s => s.Payment)
            .FirstOrDefaultAsync(s => s.Id == id);
}
