import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, AlertTriangle, Bell } from 'lucide-react';
import { DashboardData, Client } from '../types';
import { dashboard, dataStructures } from '../services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

// Dashboard — página principal do sistema, exibe KPIs e visualizações em tempo real
// Apresenta: cards de métricas, gráficos de vendas e fila de atendimento (estrutura FIFO)
export default function Dashboard() {
  // Estado dos dados agregados do dashboard (KPIs + dados dos gráficos)
  const [data, setData] = useState<DashboardData | null>(null);
  // Estado da fila de atendimento — estrutura de dados FIFO (First In, First Out)
  const [queue, setQueue] = useState<Client[]>([]);

  // useEffect com array vazio [] — executa apenas na montagem do componente
  // Carrega dados do dashboard e fila de atendimento em paralelo
  useEffect(() => {
    dashboard.get().then((res) => setData(res.data)).catch(() => {});
    dataStructures.getQueue().then((res) => {
      setQueue(res.data.clients || []);
    }).catch(() => {});
  }, []);

  // Loading state — exibe mensagem enquanto dados não carregaram
  if (!data) return <p className="text-gray-500 dark:text-gray-400 p-6">Carregando...</p>;

  return (
    <div>
      {/* Cabeçalho da página */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-1">Visão geral do seu negócio em tempo real</p>
      </div>

      {/* Grid de cards KPI — 4 colunas com métricas principais do dia */}
      {/* Padrão: array de objetos renderizado via .map() para evitar repetição de JSX */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total de Vendas Hoje', value: `R$ ${data.totalSoldToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'green', detail: data.totalSoldToday === 0 ? 'Sem vendas hoje' : 'Ver detalhes', link: '/reports' },
          { label: 'Produtos Vendidos', value: data.productsSoldToday, icon: ShoppingCart, color: 'blue', detail: 'Ver produtos', link: '/products' },
          { label: 'Produtos em Falta', value: data.outOfStockCount, icon: AlertTriangle, color: 'orange', detail: 'Ver estoque', link: '/products' },
          { label: 'Clientes Atendidos', value: data.clientsServedToday, icon: Bell, color: 'red', detail: 'Ver detalhes', link: '/clients' },
        ].map((card) => {
          const Icon = card.icon;
          // Mapas de cores para fundo e texto — resolvem classes Tailwind por nome de cor
          const bgMap: Record<string, string> = { green: 'bg-green-50 dark:bg-green-900/30', blue: 'bg-blue-50 dark:bg-blue-900/30', orange: 'bg-orange-50 dark:bg-orange-900/30', red: 'bg-red-50 dark:bg-red-900/30' };
          const txtMap: Record<string, string> = { green: 'text-green-500', blue: 'text-blue-500', orange: 'text-orange-500', red: 'text-red-500' };
          return (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              {/* Ícone com fundo colorido — identifica visualmente cada KPI */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgMap[card.color]}`}>
                <Icon className={`w-6 h-6 ${txtMap[card.color]}`} />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-gray-800 dark:text-white">{card.value}</div>
                <div className="text-sm text-gray-400 mt-1">{card.label}</div>
              </div>
              {/* Link de navegação para a página detalhada correspondente */}
              <div className="mt-3">
                <Link to={card.link} className="text-xs text-indigo-500 hover:text-indigo-700 cursor-pointer">{card.detail}</Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráficos de barras — Recharts com ResponsiveContainer para responsividade */}
      {/* Dois gráficos lado a lado: vendas por hora e produtos mais vendidos */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {[
          { title: 'Vendas por Hora', sub: 'Distribuição de vendas ao longo do dia', data: data.salesByHour, dataKey: 'total', xKey: 'hour' },
          { title: 'Produtos Mais Vendidos', sub: 'Ranking dos produtos com maior saída', data: data.topProducts, dataKey: 'quantity', xKey: 'name' },
        ].map((chart) => (
          <div key={chart.title} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1">{chart.title}</h3>
            <p className="text-xs text-gray-400 mb-4">{chart.sub}</p>
            {/* Renderização condicional: gráfico só aparece se houver dados */}
            {chart.data && chart.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey={chart.xKey} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip />
                  {/* Barras com cantos arredondados no topo e cor indigo (paleta do sistema) */}
                  <Bar dataKey={chart.dataKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48">
                <span className="text-sm text-gray-400">Nenhum dado disponível</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fila de Atendimento — visualização da estrutura de dados FIFO */}
      {/* Estrutura acadêmica: Fila — o primeiro cliente a entrar é o primeiro a ser atendido */}
      {/* Operações: enqueue (adicionar à fila) e dequeue (atender/remover da fila) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Fila de Atendimento</h3>
        </div>
        {queue.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Posição</TableHead><TableHead>Cliente</TableHead><TableHead>Prioridade</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {/* Cada cliente na fila — posição = index + 1 (base 1 para exibição) */}
              {queue.map((client, index) => (
                <TableRow key={client.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{client.name}</TableCell>
                  <TableCell><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Normal</span></TableCell>
                  <TableCell><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Aguardando</span></TableCell>
                  <TableCell>
                    {/* Botão "Atender" — executa dequeue (remove o primeiro da fila) e recarrega */}
                    <button className="text-xs text-indigo-500 hover:text-indigo-700" onClick={() => dataStructures.dequeueClient().then(() => dataStructures.getQueue().then((res) => setQueue(res.data.clients || [])).catch(() => {})).catch(() => {})}>
                      Atender
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-gray-400">Nenhum cliente na fila</span>
          </div>
        )}
      </div>
    </div>
  );
}
