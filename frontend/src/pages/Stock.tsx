import { useState, useEffect } from 'react';
import { Product, StockMovement } from '../types';
import { stock, products } from '../services/api';

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  borderRadius: 8,
  overflow: 'hidden',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  backgroundColor: '#1976d2',
  color: '#fff',
  fontSize: 13,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderBottom: '1px solid #eee',
  fontSize: 13,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
  boxSizing: 'border-box' as const,
};

export default function Stock() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [filterProduct, setFilterProduct] = useState<number | undefined>();
  const [form, setForm] = useState({ productId: 0, type: 'Entrada', quantity: 0, reason: '' });

  const loadMovements = () => {
    stock.getMovements(filterProduct).then((r) => setMovements(r.data)).catch(() => {});
  };

  useEffect(() => {
    products.getAll().then((r) => setProductList(r.data)).catch(() => {});
    stock.getLowStock().then((r) => setLowStock(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadMovements();
  }, [filterProduct]);

  const handleAdd = async () => {
    if (!form.productId || form.quantity <= 0) return;
    await stock.addMovement(form);
    setForm({ productId: 0, type: 'Entrada', quantity: 0, reason: '' });
    loadMovements();
    stock.getLowStock().then((r) => setLowStock(r.data)).catch(() => {});
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Estoque</h2>

      <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Nova Movimentação</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select
            value={form.productId}
            onChange={(e) => setForm((f) => ({ ...f, productId: Number(e.target.value) }))}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value={0}>Selecione o produto</option>
            {productList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            style={inputStyle}
          >
            <option value="Entrada">Entrada</option>
            <option value="Saída">Saída</option>
            <option value="Ajuste">Ajuste</option>
            <option value="Perda">Perda</option>
          </select>
          <input
            type="number"
            min={1}
            placeholder="Qtd"
            value={form.quantity || ''}
            onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
            style={{ ...inputStyle, width: 80 }}
          />
          <input
            placeholder="Motivo"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleAdd}
            style={{ padding: '8px 20px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Registrar
          </button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div style={{ backgroundColor: '#fff3e0', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #ffcc02' }}>
          <h3 style={{ color: '#e65100', marginBottom: 8 }}>Produtos com Estoque Baixo</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 12 }}>Produto</th>
                <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 12 }}>Estoque Atual</th>
                <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 12 }}>Estoque Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '6px 12px', fontSize: 12 }}>{p.name}</td>
                  <td style={{ padding: '6px 12px', fontSize: 12, color: '#e53935', fontWeight: 'bold' }}>{p.currentStock}</td>
                  <td style={{ padding: '6px 12px', fontSize: 12 }}>{p.minStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <select
          value={filterProduct ?? ''}
          onChange={(e) => setFilterProduct(e.target.value ? Number(e.target.value) : undefined)}
          style={inputStyle}
        >
          <option value="">Todos os produtos</option>
          {productList.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Produto</th>
            <th style={thStyle}>Tipo</th>
            <th style={thStyle}>Quantidade</th>
            <th style={thStyle}>Motivo</th>
            <th style={thStyle}>Data</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m, i) => (
            <tr key={m.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={tdStyle}>{m.product?.name || m.productId}</td>
              <td style={tdStyle}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 11,
                  backgroundColor: m.type === 'Entrada' ? '#e8f5e9' : m.type === 'Saída' ? '#ffebee' : '#fff3e0',
                  color: m.type === 'Entrada' ? '#2e7d32' : m.type === 'Saída' ? '#c62828' : '#e65100',
                }}>
                  {m.type}
                </span>
              </td>
              <td style={tdStyle}>{m.quantity}</td>
              <td style={tdStyle}>{m.reason}</td>
              <td style={tdStyle}>{new Date(m.createdAt).toLocaleString('pt-BR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
