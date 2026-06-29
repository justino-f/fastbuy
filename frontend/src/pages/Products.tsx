import { useState, useEffect, FormEvent } from 'react';
import { Product, Category, StockMovement, Supplier } from '../types';
import { products, categories, stock, suppliers } from '../services/api';
import { inputCls, labelCls, btnPrimaryCls, btnSecondaryCls } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Search, Plus, Pencil, Trash2, Package, AlertTriangle, ArrowDownUp } from 'lucide-react';

// Estado inicial do formulário de produto — todos os campos com valores padrão
const emptyForm = {
  name: '', barcode: '', sku: '', categoryId: 0, supplierId: 0, brand: '', unit: 'un',
  costPrice: 0, salePrice: 0, minStock: 0, currentStock: 0, description: '', active: true, imageUrl: '',
};

// Estado inicial do formulário de movimentação de estoque
const emptyStockForm = { productId: 0, type: 'Entrada', quantity: 0, reason: '' };

// Página de Produtos — CRUD completo com duas abas: Catálogo e Estoque
// Integra ordenação via algoritmos acadêmicos (Quick Sort) enviados ao backend
export default function Products() {
  // Estado da lista de produtos — populado pela API com filtros aplicados
  const [list, setList] = useState<Product[]>([]);
  // Listas auxiliares para os selects do formulário
  const [cats, setCats] = useState<Category[]>([]);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  // Filtros de busca — disparam recarregamento da lista quando alterados
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  // Ordenação — sortBy define o campo, algorithm define o algoritmo acadêmico usado no backend
  const [sortBy, setSortBy] = useState('name');
  const algorithm = 'quick'; // algoritmo fixo: Quick Sort — O(n log n) caso médio
  // Controle do modal de criação/edição de produto
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null); // null = criação, número = edição
  const [form, setForm] = useState(emptyForm);

  // Controle de abas — 'list' (catálogo) ou 'stock' (estoque)
  const [tab, setTab] = useState<'list' | 'stock'>('list');
  // Dados da aba de estoque
  const [lowStock, setLowStock] = useState<Product[]>([]); // produtos com estoque abaixo do mínimo
  const [movements, setMovements] = useState<StockMovement[]>([]); // histórico de movimentações
  const [stockForm, setStockForm] = useState(emptyStockForm);
  const [stockModalOpen, setStockModalOpen] = useState(false);

  // Função de carregamento da lista — chamada na montagem e após cada CRUD
  // Envia filtros e algoritmo de ordenação ao backend
  const load = () => {
    products.getAll({ search, categoryId, sortBy, algorithm }).then((r) => setList(r.data)).catch(() => {});
  };

  // Carrega categorias e fornecedores uma vez na montagem (dados estáticos para selects)
  useEffect(() => { categories.getAll().then((r) => setCats(r.data)).catch(() => {}); suppliers.getAll().then((r) => setSupplierList(r.data)).catch(() => {}); }, []);
  // Recarrega lista quando filtros ou ordenação mudam — busca reativa
  useEffect(() => { load(); }, [search, categoryId, sortBy]);
  // Carrega dados de estoque quando a aba 'stock' é ativada
  useEffect(() => {
    if (tab === 'stock') {
      stock.getLowStock().then((r) => setLowStock(r.data)).catch(() => {});
      stock.getMovements().then((r) => setMovements(r.data)).catch(() => {});
    }
  }, [tab]);

  // Abre modal para novo produto — reseta formulário
  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  // Abre modal para edição — preenche formulário com dados do produto selecionado
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ name: p.name, barcode: p.barcode, sku: p.sku, categoryId: p.categoryId, supplierId: p.supplierId || 0, brand: p.brand, unit: p.unit, costPrice: p.costPrice, salePrice: p.salePrice, minStock: p.minStock, currentStock: p.currentStock, description: p.description || '', active: p.active, imageUrl: p.imageUrl || '' });
    setModalOpen(true);
  };

  // Helper genérico para atualizar campos do formulário — usa spread operator para imutabilidade
  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  // Submit do formulário — decide entre criar ou atualizar baseado na presença de editId
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editId) await products.update(editId, form);
    else await products.create(form);
    setModalOpen(false);
    load(); // recarrega lista após operação
  };

  // Exclusão de produto com confirmação do usuário
  const handleDelete = async (id: number) => {
    if (!confirm('Excluir produto?')) return;
    await products.delete(id);
    load();
  };

  // Submit de movimentação de estoque — valida campos antes de enviar
  const handleStockMovement = async (e: FormEvent) => {
    e.preventDefault();
    if (!stockForm.productId || stockForm.quantity <= 0) return;
    await stock.addMovement(stockForm);
    setStockForm(emptyStockForm);
    setStockModalOpen(false);
    // Recarrega dados de estoque e lista de produtos após movimentação
    stock.getLowStock().then((r) => setLowStock(r.data)).catch(() => {});
    stock.getMovements().then((r) => setMovements(r.data)).catch(() => {});
    load();
  };

  // Renderiza badge colorido conforme o tipo de movimentação
  // Cada tipo tem cor semântica: verde (entrada), vermelho (saída), âmbar (ajuste), laranja (perda)
  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      Entrada: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      'Saída': 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      Ajuste: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      Perda: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    };
    return <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{type}</span>;
  };

  return (
    <div>
      {/* Cabeçalho com título e botões de ação */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Produtos</h2>
        <div className="flex gap-2">
          {/* Botão de movimentação — só aparece na aba de estoque */}
          {tab === 'stock' && (
            <button onClick={() => { setStockForm(emptyStockForm); setStockModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
              <ArrowDownUp size={16} /> Movimentação
            </button>
          )}
          <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <Plus size={16} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Sistema de abas — alternância entre Catálogo e Estoque */}
      {/* Padrão: estado 'tab' controla qual conteúdo é renderizado condicionalmente */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('list')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'list' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
          Catálogo
        </button>
        <button onClick={() => setTab('stock')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'stock' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
          Estoque
        </button>
      </div>

      {/* Aba Catálogo — lista de produtos com filtros e ordenação */}
      {tab === 'list' && (
        <>
          {/* Barra de filtros: busca textual, filtro por categoria e seleção de ordenação */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Campo de busca com ícone de lupa */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Buscar produtos..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm w-64 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none" />
              </div>
              {/* Filtro por categoria — limpa seleção quando "Todas Categorias" é escolhido */}
              <select value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none">
                <option value="">Todas Categorias</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {/* Seleção de campo de ordenação — backend aplica algoritmo acadêmico (Quick Sort) */}
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none">
                <option value="name">Nome</option><option value="price">Preço</option><option value="stock">Estoque</option>
              </select>
            </div>
          </div>

          {/* Tabela de produtos — exibe dados principais com ações de edição e exclusão */}
          <Table>
            <TableHeader>
              <TableRow><TableHead>Nome</TableHead><TableHead>Código</TableHead><TableHead>Categoria</TableHead><TableHead>Preço</TableHead><TableHead>Estoque</TableHead><TableHead>Ações</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-gray-900 dark:text-white">{p.name}</TableCell>
                  <TableCell>{p.barcode}</TableCell>
                  <TableCell>{p.category?.name}</TableCell>
                  <TableCell>R$ {p.salePrice.toFixed(2)}</TableCell>
                  {/* Badge de estoque — vermelho se abaixo do mínimo, verde se adequado */}
                  <TableCell>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${p.currentStock <= p.minStock ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                      {p.currentStock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 transition-colors" title="Editar"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 transition-colors" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* Aba Estoque — alertas de estoque baixo e histórico de movimentações */}
      {tab === 'stock' && (
        <>
          {/* Alerta de estoque baixo — exibe apenas se houver produtos abaixo do mínimo */}
          {lowStock.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Produtos com Estoque Baixo
              </h3>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Produto</TableHead><TableHead>Estoque Atual</TableHead><TableHead>Estoque Mínimo</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((p) => (
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

          {/* Tabela de movimentações — histórico completo de entradas, saídas, ajustes e perdas */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Movimentações</h3>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Produto</TableHead><TableHead>Tipo</TableHead><TableHead>Quantidade</TableHead><TableHead>Motivo</TableHead><TableHead>Data</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-400">Nenhuma movimentação</td></tr>
                )}
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium text-gray-800 dark:text-white">{m.product?.name || m.productId}</TableCell>
                    <TableCell>{typeBadge(m.type)}</TableCell>
                    <TableCell>{m.quantity}</TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">{m.reason}</TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">{new Date(m.createdAt).toLocaleString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Modal de criação/edição de produto — Dialog reutilizável com formulário completo */}
      {/* Padrão: mesmo modal serve para criar e editar, diferenciado pelo editId */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 flex h-10 w-10 items-center justify-center rounded-full">
              <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              {/* Título dinâmico: "Editar" se editId existe, "Novo" se não */}
              <DialogTitle>{editId ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              <DialogDescription>{editId ? 'Altere os dados do produto' : 'Preencha os dados para cadastrar'}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {/* Formulário com grid de 2 colunas para campos do produto */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Nome</label><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required /></div>
            <div><label className={labelCls}>Código de Barras</label><input className={inputCls} value={form.barcode} onChange={(e) => set('barcode', e.target.value)} /></div>
            <div><label className={labelCls}>SKU</label><input className={inputCls} value={form.sku} onChange={(e) => set('sku', e.target.value)} /></div>
            <div><label className={labelCls}>Categoria</label>
              <select className={inputCls} value={form.categoryId} onChange={(e) => set('categoryId', Number(e.target.value))} required>
                <option value={0}>Selecione</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Fornecedor</label>
              <select className={inputCls} value={form.supplierId} onChange={(e) => set('supplierId', Number(e.target.value))}>
                <option value={0}>Selecione</option>
                {supplierList.map((s) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Marca</label><input className={inputCls} value={form.brand} onChange={(e) => set('brand', e.target.value)} /></div>
            <div><label className={labelCls}>Unidade</label><input className={inputCls} value={form.unit} onChange={(e) => set('unit', e.target.value)} /></div>
            {/* Campos numéricos com step=0.01 para valores monetários */}
            <div><label className={labelCls}>Preço de Custo</label><input className={inputCls} type="number" step="0.01" value={form.costPrice} onChange={(e) => set('costPrice', Number(e.target.value))} /></div>
            <div><label className={labelCls}>Preço de Venda</label><input className={inputCls} type="number" step="0.01" value={form.salePrice} onChange={(e) => set('salePrice', Number(e.target.value))} required /></div>
            <div><label className={labelCls}>Estoque Mínimo</label><input className={inputCls} type="number" value={form.minStock} onChange={(e) => set('minStock', Number(e.target.value))} /></div>
            <div><label className={labelCls}>Estoque Atual</label><input className={inputCls} type="number" value={form.currentStock} onChange={(e) => set('currentStock', Number(e.target.value))} /></div>
            <div className="col-span-2"><label className={labelCls}>Descrição</label><textarea className={`${inputCls} h-20 resize-none`} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
            {/* Checkbox de ativo/inativo — soft delete sem remover do banco */}
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label className="text-sm text-gray-700 dark:text-gray-300">Ativo</label>
            </div>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondaryCls}>Cancelar</button>
            <button type="submit" className={btnPrimaryCls}>Salvar</button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modal de movimentação de estoque — registra entrada, saída, ajuste ou perda */}
      <Dialog open={stockModalOpen} onClose={() => setStockModalOpen(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 flex h-10 w-10 items-center justify-center rounded-full">
              <ArrowDownUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle>Nova Movimentação</DialogTitle>
              <DialogDescription>Registre entrada, saída ou ajuste de estoque</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleStockMovement}>
          <div className="grid grid-cols-2 gap-4">
            {/* Select de produto — lista todos os produtos cadastrados */}
            <div className="col-span-2">
              <label className={labelCls}>Produto</label>
              <select className={inputCls} value={stockForm.productId} onChange={(e) => setStockForm((f) => ({ ...f, productId: Number(e.target.value) }))} required>
                <option value={0}>Selecione</option>
                {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {/* Tipo de movimentação — define se adiciona ou remove do estoque */}
            <div>
              <label className={labelCls}>Tipo</label>
              <select className={inputCls} value={stockForm.type} onChange={(e) => setStockForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="Entrada">Entrada</option>
                <option value="Saída">Saída</option>
                <option value="Ajuste">Ajuste</option>
                <option value="Perda">Perda</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Quantidade</label>
              <input className={inputCls} type="number" min={1} value={stockForm.quantity || ''} onChange={(e) => setStockForm((f) => ({ ...f, quantity: Number(e.target.value) }))} required />
            </div>
            {/* Motivo — justificativa para auditoria (rastreabilidade) */}
            <div className="col-span-2">
              <label className={labelCls}>Motivo</label>
              <input className={inputCls} placeholder="Motivo da movimentação" value={stockForm.reason} onChange={(e) => setStockForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setStockModalOpen(false)} className={btnSecondaryCls}>Cancelar</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Registrar</button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
