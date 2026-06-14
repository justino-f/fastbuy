import { useState, useEffect } from 'react';
import { Category } from '../types';
import { categories } from '../services/api';

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

export default function Categories() {
  const [list, setList] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const load = () => {
    categories.getAll().then((r) => setList(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await categories.create({ name });
    setName('');
    load();
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) return;
    await categories.update(editId, { name: editName });
    setEditId(null);
    setEditName('');
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir categoria?')) return;
    await categories.delete(id);
    load();
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Categorias</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Nova categoria..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, flex: 1 }}
        />
        <button
          onClick={handleCreate}
          style={{ ...btnStyle, backgroundColor: '#1976d2', padding: '8px 20px', fontSize: 14 }}
        >
          Adicionar
        </button>
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Nome</th>
            <th style={thStyle}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c, i) => (
            <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={tdStyle}>{c.id}</td>
              <td style={tdStyle}>
                {editId === c.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                    style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4 }}
                    autoFocus
                  />
                ) : (
                  c.name
                )}
              </td>
              <td style={tdStyle}>
                {editId === c.id ? (
                  <>
                    <button onClick={handleUpdate} style={{ ...btnStyle, backgroundColor: '#43a047' }}>
                      Salvar
                    </button>
                    <button onClick={() => setEditId(null)} style={{ ...btnStyle, backgroundColor: '#757575' }}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditId(c.id);
                        setEditName(c.name);
                      }}
                      style={{ ...btnStyle, backgroundColor: '#fb8c00' }}
                    >
                      Editar
                    </button>
                    <button onClick={() => handleDelete(c.id)} style={{ ...btnStyle, backgroundColor: '#e53935' }}>
                      Excluir
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
