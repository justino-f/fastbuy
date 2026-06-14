import { useState, useEffect } from 'react';
import { Category } from '../types';
import { categories } from '../services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export default function Categories() {
  const [list, setList] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    categories.getAll().then((r) => setList(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await categories.create({ name: name.trim() });
      setName('');
      setError('');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao criar categoria.');
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) return;
    try {
      await categories.update(editId, { name: editName.trim() });
      setEditId(null);
      setEditName('');
      setError('');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao atualizar categoria.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir categoria?')) return;
    try {
      await categories.delete(id);
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao excluir categoria.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Categorias</h2>
        <div className="flex gap-3">
          <input
            placeholder="Nova categoria..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-gray-500 dark:text-gray-400">{c.id}</TableCell>
                <TableCell>
                  {editId === c.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                      className="rounded-xl border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full max-w-xs"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium text-gray-800 dark:text-white">{c.name}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editId === c.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={handleUpdate} className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors" title="Salvar">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditId(null)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Cancelar">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditId(c.id); setEditName(c.name); }} className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
