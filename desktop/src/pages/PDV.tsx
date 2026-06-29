// PDV.tsx — Ponto de Venda (Point of Sale) — tela principal do sistema desktop
// Esta é a interface mais crítica do FastBuy: onde o operador de caixa realiza vendas
// Arquitetura: componente único com estado local (useState) — sem Redux/Zustand por simplicidade
// Suporte offline: busca de produtos e registro de vendas funcionam sem conexão com o servidor
// Estruturas de dados acadêmicas: Fila (Queue/FIFO) de clientes e Pilha (Stack/LIFO) de cancelamentos

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Product, Client, Sale } from '../types';
import { createSale, getSales, cancelSale, getQueue, enqueueClient, dequeueClient, getStack, getProductsSorted, getProductByBarcode, getCurrentCashRegister } from '../services/api';
import { getProductByBarcode as getCachedProductByBarcode, savePendingSale, isOnline as checkOnline } from '../services/offlineStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Search, Plus, Minus, X, Users, Ban, ArrowDownAZ, Wifi, WifiOff, UserPlus, UserCheck, Landmark, Receipt, XCircle } from 'lucide-react';
import { fmt } from '@/lib/utils';

// Interface local para item do carrinho — associa um produto a sua quantidade
// Não faz parte das types globais pois é exclusiva da lógica do PDV
interface CartItem {
  product: Product;  // referência ao produto completo (preço, nome, barcode)
  quantity: number;  // quantidade selecionada pelo operador
}

// Mapeamento de forma de pagamento: label amigável (UI) → valor do backend (API)
// O PDV exibe "Cartão Crédito" mas a API espera "Credito"
// Centralizado como constante para facilitar manutenção e evitar strings mágicas
const PAYMENT_MAP: Record<string, string> = {
  'Dinheiro': 'Dinheiro',
  'Cartão Crédito': 'Credito',
  'Cartão Débito': 'Debito',
  'PIX': 'PIX',
};

