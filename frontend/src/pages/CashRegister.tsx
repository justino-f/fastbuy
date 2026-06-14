import { useState, useEffect } from 'react';
import { CashRegister as CashRegisterType } from '../types';
import { cashRegister } from '../services/api';

export default function CashRegister() {
  const [current, setCurrent] = useState<CashRegisterType | null>(null);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    cashRegister
      .getCurrent()
      .then((r) => setCurrent(r.data))
      .catch(() => setCurrent(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpen = async () => {
    await cashRegister.open(openingBalance);
    setOpeningBalance(0);
    load();
  };

  const handleClose = async () => {
    if (!confirm('Fechar o caixa?')) return;
    await cashRegister.close();
    load();
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Caixa</h2>
      {current && current.status === 'open' ? (
        <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#43a047', display: 'inline-block' }}></span>
            <strong style={{ color: '#43a047' }}>Caixa Aberto</strong>
          </div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            <strong>Abertura:</strong> {new Date(current.openedAt).toLocaleString('pt-BR')}
          </div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            <strong>Saldo Inicial:</strong> R$ {current.openingBalance.toFixed(2)}
          </div>
          {current.closingBalance !== undefined && current.closingBalance !== null && (
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              <strong>Saldo Atual:</strong> R$ {current.closingBalance.toFixed(2)}
            </div>
          )}
          <button
            onClick={handleClose}
            style={{ marginTop: 16, padding: '10px 24px', backgroundColor: '#e53935', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
          >
            Fechar Caixa
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#e53935', display: 'inline-block' }}></span>
            <strong style={{ color: '#e53935' }}>Caixa Fechado</strong>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Saldo Inicial (R$)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={openingBalance || ''}
              onChange={(e) => setOpeningBalance(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={handleOpen}
            style={{ padding: '10px 24px', backgroundColor: '#43a047', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
          >
            Abrir Caixa
          </button>
        </div>
      )}
    </div>
  );
}
