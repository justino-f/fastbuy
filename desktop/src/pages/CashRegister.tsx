// CashRegister.tsx — Página de gerenciamento do caixa registradora
// Responsável por: abrir/fechar caixa, exibir cupons cancelados (Stack) e histórico de caixas
// O caixa deve estar aberto para que vendas possam ser realizadas no PDV — regra de negócio central

import { useState, useEffect } from 'react';
import { CashRegister as CashRegisterType } from '../types';
import { getCashRegisters, openCashRegister, closeCashRegister, getStack, getCashRegisterHistory } from '../services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Lock, Unlock, RefreshCw, Ban, History } from 'lucide-react';
import { fmt, fmtDate } from '@/lib/utils';

export default function CashRegister() {
  // Estado do caixa atual (null = nenhum caixa aberto)
  const [currentRegister, setCurrentRegister] = useState<CashRegisterType | null>(null);
  // Valor de abertura digitado pelo operador (fundo de troco)
  const [openingBalance, setOpeningBalance] = useState('');
  // Flag de carregamento — exibe "Carregando..." enquanto busca dados
  const [loading, setLoading] = useState(true);
  // Mensagem de erro — exibida em banner vermelho
  const [error, setError] = useState('');
  // Pilha (Stack — LIFO) de cupons cancelados — estrutura de dados acadêmica
  // O último cancelamento fica no topo da pilha
  const [cancelledCoupons, setCancelledCoupons] = useState<any[]>([]);
  // Tamanho da pilha de cancelamentos — exibido no badge
  const [cancelledCount, setCancelledCount] = useState(0);
  // Histórico de caixas anteriores (últimos 10)
  const [history, setHistory] = useState<any[]>([]);

  // Efeito de inicialização — carrega caixa atual, cancelamentos e histórico em paralelo
  useEffect(() => { loadRegister(); loadCancelledCoupons(); loadHistory(); }, []);

  // Carrega o caixa atualmente aberto (ou null se fechado)
  async function loadRegister() {
    setLoading(true);
    try {
      const data = await getCashRegisters();
      // Pega o primeiro (e único) caixa retornado — sistema opera com um caixa por vez
      setCurrentRegister(data.length > 0 ? data[0] : null);
    } catch {
      setCurrentRegister(null);
    } finally {
      setLoading(false);
    }
  }

  // Carrega a pilha de cupons cancelados do backend (Stack — LIFO)
  // Cada cancelamento é empilhado — o mais recente aparece primeiro
  async function loadCancelledCoupons() {
    try { const data = await getStack(); setCancelledCoupons(data.stack || []); setCancelledCount(data.size || 0); } catch {}
  }

  // Carrega histórico de caixas — limitado aos 10 registros mais recentes
  async function loadHistory() {
    try { const data = await getCashRegisterHistory(); setHistory(data.slice(0, 10)); } catch {}
  }

  // Abre um novo caixa com o saldo de abertura informado
  // Valida que o valor é numérico e não negativo antes de enviar
  async function handleOpen() {
    const value = parseFloat(openingBalance);
    if (isNaN(value) || value < 0) return;
    setError('');
    try { await openCashRegister(value); setOpeningBalance(''); await loadRegister(); } catch { setError('Erro ao abrir caixa.'); }
  }

  // Fecha o caixa atual — o backend calcula o saldo de fechamento automaticamente
  // Após fechar, o PDV bloqueia novas vendas até que um novo caixa seja aberto
  async function handleClose() {
    if (!currentRegister) return;
    setError('');
    try { await closeCashRegister(currentRegister.id); await loadRegister(); } catch { setError('Erro ao fechar caixa.'); }
  }

  // Tela de carregamento
  if (loading) return <p className="text-gray-400 p-6">Carregando...</p>;

  return (
    <div>
      {/* Cabeçalho da página */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciamento de Caixa</h2>
        <p className="text-sm text-gray-400 mt-1">Controle de abertura e fechamento do caixa</p>
      </div>

      {/* Banner de erro — exibido quando operação de abrir/fechar falha */}
      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-6">{error}</div>}

      {/* === CARD DO CAIXA ATUAL === */}
      {/* Exibe estado do caixa: aberto (com botão fechar) ou fechado (com formulário abrir) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        {currentRegister && currentRegister.status === 'Aberto' ? (
          // === CAIXA ABERTO: exibe informações e botão de fechamento ===
          <>
            <div className="flex items-center gap-3 mb-4">
              {/* Ícone de cadeado aberto — indica caixa em operação */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50 dark:bg-green-900/30">
                <Unlock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">Caixa Aberto</h3>
                {/* Data/hora de abertura formatada em pt-BR */}
                <p className="text-xs text-gray-400">Aberto em {fmtDate(currentRegister.openedAt)}</p>
              </div>
              {/* Saldo de abertura — fundo de troco informado na abertura */}
              <span className="ml-auto text-lg font-bold text-gray-800 dark:text-white">{fmt(currentRegister.openingBalance)}</span>
            </div>
            {/* Botão de fechar caixa — ação irreversível, backend calcula saldo final */}
            <button onClick={handleClose} className="w-full py-3 bg-red-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" /> Fechar Caixa
            </button>
          </>
        ) : (
          // === NENHUM CAIXA ABERTO: formulário para abrir novo caixa ===
          <>
            <div className="flex items-center gap-3 mb-4">
              {/* Ícone de cadeado fechado — indica que não há caixa ativo */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">Nenhum Caixa Aberto</h3>
            </div>
            <div className="flex gap-2">
              {/* Input do saldo de abertura (fundo de troco) */}
              <input
                type="number" step="0.01" placeholder="Saldo de abertura" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-4 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {/* Botão de abrir caixa — habilita vendas no PDV */}
              <button onClick={handleOpen} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-green-700 transition-colors flex items-center gap-2">
                <Unlock className="h-4 w-4" /> Abrir Caixa
              </button>
            </div>
          </>
        )}
      </div>

      {/* === CARD DE CUPONS CANCELADOS (Stack — LIFO) === */}
      {/* Exibe a pilha de cancelamentos — estrutura de dados acadêmica */}
      {/* O último cancelamento aparece primeiro (Last In, First Out) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-3 mb-4">
          {/* Ícone de proibido — indica cancelamentos */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-900/30">
            <Ban className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Cupons Cancelados</h3>
          {/* Badge com contagem total de cancelamentos */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400">{cancelledCount}</span>
          {/* Botão de atualizar — recarrega a pilha do backend */}
          <button onClick={loadCancelledCoupons} className="ml-auto p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        {cancelledCoupons.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum cupom cancelado registrado.</p>
        ) : (
          // Tabela de cancelamentos com scroll — colunas: ID, total, motivo, data
          <div className="max-h-48 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>ID Venda</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Motivo</TableHead><TableHead>Data</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {cancelledCoupons.map((coupon, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">{coupon.saleId || coupon.id || '-'}</TableCell>
                    <TableCell className="text-right">{coupon.total != null ? fmt(coupon.total) : '-'}</TableCell>
                    <TableCell>{coupon.reason || '-'}</TableCell>
                    <TableCell>{coupon.cancelledAt ? fmtDate(coupon.cancelledAt) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* === CARD DE HISTÓRICO DE CAIXAS === */}
      {/* Exibe os últimos 10 registros de abertura/fechamento de caixa */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30">
            <History className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Histórico</h3>
          {/* Botão de atualizar histórico */}
          <button onClick={loadHistory} className="ml-auto p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum registro encontrado.</p>
        ) : (
          // Tabela de histórico: ID, data abertura, data fechamento, saldo abertura, saldo fechamento, status
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead>Fechamento</TableHead>
                  <TableHead className="text-right">Saldo Abertura</TableHead>
                  <TableHead className="text-right">Saldo Fechamento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">{reg.id}</TableCell>
                    <TableCell>{reg.openedAt ? fmtDate(reg.openedAt) : '-'}</TableCell>
                    <TableCell>{reg.closedAt ? fmtDate(reg.closedAt) : '-'}</TableCell>
                    <TableCell className="text-right">{reg.openingBalance != null ? fmt(reg.openingBalance) : '-'}</TableCell>
                    <TableCell className="text-right">{reg.closingBalance != null ? fmt(reg.closingBalance) : '-'}</TableCell>
                    <TableCell>
                      {/* Badge de status: verde (Aberto) ou cinza (Fechado) */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        reg.status === 'Aberto' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {reg.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
