import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Supplier } from '../types';
import { suppliers } from '../services/api';

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

export default function Suppliers() {
  const [list, setList] = useState<Supplier[]>([]);
  const navigate = useNavigate();

  const load = () => {
    suppliers.getAll().then((r) => setList(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir fornecedor?')) return;
    await suppliers.delete(id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Fornecedores</h2>
        <button
          onClick={() => navigate('/suppliers/new')}
          style={{ ...btnStyle, backgroundColor: '#1976d2', padding: '8px 20px', fontSize: 14 }}
        >
          Novo Fornecedor
        </button>
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Razão Social</th>
            <th style={thStyle}>CNPJ</th>
            <th style={thStyle}>Telefone</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {list.map((s, i) => (
            <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={tdStyle}>{s.companyName}</td>
              <td style={tdStyle}>{s.cnpj}</td>
              <td style={tdStyle}>{s.phone}</td>
              <td style={tdStyle}>{s.email}</td>
              <td style={tdStyle}>
                <button onClick={() => navigate(`/suppliers/${s.id}/edit`)} style={{ ...btnStyle, backgroundColor: '#fb8c00' }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(s.id)} style={{ ...btnStyle, backgroundColor: '#e53935' }}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
