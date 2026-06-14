import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, Sale } from '../types';
import { clients } from '../services/api';

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

export default function Clients() {
  const [list, setList] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<Sale[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const navigate = useNavigate();

  const load = () => {
    clients.getAll(search || undefined).then((r) => setList(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, [search]);

  const showHistory = async (c: Client) => {
    if (selectedClient?.id === c.id) {
      setSelectedClient(null);
      return;
    }
    const res = await clients.getPurchaseHistory(c.id);
    setHistory(res.data);
    setSelectedClient(c);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Clientes</h2>
        <button
          onClick={() => navigate('/clients/new')}
          style={{ ...btnStyle, backgroundColor: '#1976d2', padding: '8px 20px', fontSize: 14 }}
        >
          Novo Cliente
        </button>
      </div>
      <input
        placeholder="Buscar por nome ou CPF..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, width: '100%', marginBottom: 16, boxSizing: 'border-box' }}
      />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Nome</th>
            <th style={thStyle}>CPF</th>
            <th style={thStyle}>Telefone</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c, i) => (
            <>
              <tr
                key={c.id}
                style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}
                onClick={() => showHistory(c)}
              >
                <td style={tdStyle}>{c.name}</td>
                <td style={tdStyle}>{c.cpf}</td>
                <td style={tdStyle}>{c.phone}</td>
                <td style={tdStyle}>{c.email}</td>
                <td style={tdStyle}>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/clients/${c.id}/edit`); }}
                    style={{ ...btnStyle, backgroundColor: '#fb8c00' }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
              {selectedClient?.id === c.id && (
                <tr key={`h-${c.id}`}>
                  <td colSpan={5} style={{ padding: 16, backgroundColor: '#e3f2fd' }}>
                    <strong>Histórico de Compras</strong>
                    {history.length === 0 ? (
                      <p style={{ margin: '8px 0 0', fontSize: 13 }}>Nenhuma compra encontrada.</p>
                    ) : (
                      <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 12, borderBottom: '1px solid #90caf9' }}>ID</th>
                            <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 12, borderBottom: '1px solid #90caf9' }}>Data</th>
                            <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 12, borderBottom: '1px solid #90caf9' }}>Total</th>
                            <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 12, borderBottom: '1px solid #90caf9' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((s) => (
                            <tr key={s.id}>
                              <td style={{ padding: '6px 12px', fontSize: 12 }}>{s.id}</td>
                              <td style={{ padding: '6px 12px', fontSize: 12 }}>{new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
                              <td style={{ padding: '6px 12px', fontSize: 12 }}>R$ {s.finalTotal.toFixed(2)}</td>
                              <td style={{ padding: '6px 12px', fontSize: 12 }}>{s.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
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
