import { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Package, Truck, Landmark } from 'lucide-react';
import { reports } from '../services/api';

const TABS = [
  { key: 'sales', label: 'Vendas', icon: DollarSign },
  { key: 'cash', label: 'Caixa', icon: Landmark },
  { key: 'products', label: 'Produtos', icon: Package },
  { key: 'suppliers', label: 'Fornecedores', icon: Truck },
];
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const [salesData, setSalesData] = useState<any>(null);
  const [cashData, setCashData] = useState<any>(null);
  const [productsData, setProductsData] = useState<any>(null);
  const [suppliersData, setSuppliersData] = useState<any>(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const start = new Date(); start.setDate(start.getDate() - period);
    const startStr = start.toISOString().split('T')[0];
    const endStr = new Date().toISOString().split('T')[0];

    if (tab === 'sales') reports.sales(startStr, endStr).then((r) => setSalesData(r.data)).catch(() => {}).finally(() => setLoading(false));
    else if (tab === 'cash') reports.cashRegisters(startStr, endStr).then((r) => setCashData(r.data)).catch(() => {}).finally(() => setLoading(false));
    else if (tab === 'products') reports.products().then((r) => setProductsData(r.data)).catch(() => {}).finally(() => setLoading(false));
    else if (tab === 'suppliers') reports.suppliers().then((r) => setSuppliersData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [tab, period]);

  const cardCls = 'bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700';

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Relatórios</h2>
        <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
          <option value={365}>Último ano</option>
        </select>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {loading && <p className="text-gray-400 py-8">Carregando...</p>}

      {!loading && tab === 'sales' && salesData && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Vendas', value: salesData.totalSales },
              { label: 'Receita', value: fmt(salesData.totalRevenue) },
              { label: 'Canceladas', value: salesData.totalCancelled },
              { label: 'Ticket Médio', value: fmt(salesData.averageTicket) },
            ].map((c) => (
              <div key={c.label} className={cardCls}>
                <div className="text-sm text-gray-400">{c.label}</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{c.value}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className={cardCls}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Vendas por Dia</h3>
              {salesData.byDay?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={salesData.byDay.map((d: any) => ({ ...d, date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 py-8 text-center">Sem dados</p>}
            </div>
            <div className={cardCls}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Por Forma de Pagamento</h3>
              {salesData.byPaymentMethod?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={salesData.byPaymentMethod} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={80} label={({ method, percent }: any) => `${method} ${(percent * 100).toFixed(0)}%`}>
                      {salesData.byPaymentMethod.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 py-8 text-center">Sem dados</p>}
            </div>
          </div>
          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Detalhamento</h3>
            <Table>
              <TableHeader>
                <TableRow><TableHead>ID</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead>Pagamento</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-center">Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {salesData.sales?.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-gray-800 dark:text-white">#{s.id}</TableCell>
                    <TableCell>{new Date(s.createdAt).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{s.clientName || 'Avulsa'}</TableCell>
                    <TableCell>{s.paymentMethod}</TableCell>
                    <TableCell className="text-right">{fmt(s.finalTotal)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'Cancelada' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                        {s.status === 'Cancelada' ? 'Cancelada' : 'Concluída'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!loading && tab === 'cash' && cashData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={cardCls}><div className="text-sm text-gray-400">Aberturas</div><div className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{cashData.totalOpened}</div></div>
            <div className={cardCls}><div className="text-sm text-gray-400">Fechamentos</div><div className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{cashData.totalClosed}</div></div>
          </div>
          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Histórico de Caixa</h3>
            <Table>
              <TableHeader>
                <TableRow><TableHead>ID</TableHead><TableHead>Abertura</TableHead><TableHead>Fechamento</TableHead><TableHead className="text-right">Saldo Abertura</TableHead><TableHead className="text-right">Saldo Fechamento</TableHead><TableHead className="text-center">Vendas</TableHead><TableHead className="text-right">Total Vendas</TableHead><TableHead className="text-center">Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {cashData.registers?.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-gray-800 dark:text-white">#{r.id}</TableCell>
                    <TableCell>{new Date(r.openedAt).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{r.closedAt ? new Date(r.closedAt).toLocaleString('pt-BR') : '-'}</TableCell>
                    <TableCell className="text-right">{fmt(r.openingBalance)}</TableCell>
                    <TableCell className="text-right">{r.closingBalance != null ? fmt(r.closingBalance) : '-'}</TableCell>
                    <TableCell className="text-center">{r.salesCount}</TableCell>
                    <TableCell className="text-right">{fmt(r.salesTotal)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'Aberto' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                        {r.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!loading && tab === 'products' && productsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className={cardCls}><div className="text-sm text-gray-400">Total Produtos</div><div className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{productsData.totalProducts}</div></div>
            <div className={cardCls}><div className="text-sm text-gray-400">Ativos</div><div className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{productsData.activeProducts}</div></div>
            <div className={cardCls}><div className="text-sm text-gray-400">Estoque Baixo</div><div className="text-2xl font-bold text-red-600 mt-1">{productsData.lowStockCount}</div></div>
          </div>
          {productsData.topSold?.length > 0 && (
            <div className={cardCls}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Mais Vendidos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productsData.topSold} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Bar dataKey="totalQty" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {productsData.lowStock?.length > 0 && (
            <div className={cardCls}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Estoque Baixo</h3>
              <Table>
                <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Estoque Atual</TableHead><TableHead>Estoque Mínimo</TableHead></TableRow></TableHeader>
                <TableBody>
                  {productsData.lowStock.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-gray-800 dark:text-white">{p.name}</TableCell>
                      <TableCell><span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium">{p.currentStock}</span></TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">{p.minStock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'suppliers' && suppliersData && (
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Fornecedores e Produtos</h3>
          {suppliersData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Nenhum fornecedor com produtos vinculados</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Fornecedor</TableHead><TableHead>CNPJ</TableHead><TableHead>Contato</TableHead><TableHead className="text-center">Produtos</TableHead></TableRow></TableHeader>
              <TableBody>
                {suppliersData.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-gray-800 dark:text-white">{s.companyName}</TableCell>
                    <TableCell>{s.cnpj}</TableCell>
                    <TableCell>{s.email || s.phone || '-'}</TableCell>
                    <TableCell className="text-center">{s.productCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
