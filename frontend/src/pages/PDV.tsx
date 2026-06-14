import { useState, useRef, useEffect } from 'react';
import { Product, Client } from '../types';
import { products, clients, sales } from '../services/api';

interface CartItem {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  backgroundColor: '#1976d2',
  color: '#fff',
  fontSize: 12,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
};

export default function PDV() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [amountPaid, setAmountPaid] = useState(0);
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const total = cart.reduce((s, i) => s + i.subtotal, 0);
  const finalTotal = Math.max(0, total - discount);
  const change = paymentMethod === 'Dinheiro' ? Math.max(0, amountPaid - finalTotal) : 0;

  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + qty, subtotal: (i.quantity + qty) * i.unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: qty,
          unitPrice: product.salePrice,
          subtotal: product.salePrice * qty,
        },
      ];
    });
    setError('');
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: qty, subtotal: qty * i.unitPrice } : i
      )
    );
  };

  const handleBarcode = async () => {
    if (!barcode.trim()) return;
    try {
      const res = await products.getByBarcode(barcode.trim());
      addToCart(res.data);
      setBarcode('');
    } catch {
      setError('Produto não encontrado');
    }
    barcodeRef.current?.focus();
  };

  const handleProductSearch = async () => {
    if (!searchTerm.trim()) return;
    const res = await products.getAll({ search: searchTerm });
    setSearchResults(res.data);
  };

  const handleClientSearch = async () => {
    if (!clientSearch.trim()) return;
    const res = await clients.getAll(clientSearch);
    setClientResults(res.data);
  };

  const handleFinishSale = async () => {
    if (cart.length === 0) {
      setError('Carrinho vazio');
      return;
    }
    if (paymentMethod === 'Dinheiro' && amountPaid < finalTotal) {
      setError('Valor pago insuficiente');
      return;
    }
    try {
      const res = await sales.create({
        clientId: selectedClient?.id,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        discount,
        payment: {
          method: paymentMethod,
          amount: paymentMethod === 'Dinheiro' ? amountPaid : finalTotal,
        },
      });
      setReceipt(res.data);
    } catch {
      setError('Erro ao finalizar venda');
    }
  };

  const handleCancelSale = () => {
    if (!confirm('Cancelar venda atual?')) return;
    setCart([]);
    setSelectedClient(null);
    setDiscount(0);
    setAmountPaid(0);
    setError('');
    barcodeRef.current?.focus();
  };

  const closeReceipt = () => {
    setReceipt(null);
    setCart([]);
    setSelectedClient(null);
    setDiscount(0);
    setAmountPaid(0);
    setError('');
    barcodeRef.current?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 120px)' }}>
      <div style={{ flex: '0 0 60%', backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', backgroundColor: '#1976d2', color: '#fff' }}>
          <h3 style={{ margin: 0 }}>Itens da Venda</h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Produto</th>
                <th style={{ ...thStyle, width: 80 }}>Qtd</th>
                <th style={thStyle}>Preço</th>
                <th style={thStyle}>Subtotal</th>
                <th style={{ ...thStyle, width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#999', padding: 40 }}>
                    Escaneie um código de barras ou busque um produto
                  </td>
                </tr>
              ) : (
                cart.map((item) => (
                  <tr key={item.productId}>
                    <td style={tdStyle}>{item.name}</td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                        style={{ width: 50, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 4, textAlign: 'center' }}
                      />
                    </td>
                    <td style={tdStyle}>R$ {item.unitPrice.toFixed(2)}</td>
                    <td style={tdStyle}>R$ {item.subtotal.toFixed(2)}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 16 }}
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ flex: '0 0 38%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Código de Barras</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={barcodeRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBarcode()}
              placeholder="Escanear ou digitar..."
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 16 }}
              autoFocus
            />
            <button
              onClick={handleBarcode}
              style={{ padding: '10px 16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              OK
            </button>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{ marginTop: 8, padding: '6px 12px', backgroundColor: '#757575', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
          >
            Buscar Produto Manual
          </button>
          {showSearch && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleProductSearch()}
                  placeholder="Nome do produto..."
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
                />
                <button onClick={handleProductSearch} style={{ padding: '6px 12px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Buscar
                </button>
              </div>
              {searchResults.length > 0 && (
                <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4, marginTop: 4 }}>
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => { addToCart(p); setShowSearch(false); setSearchResults([]); setSearchTerm(''); barcodeRef.current?.focus(); }}
                      style={{ padding: '6px 8px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f0f0f0' }}
                    >
                      {p.name} - R$ {p.salePrice.toFixed(2)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Cliente (opcional)</label>
          {selectedClient ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13 }}>{selectedClient.name} - {selectedClient.cpf}</span>
              <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer' }}>X</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleClientSearch()}
                  placeholder="Buscar cliente..."
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
                />
                <button onClick={handleClientSearch} style={{ padding: '6px 12px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Buscar
                </button>
              </div>
              {clientResults.length > 0 && (
                <div style={{ maxHeight: 100, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4, marginTop: 4 }}>
                  {clientResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => { setSelectedClient(c); setClientResults([]); setClientSearch(''); }}
                      style={{ padding: '6px 8px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f0f0f0' }}
                    >
                      {c.name} - {c.cpf}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Desconto (R$)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value))}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ textAlign: 'center', padding: '16px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', margin: '8px 0' }}>
            <div style={{ fontSize: 12, color: '#666' }}>TOTAL</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1976d2' }}>R$ {finalTotal.toFixed(2)}</div>
            {discount > 0 && <div style={{ fontSize: 11, color: '#999', textDecoration: 'line-through' }}>R$ {total.toFixed(2)}</div>}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Forma de Pagamento</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }}
          >
            <option value="Dinheiro">Dinheiro</option>
            <option value="PIX">PIX</option>
            <option value="Crédito">Crédito</option>
            <option value="Débito">Débito</option>
          </select>
          {paymentMethod === 'Dinheiro' && (
            <>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Valor Recebido</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
              />
              {amountPaid > 0 && (
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 'bold', color: '#43a047' }}>
                  Troco: R$ {change.toFixed(2)}
                </div>
              )}
            </>
          )}
        </div>

        {error && <div style={{ color: '#e53935', fontSize: 13, textAlign: 'center' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleFinishSale}
            style={{ flex: 1, padding: '14px', backgroundColor: '#43a047', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}
          >
            Finalizar Venda
          </button>
          <button
            onClick={handleCancelSale}
            style={{ padding: '14px 20px', backgroundColor: '#e53935', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
          >
            Cancelar
          </button>
        </div>
      </div>

      {receipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, width: 400, maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ textAlign: 'center', marginBottom: 16 }}>CUPOM FISCAL</h3>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: 12, marginBottom: 12 }}>
              <strong>FastBuy SGS</strong>
              <div style={{ fontSize: 12, color: '#666' }}>Venda #{receipt.id}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{new Date(receipt.createdAt).toLocaleString('pt-BR')}</div>
            </div>
            {receipt.client && <div style={{ fontSize: 12, marginBottom: 8 }}>Cliente: {receipt.client.name}</div>}
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 4 }}>Item</th>
                  <th style={{ textAlign: 'right', padding: 4 }}>Qtd</th>
                  <th style={{ textAlign: 'right', padding: 4 }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td style={{ padding: 4 }}>{item.product?.name || item.productId}</td>
                    <td style={{ textAlign: 'right', padding: 4 }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: 4 }}>R$ {item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ borderTop: '1px dashed #ccc', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>Subtotal:</span>
                <span>R$ {receipt.total.toFixed(2)}</span>
              </div>
              {receipt.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>Desconto:</span>
                  <span>-R$ {receipt.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>
                <span>TOTAL:</span>
                <span>R$ {receipt.finalTotal.toFixed(2)}</span>
              </div>
              {receipt.payment && (
                <div style={{ fontSize: 12, marginTop: 4, color: '#666' }}>
                  Pagamento: {receipt.payment.method}
                  {receipt.payment.change > 0 && ` | Troco: R$ ${receipt.payment.change.toFixed(2)}`}
                </div>
              )}
            </div>
            <button
              onClick={closeReceipt}
              style={{ width: '100%', marginTop: 16, padding: 12, backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
