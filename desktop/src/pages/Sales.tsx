import { useState, useEffect } from 'react';
import { Sale } from '../types';
import { getSales } from '../services/api';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    setLoading(true);
    try {
      const data = await getSales();
      setSales(data);
    } catch {
      setError('Erro ao carregar vendas.');
    } finally {
      setLoading(false);
    }
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR');

  if (loading) return <div style={styles.loading}>Carregando...</div>;

  return (
    <div style={styles.root}>
      <h2 style={styles.pageTitle}>Vendas</h2>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Data</th>
              <th style={styles.th}>Cliente</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Total</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Desconto</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Total Final</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr><td colSpan={7} style={styles.empty}>Nenhuma venda encontrada</td></tr>
            )}
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td style={styles.td}>{sale.id}</td>
                <td style={styles.td}>{fmtDate(sale.createdAt)}</td>
                <td style={styles.td}>{sale.client?.name ?? '-'}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(sale.total)}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{sale.discount}%</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(sale.finalTotal)}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <span style={{
                    ...styles.badge,
                    background: sale.status === 'completed' ? '#e8f5e9' : sale.status === 'cancelled' ? '#ffebee' : '#fff3e0',
                    color: sale.status === 'completed' ? '#2e7d32' : sale.status === 'cancelled' ? '#c62828' : '#e65100',
                  }}>
                    {sale.status === 'completed' ? 'Concluida' : sale.status === 'cancelled' ? 'Cancelada' : sale.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { padding: 24, maxWidth: 1100, margin: '0 auto' },
  pageTitle: { margin: '0 0 20px', fontSize: 22, color: '#333' },
  loading: { padding: 40, textAlign: 'center', color: '#999' },
  error: { background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 4, fontSize: 14, marginBottom: 16 },
  tableWrap: { background: '#fff', borderRadius: 6, border: '1px solid #e0e0e0', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', background: '#fafafa', borderBottom: '2px solid #e0e0e0', fontSize: 13, fontWeight: 600, color: '#555' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
  empty: { textAlign: 'center' as const, padding: 30, color: '#999', fontSize: 14 },
  badge: { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
};
