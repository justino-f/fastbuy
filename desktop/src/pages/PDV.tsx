import { useState, useRef, useEffect, FormEvent } from 'react';
import { Product, Client, Sale } from '../types';
import { createSale, getSales, cancelSale, getQueue, enqueueClient, dequeueClient, getStack, getProductsSorted, getProductByBarcode, getCurrentCashRegister } from '../services/api';
import { getProductByBarcode as getCachedProductByBarcode, savePendingSale, isOnline as checkOnline } from '../services/offlineStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Search, Plus, Minus, X, Users, Ban, ArrowDownAZ, Wifi, WifiOff, UserPlus, UserCheck, Landmark, Receipt, XCircle } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

const PAYMENT_MAP: Record<string, string> = {
  'Dinheiro': 'Dinheiro',
  'Cartão Crédito': 'Credito',
  'Cartão Débito': 'Debito',
  'PIX': 'PIX',
};

export default function PDV() {
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [amountReceived, setAmountReceived] = useState('');
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const barcodeRef = useRef<HTMLInputElement>(null);

  const [queueList, setQueueList] = useState<Client[]>([]);
  const [queueSize, setQueueSize] = useState(0);
  const [newClient, setNewClient] = useState('');
  const [cancelledCount, setCancelledCount] = useState(0);
  const [sortBy, setSortBy] = useState('');
  const [productList, setProductList] = useState<Product[]>([]);
  const [showProducts, setShowProducts] = useState(false);
  const [cashRegisterId, setCashRegisterId] = useState<number | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [cashRegisterOpen, setCashRegisterOpen] = useState(false);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [rightTab, setRightTab] = useState<'sale' | 'coupons'>('sale');

  useEffect(() => {
    barcodeRef.current?.focus();
    const interval = setInterval(async () => { setOnline(await checkOnline()); }, 10000);
    checkOnline().then(setOnline);
    loadQueue();
    loadCancelledCount();
    loadCashRegister();
    loadRecentSales();
    return () => clearInterval(interval);
  }, []);

  async function loadCashRegister() {
    const reg = await getCurrentCashRegister();
    setCashRegisterId(reg?.id ?? null);
    setCashRegisterOpen(!!reg);
  }

  const total = cart.reduce((s, i) => s + i.product.salePrice * i.quantity, 0);
  const finalTotal = total - discount;
  const change = paymentMethod === 'Dinheiro' && amountReceived ? parseFloat(amountReceived) - finalTotal : 0;
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  async function loadQueue() {
    try {
      const data = await getQueue();
      setQueueList(data.clients || []);
      setQueueSize(data.count || 0);
    } catch {}
  }

  async function handleEnqueue() {
    const val = newClient.trim();
    if (!val) return;
    const id = parseInt(val);
    if (isNaN(id)) { showMsg('Informe o ID numérico do cliente.', 'error'); return; }
    try {
      await enqueueClient(id);
      setNewClient('');
      await loadQueue();
      showMsg('Cliente adicionado à fila.', 'success');
    } catch {
      showMsg('Erro ao adicionar cliente à fila.', 'error');
    }
  }

  async function handleDequeue() {
    try {
      const result = await dequeueClient();
      await loadQueue();
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

  async function loadRecentSales() {
    try { const data = await getSales(); setRecentSales(data.slice(0, 20)); } catch {}
  }

  async function handleCancelSale() {
    if (!cancellingId || !cancelReason.trim()) return;
    try {
      await cancelSale(cancellingId, cancelReason.trim());
      showMsg(`Cupom #${cancellingId} cancelado.`, 'success');
      setCancellingId(null);
      setCancelReason('');
      await loadRecentSales();
      await loadCancelledCount();
    } catch {
      showMsg('Erro ao cancelar cupom.', 'error');
    }
  }

  async function loadCancelledCount() {
    try { const data = await getStack(); setCancelledCount(data.size || 0); } catch {}
  }

  async function handleSortProducts(field: string) {
    setSortBy(field);
    try { const data = await getProductsSorted(field); setProductList(data); setShowProducts(true); } catch { showMsg('Erro ao ordenar produtos.', 'error'); }
  }

  function addProductFromList(product: Product) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = { ...u[idx], quantity: u[idx].quantity + 1 }; return u; }
      return [...prev, { product, quantity: 1 }];
    });
    showMsg(`${product.name} adicionado.`, 'success');
  }

  async function searchProduct(e: FormEvent) {
    e.preventDefault();
    if (!barcode.trim()) return;
    let product: Product | null = null;
    if (online) {
      try {
        product = await getProductByBarcode(barcode.trim());
      } catch {
        product = getCachedProductByBarcode(barcode.trim());
      }
    } else {
      product = getCachedProductByBarcode(barcode.trim());
    }
    if (!product) { showMsg('Produto não encontrado.', 'error'); setBarcode(''); return; }
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product!.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = { ...u[idx], quantity: u[idx].quantity + 1 }; return u; }
      return [...prev, { product: product!, quantity: 1 }];
    });
    setBarcode('');
    barcodeRef.current?.focus();
  }

  function changeQty(idx: number, delta: number) {
    setCart((prev) => { const u = [...prev]; const n = u[idx].quantity + delta; if (n <= 0) return u.filter((_, i) => i !== idx); u[idx] = { ...u[idx], quantity: n }; return u; });
  }
  function removeItem(idx: number) { setCart((prev) => prev.filter((_, i) => i !== idx)); }
  function showMsg(msg: string, type: 'success' | 'error') { setMessage(msg); setMessageType(type); setTimeout(() => setMessage(''), 4000); }

  async function finalizeSale() {
    if (cart.length === 0) return;
    if (!cashRegisterId) {
      showMsg('Abra o caixa antes de finalizar a venda.', 'error');
      return;
    }

    const backendMethod = PAYMENT_MAP[paymentMethod] || paymentMethod;
    const paid = paymentMethod === 'Dinheiro' ? parseFloat(amountReceived) || finalTotal : finalTotal;

    const saleData = {
      cashRegisterId,
      clientId: currentClient?.id || undefined,
      items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      discount,
      paymentMethod: backendMethod,
      amountPaid: paid,
    };

    try {
      const sale = await createSale(saleData);
      setLastSaleId(sale.id);
      showMsg(`Venda #${sale.id} finalizada com sucesso!`, 'success');
      setCurrentClient(null);
    } catch {
      savePendingSale(saleData);
      showMsg('Venda salva offline. Será sincronizada quando houver conexão.', 'error');
    }
    setCart([]); setDiscount(0); setPaymentMethod('Dinheiro'); setAmountReceived(''); barcodeRef.current?.focus();
    loadRecentSales();
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {online ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
          <span className="text-sm text-gray-500 dark:text-gray-400">{online ? 'Online' : 'Offline'}</span>
          {!cashRegisterId && <span className="ml-2 px-3 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Caixa fechado</span>}
          {message && (
            <span className={`ml-3 px-3 py-1 rounded-lg text-xs font-medium ${messageType === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
              {message}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
            <Users className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Fila: {queueSize}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${cancelledCount > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
            <Ban className="h-4 w-4" style={{ color: cancelledCount > 0 ? '#ef4444' : '#9ca3af' }} />
            <span className={`text-xs font-semibold ${cancelledCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>Cancelamentos: {cancelledCount}</span>
          </div>
        </div>
      </div>

      {/* Sale Info Bar */}
      <div className="flex items-center gap-4 px-6 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Venda: <span className="font-semibold text-gray-800 dark:text-white">#{lastSaleId ? lastSaleId + 1 : 1}</span>
        </span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span className="text-gray-500 dark:text-gray-400">
          Cliente: <span className="font-semibold text-gray-800 dark:text-white">{currentClient ? currentClient.name : 'Venda avulsa'}</span>
        </span>
        {currentClient && (
          <button onClick={() => setCurrentClient(null)} className="text-xs text-red-500 hover:text-red-700">(remover)</button>
        )}
      </div>

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

      {cashRegisterOpen && <div className="flex flex-1 overflow-hidden">
        {/* Left - Cart */}
        <div className="flex-[7] flex flex-col p-4 gap-3">
          {/* Search + Sort */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
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
                  {f === 'name' ? 'Nome' : f === 'salePrice' ? 'Preço' : 'Estoque'}
                </button>
              ))}
              {showProducts && (
                <button onClick={() => setShowProducts(false)} className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
                  Fechar Lista
                </button>
              )}
            </div>
          </div>

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

          {/* Cart table */}
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
                {cart.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400">Nenhum item adicionado</td></tr>
                )}
                {cart.map((item, idx) => (
                  <TableRow key={item.product.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">{item.product.name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{fmt(item.product.salePrice)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(item.product.salePrice * item.quantity)}</TableCell>
                    <TableCell className="text-center">
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

        {/* Right - Summary */}
        <div className="flex-[3] bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-700 p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button onClick={() => setRightTab('sale')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${rightTab === 'sale' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Venda</button>
            <button onClick={() => setRightTab('coupons')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${rightTab === 'coupons' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              <Receipt className="h-3 w-3" /> Cupons
            </button>
          </div>

          {rightTab === 'coupons' && (
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-500" /> Vendas Recentes (Cupons)
              </h4>
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
                        <span className={`px-2 py-0.5 rounded-full font-medium ${s.status === 'Cancelada' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                          {s.status === 'Cancelada' ? 'Cancelado' : 'Ativo'}
                        </span>
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

          {rightTab === 'sale' && <>
          {/* Queue */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" /> Fila de Clientes ({queueSize})
            </h4>
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
            <button
              onClick={handleDequeue}
              disabled={queueSize === 0}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserCheck className="h-4 w-4" /> Chamar Próximo
            </button>
            {queueList.length > 0 && (
              <div className="mt-2 max-h-20 overflow-auto bg-white dark:bg-gray-700 rounded-lg p-2">
                {queueList.map((c, i) => (
                  <div key={c.id || i} className="text-xs text-gray-600 dark:text-gray-300 py-0.5"><span className="text-gray-400">{i + 1}.</span> {c.name}</div>
                ))}
              </div>
            )}
          </div>

          <div className="border-b border-gray-100 dark:border-gray-700" />

          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Resumo da Venda</h3>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-xl font-bold text-gray-800 dark:text-white">{fmt(total)}</span>
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Desconto (R$)</label>
            <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-3 text-sm text-gray-700 dark:text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Final</span>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{fmt(finalTotal)}</span>
          </div>

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

          {paymentMethod === 'Dinheiro' && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Valor Recebido</label>
              <input type="number" step="0.01" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-3 text-sm text-gray-700 dark:text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {amountReceived && (
                <div className={`flex justify-between items-center mt-2 text-sm font-medium ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <span>Troco</span><span>{fmt(Math.max(change, 0))}</span>
                </div>
              )}
            </div>
          )}

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
