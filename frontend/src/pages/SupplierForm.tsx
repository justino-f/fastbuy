import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { suppliers } from '../services/api';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
  boxSizing: 'border-box',
};

export default function SupplierForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState({
    companyName: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    active: true,
  });

  useEffect(() => {
    if (isEdit) {
      suppliers.getAll().then((r) => {
        const s = r.data.find((x: any) => x.id === Number(id));
        if (s) {
          setForm({
            companyName: s.companyName,
            cnpj: s.cnpj,
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            active: s.active,
          });
        }
      });
    }
  }, [id]);

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      await suppliers.update(Number(id), form);
    } else {
      await suppliers.create(form);
    }
    navigate('/suppliers');
  };

  return (
    <div style={{ maxWidth: 500, backgroundColor: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: 20 }}>{isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Razão Social</label>
          <input style={inputStyle} value={form.companyName} onChange={(e) => set('companyName', e.target.value)} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>CNPJ</label>
          <input style={inputStyle} value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Telefone</label>
          <input style={inputStyle} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Email</label>
          <input style={inputStyle} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Endereço</label>
          <input style={inputStyle} value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
          <label style={{ fontSize: 13 }}>Ativo</label>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Salvar
          </button>
          <button type="button" onClick={() => navigate('/suppliers')} style={{ padding: '10px 24px', backgroundColor: '#757575', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
