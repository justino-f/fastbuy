import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardData } from '../types';
import { dashboard } from '../services/api';

const cardStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#fff',
  padding: 20,
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  textAlign: 'center',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    dashboard.get().then((res) => setData(res.data)).catch(() => {});
  }, []);

  if (!data) return <p>Carregando...</p>;

  const cards = [
    { label: 'Total Vendido Hoje', value: `R$ ${data.totalSoldToday.toFixed(2)}` },
    { label: 'Produtos Vendidos', value: data.productsSoldToday },
    { label: 'Produtos em Falta', value: data.outOfStockCount },
    { label: 'Clientes Atendidos', value: data.clientsServedToday },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Dashboard</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {cards.map((c) => (
          <div key={c.label} style={cardStyle}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1976d2' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div
          style={{
            flex: 1,
            backgroundColor: '#fff',
            padding: 20,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h3 style={{ marginBottom: 16 }}>Vendas por Hora</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.salesByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: '#fff',
            padding: 20,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h3 style={{ marginBottom: 16 }}>Produtos Mais Vendidos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#43a047" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