export default function PDV() {
  // === Estado do carrinho e venda ===
  const [barcode, setBarcode] = useState('');                          // código de barras digitado/escaneado
  const [cart, setCart] = useState<CartItem[]>([]);                     // itens no carrinho da venda atual
  const [discount, setDiscount] = useState(0);                         // desconto em reais aplicado à venda
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');      // forma de pagamento selecionada
  const [amountReceived, setAmountReceived] = useState('');            // valor recebido do cliente (só dinheiro)

  // === Estado de conectividade ===
  const [online, setOnline] = useState(true);                         // indica se o servidor está acessível

  // === Estado de feedback ao operador ===
  const [message, setMessage] = useState('');                          // mensagem de sucesso/erro exibida na top bar
  const [messageType, setMessageType] = useState<'success' | 'error'>('success'); // tipo da mensagem (cor)

  // Ref do input de barcode — usado para manter foco automático após cada operação
  const barcodeRef = useRef<HTMLInputElement>(null);

  // === Estado da Fila de Atendimento (Queue — FIFO) ===
  const [queueList, setQueueList] = useState<Client[]>([]);            // lista de clientes na fila
  const [queueSize, setQueueSize] = useState(0);                       // tamanho da fila
  const [newClient, setNewClient] = useState('');                      // ID do cliente a adicionar na fila

  // === Estado da Pilha de Cancelamentos (Stack — LIFO) ===
  const [cancelledCount, setCancelledCount] = useState(0);             // total de cupons cancelados

  // === Estado de ordenação de produtos (algoritmos acadêmicos) ===
  const [sortBy, setSortBy] = useState('');                            // campo de ordenação ativo (name, salePrice, currentStock)
  const [productList, setProductList] = useState<Product[]>([]);       // lista de produtos ordenados para exibição
  const [showProducts, setShowProducts] = useState(false);             // flag: mostra/oculta tabela de produtos ordenados

  // === Estado do caixa ===
  const [cashRegisterId, setCashRegisterId] = useState<number | null>(null);   // ID do caixa aberto (null = fechado)
  const [currentClient, setCurrentClient] = useState<Client | null>(null);     // cliente sendo atendido (retirado da fila)
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);           // ID da última venda — para exibir próximo número
  const [cashRegisterOpen, setCashRegisterOpen] = useState(false);             // flag: caixa está aberto?

  // === Estado de cupons/vendas recentes ===
  const [recentSales, setRecentSales] = useState<Sale[]>([]);                  // últimas 20 vendas para aba de cupons
  const [cancelReason, setCancelReason] = useState('');                        // motivo do cancelamento sendo digitado
  const [cancellingId, setCancellingId] = useState<number | null>(null);       // ID da venda em processo de cancelamento
  const [rightTab, setRightTab] = useState<'sale' | 'coupons'>('sale');        // aba ativa do painel direito

  // === Efeito de inicialização — roda uma vez ao montar o componente ===
  useEffect(() => {
    barcodeRef.current?.focus(); // foco automático no input de barcode ao abrir o PDV

    // Verifica conectividade a cada 10 segundos — atualiza indicador online/offline
    // Intervalo de 10s é um bom equilíbrio entre responsividade e consumo de rede
    const interval = setInterval(async () => { setOnline(await checkOnline()); }, 10000);

    // Verificação inicial imediata de conectividade
    checkOnline().then(setOnline);

    // Carrega dados iniciais em paralelo: fila, cancelamentos, caixa, vendas recentes
    loadQueue();
    loadCancelledCount();
    loadCashRegister();
    loadRecentSales();

    // Cleanup: limpa o intervalo ao desmontar o componente para evitar memory leak
    return () => clearInterval(interval);
  }, []);

  // Carrega o estado do caixa atual — verifica se há caixa aberto
  // Se não houver caixa aberto, o PDV exibe tela de bloqueio impedindo vendas
  async function loadCashRegister() {
    const reg = await getCurrentCashRegister();
    setCashRegisterId(reg?.id ?? null);
    setCashRegisterOpen(!!reg); // converte para boolean: caixa existe = aberto
  }

  // === Valores derivados (calculados a cada render, sem estado próprio) ===
  // Total bruto: soma de (preço unitário * quantidade) de todos os itens do carrinho
  const total = cart.reduce((s, i) => s + i.product.salePrice * i.quantity, 0);
  // Total final: total bruto menos desconto aplicado
  const finalTotal = total - discount;
  // Troco: só calculado para pagamento em dinheiro — valor recebido menos total final
  const change = paymentMethod === 'Dinheiro' && amountReceived ? parseFloat(amountReceived) - finalTotal : 0;

  // === Fila de Atendimento (Queue — FIFO) ===

  // Carrega a fila de clientes do backend
  async function loadQueue() {
    try {
      const data = await getQueue();
      setQueueList(data.clients || []);
      setQueueSize(data.count || 0);
    } catch {} // silencia erro — fila vazia é tratada como estado válido
  }

  // Enqueue: adiciona cliente ao final da fila (operação FIFO — First In, First Out)
  // O primeiro cliente a entrar será o primeiro a ser atendido
  async function handleEnqueue() {
    const val = newClient.trim();
    if (!val) return;
    const id = parseInt(val);
    // Validação: aceita apenas ID numérico do cliente cadastrado
    if (isNaN(id)) { showMsg('Informe o ID numérico do cliente.', 'error'); return; }
    try {
      await enqueueClient(id);    // POST para o backend — adiciona ao final da fila
      setNewClient('');            // limpa input
      await loadQueue();           // recarrega fila para refletir a adição
      showMsg('Cliente adicionado à fila.', 'success');
    } catch {
      showMsg('Erro ao adicionar cliente à fila.', 'error');
    }
  }

  // Dequeue: remove o primeiro cliente da fila para atendimento (operação FIFO)
  // O cliente removido é definido como currentClient — vinculado à próxima venda
  async function handleDequeue() {
    try {
      const result = await dequeueClient();  // POST para o backend — remove do início da fila
      await loadQueue();                      // recarrega fila para refletir a remoção
      // Se o backend retornou dados do cliente, define-o como "em atendimento"
      if (result && result.id && result.name) {
        setCurrentClient(result as Client);
        showMsg(`Atendendo: ${result.name}`, 'success');
      } else {
        setCurrentClient(null);
        showMsg('Próximo cliente chamado.', 'success');
      }
    } catch {
      showMsg('Fila vazia.', 'error');
    }
  }

  // Carrega vendas recentes para exibição na aba de cupons (limitado a 20)
  async function loadRecentSales() {
    try { const data = await getSales(); setRecentSales(data.slice(0, 20)); } catch {}
  }

  // Cancela uma venda existente — empilha na Stack (LIFO) de cancelamentos
  // Requer ID da venda e motivo obrigatório (auditoria)
  async function handleCancelSale() {
    if (!cancellingId || !cancelReason.trim()) return;
    try {
      await cancelSale(cancellingId, cancelReason.trim()); // PUT para o backend
      showMsg(`Cupom #${cancellingId} cancelado.`, 'success');
      setCancellingId(null);        // fecha o formulário de cancelamento
      setCancelReason('');          // limpa o motivo
      await loadRecentSales();      // recarrega lista de vendas
      await loadCancelledCount();   // atualiza contador de cancelamentos
    } catch {
      showMsg('Erro ao cancelar cupom.', 'error');
    }
  }

  // Carrega o tamanho da pilha de cancelamentos — exibido no badge da top bar
  async function loadCancelledCount() {
    try { const data = await getStack(); setCancelledCount(data.size || 0); } catch {}
  }

  // Ordena produtos pelo campo selecionado (nome, preço, estoque)
  // O backend executa o algoritmo de ordenação (QuickSort por padrão) — conceito acadêmico
  async function handleSortProducts(field: string) {
    setSortBy(field);
    try { const data = await getProductsSorted(field); setProductList(data); setShowProducts(true); } catch { showMsg('Erro ao ordenar produtos.', 'error'); }
  }

  // Adiciona produto ao carrinho a partir da lista de produtos ordenados
  // Se o produto já está no carrinho, incrementa a quantidade em 1
  function addProductFromList(product: Product) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      // Produto já no carrinho → incrementa quantidade (evita duplicação)
      if (idx >= 0) { const u = [...prev]; u[idx] = { ...u[idx], quantity: u[idx].quantity + 1 }; return u; }
      // Produto novo → adiciona com quantidade 1
      return [...prev, { product, quantity: 1 }];
    });
    showMsg(`${product.name} adicionado.`, 'success');
  }

  // === Busca de produto por código de barras ===
  // Estratégia de fallback: online → tenta API primeiro → se falhar, busca no cache
  //                         offline → busca direto no cache local (localStorage)
  async function searchProduct(e: FormEvent) {
    e.preventDefault(); // previne submit do formulário (reload da página)
    if (!barcode.trim()) return;
    let product: Product | null = null;

    if (online) {
      try {
        // Tenta buscar via API — resposta mais atualizada
        product = await getProductByBarcode(barcode.trim());
      } catch {
        // Fallback: se API falhar, busca no cache offline
        product = getCachedProductByBarcode(barcode.trim());
      }
    } else {
      // Modo offline: busca exclusivamente no cache local
      product = getCachedProductByBarcode(barcode.trim());
    }

    // Produto não encontrado em nenhuma fonte
    if (!product) { showMsg('Produto não encontrado.', 'error'); setBarcode(''); return; }

    // Adiciona ao carrinho (mesmo padrão: incrementa se já existe)
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product!.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = { ...u[idx], quantity: u[idx].quantity + 1 }; return u; }
      return [...prev, { product: product!, quantity: 1 }];
    });
    setBarcode('');                  // limpa input
    barcodeRef.current?.focus();     // retorna foco ao input para próxima leitura
  }

  // Altera quantidade de um item no carrinho (delta: +1 ou -1)
  // Se quantidade chegar a zero ou menos, remove o item automaticamente
  function changeQty(idx: number, delta: number) {
    setCart((prev) => { const u = [...prev]; const n = u[idx].quantity + delta; if (n <= 0) return u.filter((_, i) => i !== idx); u[idx] = { ...u[idx], quantity: n }; return u; });
  }

  // Remove um item do carrinho pelo índice
  function removeItem(idx: number) { setCart((prev) => prev.filter((_, i) => i !== idx)); }

  // Exibe mensagem temporária na top bar (desaparece após 4 segundos)
  function showMsg(msg: string, type: 'success' | 'error') { setMessage(msg); setMessageType(type); setTimeout(() => setMessage(''), 4000); }

  // === Finalização da Venda ===
  // Monta o payload, envia para API, e trata fallback offline
  async function finalizeSale() {
    // Validação: carrinho não pode estar vazio
    if (cart.length === 0) return;
    // Validação: caixa precisa estar aberto — regra de negócio
    if (!cashRegisterId) {
      showMsg('Abra o caixa antes de finalizar a venda.', 'error');
      return;
    }

    // Converte label do método de pagamento para o valor esperado pelo backend
    const backendMethod = PAYMENT_MAP[paymentMethod] || paymentMethod;
    // Para dinheiro: usa valor digitado; para outros métodos: valor = total final
    const paid = paymentMethod === 'Dinheiro' ? parseFloat(amountReceived) || finalTotal : finalTotal;

    // Monta payload da venda — estrutura esperada pelo endpoint POST /sales
    const saleData = {
      cashRegisterId,                                                         // FK do caixa aberto
      clientId: currentClient?.id || undefined,                               // FK do cliente (opcional)
      items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),  // itens simplificados
      discount,                                                               // desconto em reais
      paymentMethod: backendMethod,                                           // método de pagamento
      amountPaid: paid,                                                       // valor pago pelo cliente
    };

    try {
      // Tenta enviar para a API — se sucesso, venda é registrada no banco de dados
      const sale = await createSale(saleData);
      setLastSaleId(sale.id);
      showMsg(`Venda #${sale.id} finalizada com sucesso!`, 'success');
      setCurrentClient(null); // limpa cliente em atendimento
    } catch {
      // Fallback offline: salva venda no localStorage para sincronização futura
      // A venda será reenviada quando a conexão for restabelecida
      savePendingSale(saleData);
      showMsg('Venda salva offline. Será sincronizada quando houver conexão.', 'error');
    }

    // Reseta estado do carrinho e formulário para a próxima venda
    setCart([]); setDiscount(0); setPaymentMethod('Dinheiro'); setAmountReceived(''); barcodeRef.current?.focus();
    loadRecentSales(); // atualiza lista de cupons
  }

  // === RENDERIZAÇÃO DA INTERFACE ===
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">

      {/* === TOP BAR: indicadores de status (online/offline, caixa, mensagens, fila, cancelamentos) === */}
      <div className="flex justify-between items-center px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        {/* Lado esquerdo: status de conexão + estado do caixa + mensagem de feedback */}
        <div className="flex items-center gap-3">
          {/* Ícone de conectividade: verde (online) ou vermelho (offline) */}
          {online ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
          <span className="text-sm text-gray-500 dark:text-gray-400">{online ? 'Online' : 'Offline'}</span>
          {/* Alerta visual quando o caixa está fechado */}
          {!cashRegisterId && <span className="ml-2 px-3 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Caixa fechado</span>}
          {/* Mensagem temporária de feedback (sucesso verde / erro vermelho) */}
          {message && (
            <span className={`ml-3 px-3 py-1 rounded-lg text-xs font-medium ${messageType === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
              {message}
            </span>
          )}
        </div>
        {/* Lado direito: badges da fila de clientes e contador de cancelamentos */}
        <div className="flex items-center gap-4">
          {/* Badge da Fila (Queue — FIFO): mostra quantos clientes aguardam */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
            <Users className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Fila: {queueSize}</span>
          </div>
          {/* Badge da Pilha (Stack — LIFO): mostra total de cancelamentos */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${cancelledCount > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
            <Ban className="h-4 w-4" style={{ color: cancelledCount > 0 ? '#ef4444' : '#9ca3af' }} />
            <span className={`text-xs font-semibold ${cancelledCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>Cancelamentos: {cancelledCount}</span>
          </div>
        </div>
      </div>

      {/* === BARRA DE INFORMAÇÃO DA VENDA: número da venda e cliente em atendimento === */}
      <div className="flex items-center gap-4 px-6 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-sm">
        {/* Número estimado da próxima venda (último ID + 1) */}
        <span className="text-gray-500 dark:text-gray-400">
          Venda: <span className="font-semibold text-gray-800 dark:text-white">#{lastSaleId ? lastSaleId + 1 : 1}</span>
        </span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        {/* Nome do cliente sendo atendido (retirado da fila) ou "Venda avulsa" */}
        <span className="text-gray-500 dark:text-gray-400">
          Cliente: <span className="font-semibold text-gray-800 dark:text-white">{currentClient ? currentClient.name : 'Venda avulsa'}</span>
        </span>
        {/* Botão para remover cliente da venda atual */}
        {currentClient && (
          <button onClick={() => setCurrentClient(null)} className="text-xs text-red-500 hover:text-red-700">(remover)</button>
        )}
      </div>

      {/* === TELA DE BLOQUEIO: exibida quando o caixa está fechado === */}
      {/* Impede vendas sem caixa aberto — regra de negócio obrigatória */}
      {!cashRegisterOpen && (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <Landmark className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Caixa Fechado</h3>
            <p className="text-sm text-gray-400 mb-4">Abra o caixa para iniciar as vendas</p>
            <a href="/cash-register" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors inline-block">
              Abrir Caixa
            </a>
          </div>
        </div>
      )}

      {/* === LAYOUT PRINCIPAL DO PDV: esquerda (carrinho) + direita (resumo) === */}
      {/* Só renderiza se o caixa estiver aberto */}
      {cashRegisterOpen && <div className="flex flex-1 overflow-hidden">

        {/* === PAINEL ESQUERDO: Busca de produtos + Ordenação + Carrinho === */}
        {/* flex-[7] = ocupa 70% da largura — área principal de operação */}
        <div className="flex-[7] flex flex-col p-4 gap-3">

          {/* === SEÇÃO DE BUSCA E ORDENAÇÃO === */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            {/* Formulário de busca por código de barras — submissão via Enter ou botão */}
            <form onSubmit={searchProduct} className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={barcodeRef}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Código de barras"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-10 pr-4 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors">
                Buscar
              </button>
            </form>
            {/* Botões de ordenação — cada um aciona algoritmo de sort no backend */}
            {/* Campos disponíveis: nome (alfabético), preço (numérico), estoque (numérico) */}
            <div className="flex items-center gap-2 flex-wrap">
              <ArrowDownAZ className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-400">Ordenar:</span>
              {['name', 'salePrice', 'currentStock'].map((f) => (
                <button
                  key={f}
                  onClick={() => handleSortProducts(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    sortBy === f ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {/* Traduz nomes de campos para exibição */}
                  {f === 'name' ? 'Nome' : f === 'salePrice' ? 'Preço' : 'Estoque'}
                </button>
              ))}
              {/* Botão para fechar a lista de produtos ordenados */}
              {showProducts && (
                <button onClick={() => setShowProducts(false)} className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
                  Fechar Lista
                </button>
              )}
            </div>
          </div>

          {/* === TABELA DE PRODUTOS ORDENADOS (exibida após clicar em um botão de ordenação) === */}
          {/* Lista expansível com scroll — altura máxima 48 (12rem) para não dominar a tela */}
          {showProducts && productList.length > 0 && (
            <div className="max-h-48 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Produto</TableHead><TableHead className="text-right w-24">Preço</TableHead><TableHead className="text-center w-20">Estoque</TableHead><TableHead className="text-center w-20">Ação</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {productList.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">{p.name}</TableCell>
                      <TableCell className="text-right">{fmt(p.salePrice)}</TableCell>
                      <TableCell className="text-center">{p.currentStock}</TableCell>
                      <TableCell className="text-center">
                        {/* Botão "+" para adicionar produto ao carrinho direto da lista */}
                        <button onClick={() => addProductFromList(p)} className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                          <Plus className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* === TABELA DO CARRINHO: itens da venda atual === */}
          {/* Colunas: produto, quantidade, preço unitário, subtotal, ações (+/-/remover) */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center w-20">Qtd</TableHead>
                  <TableHead className="text-right w-28">Preço Unit.</TableHead>
                  <TableHead className="text-right w-28">Subtotal</TableHead>
                  <TableHead className="text-center w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Mensagem de carrinho vazio */}
                {cart.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400">Nenhum item adicionado</td></tr>
                )}
                {/* Renderiza cada item do carrinho */}
                {cart.map((item, idx) => (
                  <TableRow key={item.product.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">{item.product.name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{fmt(item.product.salePrice)}</TableCell>
                    {/* Subtotal = preço unitário * quantidade */}
                    <TableCell className="text-right font-medium">{fmt(item.product.salePrice * item.quantity)}</TableCell>
                    <TableCell className="text-center">
                      {/* Botões de ação: diminuir quantidade, aumentar quantidade, remover item */}
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => changeQty(idx, -1)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"><Minus className="h-3.5 w-3.5" /></button>
                        <button onClick={() => changeQty(idx, 1)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                        <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* === PAINEL DIREITO: Resumo da venda / Cupons === */}
        {/* flex-[3] = ocupa 30% da largura — painel lateral fixo */}
        <div className="flex-[3] bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-700 p-5 flex flex-col gap-4 overflow-y-auto">

          {/* === ABAS: Venda (resumo + pagamento) | Cupons (vendas recentes + cancelamento) === */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button onClick={() => setRightTab('sale')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${rightTab === 'sale' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Venda</button>
            <button onClick={() => setRightTab('coupons')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${rightTab === 'coupons' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              <Receipt className="h-3 w-3" /> Cupons
            </button>
          </div>

          {/* === ABA DE CUPONS: lista de vendas recentes com opção de cancelamento === */}
          {rightTab === 'coupons' && (
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-500" /> Vendas Recentes (Cupons)
              </h4>
              {/* Formulário de cancelamento — exibido quando o operador clica "Cancelar" em um cupom */}
              {cancellingId && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-red-700 dark:text-red-400 font-medium">Cancelar cupom #{cancellingId}</p>
                  <input
                    value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Motivo do cancelamento"
                    className="w-full rounded-lg border border-red-200 dark:border-red-700 py-2 px-3 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleCancelSale()}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleCancelSale} disabled={!cancelReason.trim()} className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50">Confirmar</button>
                    <button onClick={() => { setCancellingId(null); setCancelReason(''); }} className="flex-1 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500">Voltar</button>
                  </div>
                </div>
              )}
              {/* Lista de cupons — cada card mostra ID, data, valor e status */}
              {recentSales.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhuma venda registrada</p>
              ) : (
                <div className="space-y-1.5">
                  {recentSales.map((s) => (
                    <div key={s.id} className={`rounded-xl p-3 border text-xs ${s.status === 'Cancelada' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-gray-800 dark:text-white">#{s.id}</span>
                          <span className="ml-2 text-gray-400">{new Date(s.createdAt).toLocaleString('pt-BR')}</span>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-white">{fmt(s.finalTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        {/* Badge de status: verde (ativo) ou vermelho (cancelado) */}
                        <span className={`px-2 py-0.5 rounded-full font-medium ${s.status === 'Cancelada' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                          {s.status === 'Cancelada' ? 'Cancelado' : 'Ativo'}
                        </span>
                        {/* Botão de cancelar — só aparece para vendas ativas */}
                        {s.status !== 'Cancelada' && (
                          <button onClick={() => setCancellingId(s.id)} className="flex items-center gap-1 text-red-500 hover:text-red-700 font-medium">
                            <XCircle className="h-3 w-3" /> Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === ABA DE VENDA: fila de clientes, resumo financeiro, pagamento === */}
          {rightTab === 'sale' && <>

          {/* === SEÇÃO DA FILA DE CLIENTES (Queue — FIFO) === */}
          {/* Permite adicionar clientes por ID e chamar o próximo da fila */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" /> Fila de Clientes ({queueSize})
            </h4>
            {/* Input + botão para adicionar cliente à fila (enqueue) */}
            <div className="flex gap-2 mb-2">
              <input
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                placeholder="ID do cliente"
                className="flex-1 rounded-lg border border-indigo-200 dark:border-indigo-700 py-2 px-3 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-indigo-500 focus:outline-none bg-white dark:bg-gray-700"
                onKeyDown={(e) => e.key === 'Enter' && handleEnqueue()}
              />
              <button onClick={handleEnqueue} className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors">
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
            {/* Botão "Chamar Próximo" — executa dequeue (remove do início da fila) */}
            <button
              onClick={handleDequeue}
              disabled={queueSize === 0}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserCheck className="h-4 w-4" /> Chamar Próximo
            </button>
            {/* Lista visual dos clientes na fila (ordem FIFO: primeiro = topo) */}
            {queueList.length > 0 && (
              <div className="mt-2 max-h-20 overflow-auto bg-white dark:bg-gray-700 rounded-lg p-2">
                {queueList.map((c, i) => (
                  <div key={c.id || i} className="text-xs text-gray-600 dark:text-gray-300 py-0.5"><span className="text-gray-400">{i + 1}.</span> {c.name}</div>
                ))}
              </div>
            )}
          </div>

          <div className="border-b border-gray-100 dark:border-gray-700" />

          {/* === RESUMO FINANCEIRO DA VENDA === */}
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Resumo da Venda</h3>

          {/* Total bruto (soma dos subtotais dos itens) */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-xl font-bold text-gray-800 dark:text-white">{fmt(total)}</span>
          </div>

          {/* Campo de desconto em reais — subtraído do total bruto */}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Desconto (R$)</label>
            <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-3 text-sm text-gray-700 dark:text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Total final (total - desconto) — valor efetivamente cobrado */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Final</span>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{fmt(finalTotal)}</span>
          </div>

          {/* Seletor de forma de pagamento — opções: Dinheiro, Cartão Crédito, Cartão Débito, PIX */}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Forma de Pagamento</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-3 text-sm text-gray-700 dark:text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Dinheiro</option>
              <option>Cartão Crédito</option>
              <option>Cartão Débito</option>
              <option>PIX</option>
            </select>
          </div>

          {/* Campo de valor recebido + cálculo de troco — só exibido para pagamento em dinheiro */}
          {paymentMethod === 'Dinheiro' && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Valor Recebido</label>
              <input type="number" step="0.01" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-3 text-sm text-gray-700 dark:text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {/* Exibe troco calculado — vermelho se negativo (valor insuficiente) */}
              {amountReceived && (
                <div className={`flex justify-between items-center mt-2 text-sm font-medium ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <span>Troco</span><span>{fmt(Math.max(change, 0))}</span>
                </div>
              )}
            </div>
          )}

          {/* Botão de finalizar venda — desabilitado se carrinho vazio */}
          {/* Ao clicar: monta payload → tenta API → fallback offline → reseta carrinho */}
          <button
            onClick={finalizeSale}
            disabled={cart.length === 0}
            className="mt-auto w-full py-3.5 bg-green-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Finalizar Venda
          </button>
          </>}
        </div>
      </div>}
    </div>
  );
}
