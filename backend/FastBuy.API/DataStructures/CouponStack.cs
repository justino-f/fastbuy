using FastBuy.API.Models;

namespace FastBuy.API.DataStructures;

// Pilha de cupons cancelados - demonstra estrutura de dados LIFO (Last In, First Out)
public class CouponStack
{
    private readonly Stack<CancelledCoupon> _stack = new();

    public void PushCoupon(CancelledCoupon coupon) => _stack.Push(coupon);

    public CancelledCoupon PopCoupon() => _stack.Pop();

    public CancelledCoupon PeekCoupon() => _stack.Peek();

    public List<CancelledCoupon> GetAll() => _stack.ToList();

    public int Count => _stack.Count;
}
