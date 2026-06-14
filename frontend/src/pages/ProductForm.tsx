import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product, Category } from '../types';
import { products, categories } from '../services/api';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
  boxSizing: 'border-box',
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: '',
    barcode: '',
    sku: '',
    categoryId: 0,
    brand: '',
    unit: 'un',
    costPrice: 0,
    salePrice: 0,
    minStock: 0,
    currentStock: 0,
    description: '',
    active: true,
    imageUrl: '',
  });

  useEffect(() => {
    categories.getAll().then((r) => setCats(r.data)).catch(() => {});
    if (isEdit) {
      products.getById(Number(id)).then((r) => {
        const p = r.data;
        setForm({
          name: p.name,
          barcode: p.barcode,
          sku: p.sku,
          categoryId: p.categoryId,
          brand: p.brand,
          unit: p.unit,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          minStock: p.minStock,
          currentStock: p.currentStock,
          description: p.description || '',
          active: p.active,
          imageUrl: p.imageUrl || '',
        });
      });
    }
  }, [id]);

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      await products.update(Number(id), form);
    } else {
      await products.create(form);
    }
    navigate('/products');
  };

  return (
    <div style={{ maxWidth: 700, backgroundColor: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: 20 }}>{isEdit ? 'Editar Produto' : 'Novo Produto'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Nome</label>
            <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Código de Barras</label>
            <input style={inputStyle} value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>SKU</label>
            <input style={inputStyle} value={form.sku} onChange={(e) => set('sku', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Categoria</label>
            <select style={inputStyle} value={form.categoryId} onChange={(e) => set('categoryId', Number(e.target.value))} required>
              <option value={0}>Selecione</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Marca</label>
            <input style={inputStyle} value={form.brand} onChange={(e) => set('brand', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Unidade</label>
            <input style={inputStyle} value={form.unit} onChange={(e) => set('unit', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Preço de Custo</label>
            <input style={inputStyle} type="number" step="0.01" value={form.costPrice} onChange={(e) => set('costPrice', Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Preço de Venda</label>
            <input style={inputStyle} type="number" step="0.01" value={form.salePrice} onChange={(e) => set('salePrice', Number(e.target.value))} required />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Estoque Mínimo</label>
            <input style={inputStyle} type="number" value={form.minStock} onChange={(e) => set('minStock', Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Estoque Atual</label>
            <input style={inputStyle} type="number" value={form.currentStock} onChange={(e) => set('currentStock', Number(e.target.value))} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Descrição</label>
          <textarea style={{ ...inputStyle, height: 60 }} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
          <label style={{ fontSize: 13 }}>Ativo</label>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button
            type="submit"
            style={{ padding: '10px 24px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => navigate('/products')}
            style={{ padding: '10px 24px', backgroundColor: '#757575', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
