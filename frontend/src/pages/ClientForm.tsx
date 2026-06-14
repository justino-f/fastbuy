import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clients } from '../services/api';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
  boxSizing: 'border-box',
};

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState({ name: '', cpf: '', phone: '', email: '' });

  useEffect(() => {
    if (isEdit) {
      clients.getById(Number(id)).then((r) => {
        const c = r.data;
        setForm({ name: c.name, cpf: c.cpf, phone: c.phone || '', email: c.email || '' });
      });
    }
  }, [id]);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      await clients.update(Number(id), form);
    } else {
      await clients.create(form);
    }
    navigate('/clients');
  };

  return (
    <div style={{ maxWidth: 500, backgroundColor: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: 20 }}>{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Nome</label>
          <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>CPF</label>
          <input style={inputStyle} value={form.cpf} onChange={(e) => set('cpf', e.target.value)} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Telefone</label>
          <input style={inputStyle} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Email</label>
          <input style={inputStyle} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Salvar
          </button>
          <button type="button" onClick={() => navigate('/clients')} style={{ padding: '10px 24px', backgroundColor: '#757575', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
