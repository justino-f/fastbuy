import { useState, useRef, useEffect, FormEvent } from 'react';
import { Product, SaleItem } from '../types';
import { createSale } from '../services/api';
import {
  getProductByBarcode,
  savePendingSale,
  isOnline as checkOnline,
  saveProducts,
} from '../services/offlineStore';
import axios from 'axios';

interface CartItem {
  product: Product;
  quantity: number;
}

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function PDV() {
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [amountReceived, setAmountReceived] = useState('');
  const [cpf, setCpf] = useState('');
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeRef.current?.focus();
    const interval = setInterval(async () => {
      setOnline(await checkOnline());
    }, 10000);
    checkOnline().then(setOnline);
    return () => clearInterval(interval);
  }, []);

  const total = cart.reduce((s, i) => s + i.product.salePrice * i.quantity, 0);
  const finalTotal = total * (1 - discount / 100);
  const change = paymentMethod === 'Dinheiro' && amountReceived
    ? parseFloat(amountReceived) - finalTotal
    : 0;

  async function searchProduct(e: FormEvent) {
    e.preventDefault();
    if (!barcode.trim()) return;

    let product: Product | null = null;

    if (online) {
      try {
        const resp = await api.get<Product[]>('/products', { params: { barcode: barcode.trim() } });
        if (resp.data.length > 0) {
          product = resp.data[0];
          saveProducts(resp.data);
        }
      } catch {
        product = getProductByBarcode(barcode.trim());
      }
    } else {
      product = getProductByBarcode(barcode.trim());
    }

    if (!product) {
      showMessage('Produto nao encontrado.', 'error');
      setBarcode('');
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product!.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });

    setBarcode('');
    barcodeRef.current?.focus();
  }

  function changeQty(idx: number, delta: number) {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[idx].quantity + delta;
      if (newQty <= 0) return updated.filter((_, i) => i !== idx);
      updated[idx] = { ...updated[idx], quantity: newQty };
      return updated;
    });
  }

  function removeItem(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function showMessage(msg: string, type: 'success' | 'error') {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  }

  async function finalizeSale() {
    if (cart.length === 0) return;

    const saleData = {
      items: cart.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitPrice: i.product.salePrice,
        subtotal: i.product.salePrice * i.quantity,
      })),
      total,
      discount,
      finalTotal,
      payment: {
        method: paymentMethod,
        amount: paymentMethod === 'Dinheiro' ? parseFloat(amountReceived) || finalTotal : finalTotal,
        change: paymentMethod === 'Dinheiro' ? Math.max(change, 0) : 0,
      },
      clientCpf: cpf || undefined,
    };

    try {
      await createSale(saleData);
      showMessage('Venda finalizada com sucesso!', 'success');
    } catch {
      savePendingSale(saleData);
      showMessage('Venda salva offline. Sera sincronizada quando houver conexao.', 'success');
    }

    setCart([]);
    setDiscount(0);
    setPaymentMethod('Dinheiro');
    setAmountReceived('');
    setCpf('');
    barcodeRef.current?.focus();
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div style={styles.root}>
      <div style={styles.statusBar}>
        <span style={{ ...styles.statusDot, background: online ? '#4caf50' : '#f44336' }} />
        <span style={{ fontSize: 13, color: '#555' }}>{online ? 'Online' : 'Offline'}</span>
        {message && (
          <span style={{ ...styles.msg, background: messageType === 'success' ? '#e8f5e9' : '#ffebee', color: messageType === 'success' ? '#2e7d32' : '#c62828' }}>
            {message}
          </span>
        )}
      </div>

      <div style={styles.body}>
        <div style={styles.left}>
          <form onSubmit={searchProduct} style={styles.searchRow}>
            <input
              ref={barcodeRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Codigo de barras"
              style={styles.searchInput}
              autoFocus
            />
            <button type="submit" style={styles.searchBtn}>Buscar</button>
          </form>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produto</th>
                  <th style={{ ...styles.th, width: 80, textAlign: 'center' }}>Qtd</th>
                  <th style={{ ...styles.th, width: 100, textAlign: 'right' }}>Preco Unit.</th>
                  <th style={{ ...styles.th, width: 100, textAlign: 'right' }}>Subtotal</th>
                  <th style={{ ...styles.th, width: 110, textAlign: 'center' }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 && (
                  <tr><td colSpan={5} style={styles.empty}>Nenhum item adicionado</td></tr>
                )}
                {cart.map((item, idx) => (
                  <tr key={item.product.id}>
                    <td style={styles.td}>{item.product.name}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(item.product.salePrice)}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(item.product.salePrice * item.quantity)}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button onClick={() => changeQty(idx, -1)} style={styles.qtyBtn}>-</button>
                      <button onClick={() => changeQty(idx, 1)} style={styles.qtyBtn}>+</button>
                      <button onClick={() => removeItem(idx)} style={styles.removeBtn}>X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.right}>
          <h3 style={styles.summaryTitle}>Resumo da Venda</h3>

          <div style={styles.row}><span>Total:</span><span style={styles.totalValue}>{fmt(total)}</span></div>

          <label style={styles.label}>Desconto (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            style={styles.sideInput}
          />

          <div style={styles.row}><span>Total Final:</span><span style={styles.finalValue}>{fmt(finalTotal)}</span></div>

          <label style={styles.label}>Forma de Pagamento</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={styles.sideInput}
          >
            <option>Dinheiro</option>
            <option>Cartao Credito</option>
            <option>Cartao Debito</option>
            <option>PIX</option>
          </select>

          {paymentMethod === 'Dinheiro' && (
            <>
              <label style={styles.label}>Valor Recebido</label>
              <input
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                style={styles.sideInput}
              />
              {amountReceived && (
                <div style={{ ...styles.row, color: change < 0 ? '#c62828' : '#2e7d32' }}>
                  <span>Troco:</span><span>{fmt(Math.max(change, 0))}</span>
                </div>
              )}
            </>
          )}

          <label style={styles.label}>CPF do Cliente (opcional)</label>
          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="000.000.000-00"
            style={styles.sideInput}
          />

          <button
            onClick={finalizeSale}
            disabled={cart.length === 0}
            style={{
              ...styles.finalizeBtn,
              opacity: cart.length === 0 ? 0.5 : 1,
            }}
          >
            Finalizar Venda
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f5' },
  statusBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #e0e0e0' },
  statusDot: { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' },
  msg: { marginLeft: 'auto', padding: '4px 12px', borderRadius: 4, fontSize: 13 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  left: { flex: 7, display: 'flex', flexDirection: 'column', padding: 16, gap: 12 },
  right: { flex: 3, background: '#fff', padding: 20, borderLeft: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' },
  searchRow: { display: 'flex', gap: 8 },
  searchInput: { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 4, fontSize: 15 },
  searchBtn: { padding: '10px 20px', background: '#2196F3', color: '#fff', border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer' },
  tableWrap: { flex: 1, overflow: 'auto', background: '#fff', borderRadius: 6, border: '1px solid #e0e0e0' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', background: '#fafafa', borderBottom: '2px solid #e0e0e0', fontSize: 13, fontWeight: 600, color: '#555' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
  empty: { textAlign: 'center' as const, padding: 40, color: '#999', fontSize: 14 },
  qtyBtn: { width: 28, height: 28, margin: '0 2px', border: '1px solid #ddd', borderRadius: 4, background: '#fafafa', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  removeBtn: { width: 28, height: 28, margin: '0 2px', border: 'none', borderRadius: 4, background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  summaryTitle: { margin: 0, fontSize: 18, color: '#333', borderBottom: '1px solid #e0e0e0', paddingBottom: 10 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontWeight: 500 },
  totalValue: { fontSize: 18, fontWeight: 700, color: '#333' },
  finalValue: { fontSize: 22, fontWeight: 700, color: '#2196F3' },
  label: { fontSize: 13, color: '#666', marginTop: 4 },
  sideInput: { padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  finalizeBtn: { marginTop: 'auto', padding: '14px 0', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
};
