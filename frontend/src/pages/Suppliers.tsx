import { useState, useEffect, FormEvent } from 'react';
import { Supplier } from '../types';
import { suppliers } from '../services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Plus, Pencil, Trash2, Truck } from 'lucide-react';

const emptyForm = { companyName: '', cnpj: '', phone: '', email: '', address: '', active: true };

export default function Suppliers() {
  const [list, setList] = useState<Supplier[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => { suppliers.getAll().then((r) => setList(r.data)).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditId(s.id);
    setForm({ companyName: s.companyName, cnpj: s.cnpj, phone: s.phone || '', email: s.email || '', address: s.address || '', active: s.active });
    setModalOpen(true);
  };

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editId) await suppliers.update(editId, form);
    else await suppliers.create(form);
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir fornecedor?')) return;
    await suppliers.delete(id);
    load();
  };

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none';
  const labelCls = 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block';

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Fornecedores</h2>
        <button onClick={openNew} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Novo Fornecedor
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Razão Social</TableHead><TableHead>CNPJ</TableHead><TableHead>Email</TableHead><TableHead>Telefone</TableHead><TableHead className="text-center">Status</TableHead><TableHead className="w-32">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium text-gray-900 dark:text-white">{s.companyName}</TableCell>
              <TableCell>{s.cnpj}</TableCell>
              <TableCell>{s.email}</TableCell>
              <TableCell>{s.phone}</TableCell>
              <TableCell className="text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.active ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {s.active ? 'Ativo' : 'Inativo'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 transition-colors"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 flex h-10 w-10 items-center justify-center rounded-full">
              <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle>{editId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
              <DialogDescription>{editId ? 'Altere os dados do fornecedor' : 'Preencha os dados para cadastrar'}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Razão Social</label><input className={inputCls} value={form.companyName} onChange={(e) => set('companyName', e.target.value)} required /></div>
            <div><label className={labelCls}>CNPJ</label><input className={inputCls} value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} required /></div>
            <div><label className={labelCls}>Email</label><input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div><label className={labelCls}>Telefone</label><input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            <div className="col-span-2"><label className={labelCls}>Endereço</label><input className={inputCls} value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label className="text-sm text-gray-700 dark:text-gray-300">Ativo</label>
            </div>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Salvar</button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
