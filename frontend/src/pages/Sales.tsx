import { useState, useEffect } from 'react';
import { Sale } from '../types';
import { sales } from '../services/api';

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

const btnStyle: React.CSSProperties = {
  padding: '4px 10px',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  color: '#fff',
  marginRight: 4,
};

export default function Sales() {
  const [list, setList] = useState<Sale[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Sale | null>(null);

  const load = () => {
    sales
      .getAll({ startDate: startDate || undefined, endDate: endDate || undefined, status: status || undefined })
      .then((r) => setList(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [startDate, endDate, status]);

  const handleCancel = async (id: number) => {
    const reason = prompt('Motivo do cancelamento:');
    if (!reason) return;
    await sales.cancel(id, reason);
    load();
  };

  const showDetails = async (sale: Sale) => {
    if (selected?.id === sale.id) {
      setSelected(null);
      return;
    }
    try {
      const res = await sales.getById(sale.id);
      setSelected(res.data);
    } catch {
      setSelected(sale);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Vendas</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }}
        >
          <option value="">Todos Status</option>
          <option value="completed">Concluída</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Data</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Total</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {list.map((s, i) => (
            <>
              <tr
                key={s.id}
                style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}
                onClick={() => showDetails(s)}
              >
                <td style={tdStyle}>{s.id}</td>
                <td style={tdStyle}>{new Date(s.createdAt).toLocaleString('pt-BR')}</td>
                <td style={tdStyle}>{s.client?.name || '-'}</td>
                <td style={tdStyle}>R$ {s.finalTotal.toFixed(2)}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: 11,
                      backgroundColor: s.status === 'completed' ? '#e8f5e9' : '#ffebee',
                      color: s.status === 'completed' ? '#2e7d32' : '#c62828',
                    }}
                  >
                    {s.status === 'completed' ? 'Concluída' : 'Cancelada'}
                  </span>
                </td>
                <td style={tdStyle}>
                  {s.status === 'completed' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCancel(s.id); }}
                      style={{ ...btnStyle, backgroundColor: '#e53935' }}
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
              {selected?.id === s.id && (
                <tr key={`d-${s.id}`}>
                  <td colSpan={6} style={{ padding: 16, backgroundColor: '#e3f2fd' }}>
                    <strong>Itens da Venda</strong>
                    <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 12, borderBottom: '1px solid #90caf9' }}>Produto</th>
                          <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 12, borderBottom: '1px solid #90caf9' }}>Qtd</th>
                          <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 12, borderBottom: '1px solid #90caf9' }}>Preço</th>
                          <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 12, borderBottom: '1px solid #90caf9' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.items?.map((item) => (
                          <tr key={item.id}>
                            <td style={{ padding: '6px 12px', fontSize: 12 }}>{item.product?.name || item.productId}</td>
                            <td style={{ padding: '6px 12px', fontSize: 12 }}>{item.quantity}</td>
                            <td style={{ padding: '6px 12px', fontSize: 12 }}>R$ {item.unitPrice.toFixed(2)}</td>
                            <td style={{ padding: '6px 12px', fontSize: 12 }}>R$ {item.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selected.payment && (
                      <div style={{ marginTop: 8, fontSize: 12 }}>
                        <strong>Pagamento:</strong> {selected.payment.method} | R$ {selected.payment.amount.toFixed(2)}
                        {selected.payment.change ? ` | Troco: R$ ${selected.payment.change.toFixed(2)}` : ''}
                      </div>
                    )}
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      <strong>Desconto:</strong> R$ {selected.discount.toFixed(2)} | <strong>Total:</strong> R$ {selected.finalTotal.toFixed(2)}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
