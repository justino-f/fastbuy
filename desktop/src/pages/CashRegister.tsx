import { useState, useEffect } from 'react';
import { CashRegister as CashRegisterType } from '../types';
import { getCashRegisters, openCashRegister, closeCashRegister } from '../services/api';

export default function CashRegister() {
  const [registers, setRegisters] = useState<CashRegisterType[]>([]);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentOpen = registers.find((r) => r.status === 'open');

  useEffect(() => {
    loadRegisters();
  }, []);

  async function loadRegisters() {
    setLoading(true);
    try {
      const data = await getCashRegisters();
      setRegisters(data);
    } catch {
      setError('Erro ao carregar caixas.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    const value = parseFloat(openingBalance);
    if (isNaN(value) || value < 0) return;
    try {
      await openCashRegister(value);
      setOpeningBalance('');
      await loadRegisters();
    } catch {
      setError('Erro ao abrir caixa.');
    }
  }

  async function handleClose() {
    if (!currentOpen) return;
    const value = parseFloat(closingBalance);
    if (isNaN(value) || value < 0) return;
    try {
      await closeCashRegister(currentOpen.id, value);
      setClosingBalance('');
      await loadRegisters();
    } catch {
      setError('Erro ao fechar caixa.');
    }
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR');

  if (loading) return <div style={styles.loading}>Carregando...</div>;

  return (
    <div style={styles.root}>
      <h2 style={styles.pageTitle}>Gerenciamento de Caixa</h2>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {currentOpen ? (
          <>
            <h3 style={styles.cardTitle}>Caixa Aberto</h3>
            <p style={styles.info}>Saldo de Abertura: <strong>{fmt(currentOpen.openingBalance)}</strong></p>
            <p style={styles.info}>Aberto em: <strong>{fmtDate(currentOpen.openedAt)}</strong></p>
            <div style={styles.formRow}>
              <input
                type="number"
                step="0.01"
                placeholder="Saldo de fechamento"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                style={styles.input}
              />
              <button onClick={handleClose} style={styles.closeBtn}>Fechar Caixa</button>
            </div>
          </>
        ) : (
          <>
            <h3 style={styles.cardTitle}>Nenhum Caixa Aberto</h3>
            <div style={styles.formRow}>
              <input
                type="number"
                step="0.01"
                placeholder="Saldo de abertura"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                style={styles.input}
              />
              <button onClick={handleOpen} style={styles.openBtn}>Abrir Caixa</button>
            </div>
          </>
        )}
      </div>

      <h3 style={styles.sectionTitle}>Historico de Caixas</h3>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Abertura</th>
              <th style={styles.th}>Fechamento</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Saldo Abertura</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Saldo Fechamento</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {registers.length === 0 && (
              <tr><td colSpan={6} style={styles.empty}>Nenhum registro encontrado</td></tr>
            )}
            {registers.map((r) => (
              <tr key={r.id}>
                <td style={styles.td}>{r.id}</td>
                <td style={styles.td}>{fmtDate(r.openedAt)}</td>
                <td style={styles.td}>{r.closedAt ? fmtDate(r.closedAt) : '-'}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(r.openingBalance)}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{r.closingBalance != null ? fmt(r.closingBalance) : '-'}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <span style={{ ...styles.badge, background: r.status === 'open' ? '#e8f5e9' : '#f5f5f5', color: r.status === 'open' ? '#2e7d32' : '#757575' }}>
                    {r.status === 'open' ? 'Aberto' : 'Fechado'}
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
  root: { padding: 24, maxWidth: 960, margin: '0 auto' },
  pageTitle: { margin: '0 0 20px', fontSize: 22, color: '#333' },
  loading: { padding: 40, textAlign: 'center', color: '#999' },
  error: { background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 4, fontSize: 14, marginBottom: 16 },
  card: { background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 },
  cardTitle: { margin: '0 0 12px', fontSize: 17, color: '#333' },
  info: { margin: '4px 0', fontSize: 14, color: '#555' },
  formRow: { display: 'flex', gap: 8, marginTop: 12 },
  input: { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  openBtn: { padding: '10px 24px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  closeBtn: { padding: '10px 24px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  sectionTitle: { fontSize: 17, color: '#333', margin: '0 0 12px' },
  tableWrap: { background: '#fff', borderRadius: 6, border: '1px solid #e0e0e0', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', background: '#fafafa', borderBottom: '2px solid #e0e0e0', fontSize: 13, fontWeight: 600, color: '#555' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
  empty: { textAlign: 'center' as const, padding: 30, color: '#999', fontSize: 14 },
  badge: { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
};
