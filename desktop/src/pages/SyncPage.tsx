import { useState, useEffect } from 'react';
import { getProducts, syncPendingSales } from '../services/api';
import {
  getLastSyncTime,
  setLastSyncTime,
  getPendingSales,
  isOnline,
} from '../services/offlineStore';

export default function SyncPage() {
  const [online, setOnline] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncingSales, setSyncingSales] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  function refresh() {
    setLastSync(getLastSyncTime());
    setPendingCount(getPendingSales().length);
  }

  useEffect(() => {
    refresh();
    isOnline().then(setOnline);
    const interval = setInterval(() => {
      isOnline().then(setOnline);
      refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleSyncProducts() {
    setSyncingProducts(true);
    setMessage(null);
    try {
      const products = await getProducts();
      setLastSyncTime();
      refresh();
      setMessage({ text: `${products.length} produtos sincronizados.`, type: 'success' });
    } catch {
      setMessage({ text: 'Falha ao sincronizar produtos.', type: 'error' });
    } finally {
      setSyncingProducts(false);
    }
  }

  async function handleSyncSales() {
    setSyncingSales(true);
    setMessage(null);
    try {
      const result = await syncPendingSales();
      refresh();
      setMessage({
        text: `Vendas sincronizadas: ${result.synced} | Falhas: ${result.failed}`,
        type: result.failed > 0 ? 'error' : 'success',
      });
    } catch {
      setMessage({ text: 'Falha ao sincronizar vendas.', type: 'error' });
    } finally {
      setSyncingSales(false);
    }
  }

  function handleClearCache() {
    if (!window.confirm('Deseja realmente limpar o cache de produtos?')) return;
    localStorage.removeItem('fastbuy_products');
    setMessage({ text: 'Cache limpo.', type: 'success' });
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR');
  }

  const s = {
    container: { padding: 32, maxWidth: 720, margin: '0 auto' } as React.CSSProperties,
    title: { fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' } as React.CSSProperties,
    card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 } as React.CSSProperties,
    row: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as React.CSSProperties,
    dot: (color: string) => ({
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    }) as React.CSSProperties,
    label: { fontSize: 14, color: '#666' } as React.CSSProperties,
    value: { fontSize: 16, fontWeight: 600, color: '#333' } as React.CSSProperties,
    btn: (bg: string, disabled: boolean) => ({
      padding: '12px 24px',
      border: 'none',
      borderRadius: 8,
      background: bg,
      color: '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 600,
      fontSize: 14,
      opacity: disabled ? 0.6 : 1,
      marginRight: 8,
    }) as React.CSSProperties,
    msg: (type: 'success' | 'error') => ({
      padding: '12px 16px',
      borderRadius: 8,
      background: type === 'success' ? '#e8f5e9' : '#ffebee',
      color: type === 'success' ? '#2e7d32' : '#c62828',
      fontSize: 14,
      fontWeight: 500,
      marginBottom: 16,
    }) as React.CSSProperties,
    badge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FF9800', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 13, fontWeight: 700, marginLeft: 8 } as React.CSSProperties,
  };

  return (
    <div style={s.container}>
      <h1 style={s.title}>Sincronização</h1>

      {message && <div style={s.msg(message.type)}>{message.text}</div>}

      <div style={s.card}>
        <div style={s.row}>
          <div style={s.dot(online ? '#4CAF50' : '#f44336')} />
          <span style={s.value}>{online ? 'Online' : 'Offline'}</span>
        </div>
        <div style={s.row}>
          <span style={s.label}>Última sincronização:</span>
          <span style={s.value}>{lastSync ? formatDate(lastSync) : 'Nunca'}</span>
        </div>
        <div style={s.row}>
          <span style={s.label}>Vendas pendentes offline:</span>
          <span style={s.value}>
            {pendingCount}
            {pendingCount > 0 && <span style={s.badge}>{pendingCount}</span>}
          </span>
        </div>
      </div>

      <div style={s.card}>
        <button
          style={s.btn('#2196F3', syncingProducts)}
          onClick={handleSyncProducts}
          disabled={syncingProducts}
        >
          {syncingProducts ? 'Sincronizando...' : 'Sincronizar Produtos'}
        </button>
        <button
          style={s.btn('#4CAF50', syncingSales || pendingCount === 0)}
          onClick={handleSyncSales}
          disabled={syncingSales || pendingCount === 0}
        >
          {syncingSales ? 'Sincronizando...' : 'Sincronizar Vendas Pendentes'}
        </button>
        <button
          style={s.btn('#f44336', false)}
          onClick={handleClearCache}
        >
          Limpar Cache
        </button>
      </div>
    </div>
  );
}
