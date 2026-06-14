import { useState, useEffect, FormEvent } from 'react';
import { Client, Sale } from '../types';
import api, { clients } from '../services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Plus, Search, Pencil, Trash2, ChevronDown, ChevronUp, Users } from 'lucide-react';

const emptyForm = { name: '', cpf: '', phone: '', email: '' };

export default function Clients() {
  const [list, setList] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<Sale[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => { clients.getAll(search || undefined).then((r) => setList(r.data)).catch(() => {}); };
  useEffect(() => { load(); }, [search]);

  const showHistory = async (c: Client) => {
    if (selectedClient?.id === c.id) { setSelectedClient(null); return; }
    const res = await clients.getPurchaseHistory(c.id);
    setHistory(res.data);
    setSelectedClient(c);
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: Client) => {
    setEditId(c.id);
    setForm({ name: c.name, cpf: c.cpf, phone: c.phone || '', email: c.email || '' });
    setModalOpen(true);
  };

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editId) await clients.update(editId, form);
    else await clients.create(form);
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    await api.delete(`/clients/${id}`);
    load();
  };

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none';
  const labelCls = 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block';

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Clientes</h2>
        <button onClick={openNew} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Novo Cliente
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input placeholder="Buscar por nome ou CPF..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>CPF</TableHead><TableHead>Telefone</TableHead><TableHead className="w-32">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((c) => (
            <>
              <TableRow key={c.id} className="cursor-pointer" onClick={() => showHistory(c)}>
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    {selectedClient?.id === c.id ? <ChevronUp className="h-4 w-4 text-indigo-500" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    {c.name}
                  </div>
                </TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.cpf}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="p-1.5 rounded-lg text-gray-400 transition-colors hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"><Pencil className="h-4 w-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="p-1.5 rounded-lg text-gray-400 transition-colors hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
              {selectedClient?.id === c.id && (
                <tr key={`h-${c.id}`}>
                  <td colSpan={5} className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-4">
                    <p className="mb-3 text-sm font-semibold text-indigo-800 dark:text-indigo-300">Histórico de Compras</p>
                    {history.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhuma compra encontrada.</p>
                    ) : (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border-b border-indigo-200 dark:border-indigo-700 px-3 py-2 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-400">ID</th>
                            <th className="border-b border-indigo-200 dark:border-indigo-700 px-3 py-2 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-400">Data</th>
                            <th className="border-b border-indigo-200 dark:border-indigo-700 px-3 py-2 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-400">Total</th>
                            <th className="border-b border-indigo-200 dark:border-indigo-700 px-3 py-2 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((s) => (
                            <tr key={s.id} className="hover:bg-indigo-100/50 dark:hover:bg-indigo-800/20">
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">{s.id}</td>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">{new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">R$ {s.finalTotal.toFixed(2)}</td>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">{s.status}</td>
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
        </TableBody>
      </Table>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 flex h-10 w-10 items-center justify-center rounded-full">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle>{editId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
              <DialogDescription>{editId ? 'Altere os dados do cliente' : 'Preencha os dados para cadastrar'}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Nome</label><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required /></div>
            <div><label className={labelCls}>CPF</label><input className={inputCls} value={form.cpf} onChange={(e) => set('cpf', e.target.value)} required /></div>
            <div><label className={labelCls}>Telefone</label><input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            <div><label className={labelCls}>Email</label><input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
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
