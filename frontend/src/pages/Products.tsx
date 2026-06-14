import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category } from '../types';
import { products, categories } from '../services/api';

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

export default function Products() {
  const [list, setList] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState('name');
  const [algorithm, setAlgorithm] = useState('quick');
  const navigate = useNavigate();

  const load = () => {
    products.getAll({ search, categoryId, sortBy, algorithm }).then((r) => setList(r.data)).catch(() => {});
  };

  useEffect(() => {
    categories.getAll().then((r) => setCats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [search, categoryId, sortBy, algorithm]);

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir produto?')) return;
    await products.delete(id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Produtos</h2>
        <button
          onClick={() => navigate('/products/new')}
          style={{ ...btnStyle, backgroundColor: '#1976d2', padding: '8px 20px', fontSize: 14 }}
        >
          Novo Produto
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, flex: 1 }}
        />
        <select
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }}
        >
          <option value="">Todas Categorias</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }}
        >
          <option value="name">Nome</option>
          <option value="price">Preço</option>
          <option value="stock">Estoque</option>
        </select>
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }}
        >
          <option value="bubble">Bubble Sort</option>
          <option value="insertion">Insertion Sort</option>
          <option value="quick">Quick Sort</option>
          <option value="merge">Merge Sort</option>
        </select>
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Nome</th>
            <th style={thStyle}>Código</th>
            <th style={thStyle}>Categoria</th>
            <th style={thStyle}>Preço</th>
            <th style={thStyle}>Estoque</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p, i) => (
            <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={tdStyle}>{p.name}</td>
              <td style={tdStyle}>{p.barcode}</td>
              <td style={tdStyle}>{p.category?.name}</td>
              <td style={tdStyle}>R$ {p.salePrice.toFixed(2)}</td>
              <td style={tdStyle}>{p.currentStock}</td>
              <td style={tdStyle}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                    backgroundColor: p.active ? '#e8f5e9' : '#ffebee',
                    color: p.active ? '#2e7d32' : '#c62828',
                  }}
                >
                  {p.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td style={tdStyle}>
                <button
                  onClick={() => navigate(`/products/${p.id}/edit`)}
                  style={{ ...btnStyle, backgroundColor: '#fb8c00' }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  style={{ ...btnStyle, backgroundColor: '#e53935' }}
                >
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
