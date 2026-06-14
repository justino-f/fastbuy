import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { reports } from '../services/api';

const tabStyle: React.CSSProperties = {
  padding: '10px 20px',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  borderBottom: '3px solid transparent',
  backgroundColor: 'transparent',
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  borderBottom: '3px solid #1976d2',
  color: '#1976d2',
  fontWeight: 'bold',
};

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

export default function Reports() {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState('diário');
  const [salesData, setSalesData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);

  useEffect(() => {
    if (tab === 0) reports.getSales(period).then((r) => setSalesData(r.data)).catch(() => {});
    if (tab === 1) reports.getTopProducts().then((r) => setTopProducts(r.data)).catch(() => {});
    if (tab === 2) reports.getLowStock().then((r) => setLowStock(r.data)).catch(() => {});
    if (tab === 3) reports.getRevenue().then((r) => setRevenue(r.data)).catch(() => {});
  }, [tab, period]);

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Relatórios</h2>
      <div style={{ borderBottom: '1px solid #ddd', marginBottom: 20 }}>
        {['Vendas', 'Produtos Mais Vendidos', 'Estoque Baixo', 'Faturamento'].map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={tab === i ? activeTabStyle : tabStyle}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }}
            >
              <option value="diário">Diário</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>
          {salesData && (
            <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Total</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1976d2' }}>
                    R$ {(salesData.total ?? 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Quantidade</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#43a047' }}>
                    {salesData.count ?? 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 1 && (
        <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
          <table style={{ ...tableStyle, marginTop: 16 }}>
            <thead>
              <tr>
                <th style={thStyle}>Produto</th>
                <th style={thStyle}>Quantidade Vendida</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p: any, i: number) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={tdStyle}>{p.name}</td>
                  <td style={tdStyle}>{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Produto</th>
              <th style={thStyle}>Estoque Atual</th>
              <th style={thStyle}>Estoque Mínimo</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((p: any, i: number) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={tdStyle}>{p.name}</td>
                <td style={{ ...tdStyle, color: '#e53935', fontWeight: 'bold' }}>{p.currentStock}</td>
                <td style={tdStyle}>{p.minStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 3 && revenue && (
        <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: 16 }}>Resumo de Faturamento</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#e3f2fd', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Diário</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1976d2' }}>
                R$ {(revenue.daily ?? 0).toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#e8f5e9', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Semanal</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#43a047' }}>
                R$ {(revenue.weekly ?? 0).toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#fce4ec', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Mensal</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#e53935' }}>
                R$ {(revenue.monthly ?? 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
