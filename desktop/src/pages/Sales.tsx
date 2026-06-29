// Sales.tsx — Página de histórico de vendas realizadas no PDV
// Exibe tabela com todas as vendas, incluindo status (concluída, cancelada, pendente)
// Componente simples de leitura — sem operações de escrita, apenas consulta à API

import { useState, useEffect } from 'react';
import { Sale } from '../types';
import { getSales } from '../services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { fmt, fmtDate } from '@/lib/utils';

export default function Sales() {
  // Lista de vendas carregadas da API
  const [sales, setSales] = useState<Sale[]>([]);
  // Flag de carregamento — exibe "Carregando..." enquanto busca dados
  const [loading, setLoading] = useState(true);
  // Mensagem de erro — exibida em banner vermelho
  const [error, setError] = useState('');

  // Efeito de inicialização — carrega vendas ao montar o componente
  useEffect(() => { loadSales(); }, []);

  // Busca todas as vendas da API — sem paginação (carrega tudo)
  async function loadSales() {
    setLoading(true);
    try { const data = await getSales(); setSales(data); } catch { setError('Erro ao carregar vendas.'); } finally { setLoading(false); }
  }

  // Tela de carregamento
  if (loading) return <p className="text-gray-400 p-6">Carregando...</p>;

  return (
    <div>
      {/* Cabeçalho da página */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Vendas</h2>
        <p className="text-sm text-gray-400 mt-1">Histórico de vendas realizadas no PDV</p>
      </div>

      {/* Banner de erro — exibido quando a busca de vendas falha */}
      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-6">{error}</div>}

      {/* Tabela de vendas — colunas: ID, data, cliente, total, desconto, total final, status */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead>
            <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Desconto</TableHead>
            <TableHead className="text-right">Total Final</TableHead><TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Mensagem de tabela vazia */}
          {sales.length === 0 && (
            <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400">Nenhuma venda encontrada</td></tr>
          )}
          {/* Renderiza cada venda como uma linha da tabela */}
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium text-gray-900 dark:text-white">{sale.id}</TableCell>
              {/* Data formatada em pt-BR usando utilitário compartilhado */}
              <TableCell>{fmtDate(sale.createdAt)}</TableCell>
              {/* Nome do cliente ou "-" para vendas avulsas (sem cliente identificado) */}
              <TableCell>{sale.client?.name ?? '-'}</TableCell>
              {/* Total bruto formatado como moeda BRL */}
              <TableCell className="text-right">{fmt(sale.total)}</TableCell>
              {/* Desconto exibido como percentual */}
              <TableCell className="text-right">{sale.discount}%</TableCell>
              {/* Total final (após desconto) formatado como moeda BRL */}
              <TableCell className="text-right font-medium">{fmt(sale.finalTotal)}</TableCell>
              <TableCell className="text-center">
                {/* Badge de status com cores semânticas:
                    - Verde: venda concluída (completed)
                    - Vermelho: venda cancelada (cancelled)
                    - Laranja: outros status (pendente, em processamento) */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sale.status === 'completed' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  sale.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                }`}>
                  {/* Traduz status do backend (inglês) para label em português */}
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
