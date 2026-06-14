import { useState, useEffect } from 'react';
import { Sale } from '../types';
import { getSales } from '../services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadSales(); }, []);

  async function loadSales() {
    setLoading(true);
    try { const data = await getSales(); setSales(data); } catch { setError('Erro ao carregar vendas.'); } finally { setLoading(false); }
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR');

  if (loading) return <p className="text-gray-400 p-6">Carregando...</p>;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Vendas</h2>
        <p className="text-sm text-gray-400 mt-1">Histórico de vendas realizadas no PDV</p>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-6">{error}</div>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead>
            <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Desconto</TableHead>
            <TableHead className="text-right">Total Final</TableHead><TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 && (
            <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400">Nenhuma venda encontrada</td></tr>
          )}
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium text-gray-900 dark:text-white">{sale.id}</TableCell>
              <TableCell>{fmtDate(sale.createdAt)}</TableCell>
              <TableCell>{sale.client?.name ?? '-'}</TableCell>
              <TableCell className="text-right">{fmt(sale.total)}</TableCell>
              <TableCell className="text-right">{sale.discount}%</TableCell>
              <TableCell className="text-right font-medium">{fmt(sale.finalTotal)}</TableCell>
              <TableCell className="text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sale.status === 'completed' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  sale.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                }`}>
                  {sale.status === 'completed' ? 'Concluída' : sale.status === 'cancelled' ? 'Cancelada' : sale.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
