import axios from 'axios';
import {
  LoginRequest,
  LoginResponse,
  Product,
  Category,
  Client,
  Supplier,
  StockMovement,
  Sale,
  CashRegister,
  DashboardData,
  CancelledCoupon,
} from '../types';

// Cria instância Axios com baseURL dinâmica:
// - Em desenvolvimento: usa variável de ambiente VITE_API_URL (ex: http://localhost:3000/api)
// - Em produção: usa '/api' como fallback (proxy reverso do Nginx resolve para o backend)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Interceptor de requisição — anexa o token JWT em toda requisição HTTP
// O token é recuperado do localStorage e enviado no header Authorization
// Padrão Bearer Token: o backend valida este header para autenticar o usuário
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta — trata erros globais de autenticação
// Se o backend retorna 401 (token expirado ou inválido):
// 1. Remove credenciais do localStorage (limpeza de sessão)
// 2. Redireciona para /login (força re-autenticação)
// Isso garante logout automático quando a sessão expira
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Serviço de autenticação — login e registro de usuários
export const auth = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
};

// Serviço de produtos — CRUD completo com busca, filtro e ordenação
export const products = {
  // Lista produtos com filtros opcionais: busca textual, categoria, e ordenação via algoritmo acadêmico
  getAll: (params?: { search?: string; categoryId?: number; sortBy?: string; algorithm?: string }) =>
    api.get<Product[]>('/products', { params }),
  getById: (id: number) => api.get<Product>(`/products/${id}`),
  // Busca por código de barras — usado no PDV para leitura via scanner
  getByBarcode: (barcode: string) => api.get<Product>(`/products/barcode/${barcode}`),
  create: (data: Partial<Product>) => api.post<Product>('/products', data),
  update: (id: number, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

// Serviço de categorias — CRUD para classificação de produtos
export const categories = {
  getAll: () => api.get<Category[]>('/categories'),
  create: (data: { name: string }) => api.post<Category>('/categories', data),
  update: (id: number, data: { name: string; active?: boolean }) =>
    api.put<Category>(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Serviço de clientes — CRUD com histórico de compras vinculado
export const clients = {
  getAll: (search?: string) => api.get<Client[]>('/clients', { params: { search } }),
  getById: (id: number) => api.get<Client>(`/clients/${id}`),
  create: (data: Partial<Client>) => api.post<Client>('/clients', data),
  update: (id: number, data: Partial<Client>) => api.put<Client>(`/clients/${id}`, data),
  // Retorna todas as vendas vinculadas a um cliente específico
  getPurchaseHistory: (id: number) => api.get<Sale[]>(`/clients/${id}/purchases`),
};

// Serviço de fornecedores — CRUD para gestão da cadeia de suprimentos
export const suppliers = {
  getAll: () => api.get<Supplier[]>('/suppliers'),
  create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data),
  update: (id: number, data: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};

// Serviço de estoque — controle de movimentações e alertas de estoque baixo
export const stock = {
  // Lista movimentações, opcionalmente filtradas por produto
  getMovements: (productId?: number) =>
    api.get<StockMovement[]>('/stock/movements', { params: { productId } }),
  // Registra nova movimentação (entrada, saída, ajuste ou perda)
  addMovement: (data: { productId: number; type: string; quantity: number; reason?: string }) =>
    api.post<StockMovement>('/stock/movement', data),
  // Retorna produtos com estoque abaixo do mínimo configurado
  getLowStock: () => api.get<Product[]>('/stock/low-stock'),
};

// Serviço de vendas — criação, cancelamento e consulta de transações
export const sales = {
  // Cria nova venda com itens e pagamento — desconta estoque automaticamente no backend
  create: (data: {
    clientId?: number;
    items: { productId: number; quantity: number }[];
    discount?: number;
    payment: { method: string; amount: number };
  }) => api.post<Sale>('/sales', data),
  // Cancela venda existente — exige motivo para auditoria
  cancel: (id: number, reason: string) => api.put(`/sales/${id}/cancel`, { reason }),
  // Lista vendas com filtro por período e status
  getAll: (params?: { startDate?: string; endDate?: string; status?: string }) =>
    api.get<Sale[]>('/sales', { params }),
  getById: (id: number) => api.get<Sale>(`/sales/${id}`),
};

// Serviço de caixa registradora — controle de abertura e fechamento de turno
export const cashRegister = {
  // Abre caixa com saldo inicial (fundo de troco)
  open: (openingBalance: number) =>
    api.post<CashRegister>('/cash-register/open', { openingBalance }),
  // Fecha caixa — calcula saldo final baseado nas vendas do turno
  close: () => api.post<CashRegister>('/cash-register/close'),
  // Retorna o caixa aberto do usuário atual (se houver)
  getCurrent: () => api.get<CashRegister>('/cash-register/current'),
};

// Serviço de dashboard — retorna KPIs e dados agregados em tempo real
export const dashboard = {
  get: () => api.get<DashboardData>('/dashboard'),
};

// Serviço de estruturas de dados acadêmicas
// Implementações de Fila, Pilha, Matriz e Ordenação para fins didáticos
export const dataStructures = {
  // Fila de atendimento (FIFO — First In, First Out)
  // Estrutura de dados: Fila — clientes são atendidos na ordem de chegada
  enqueueClient: (clientId: number) => api.post('/clients/queue/enqueue', { clientId }), // enfileira cliente
  dequeueClient: () => api.post('/clients/queue/dequeue'),                               // desenfileira (atende o próximo)
  peekQueue: () => api.get('/clients/queue/peek'),                                       // consulta o primeiro da fila sem remover
  getQueue: () => api.get<{ count: number; clients: Client[] }>('/clients/queue'),       // lista completa da fila

  // Pilha de cancelamentos (LIFO — Last In, First Out)
  // Estrutura de dados: Pilha — último cancelamento empilhado é o primeiro consultado
  getStack: () => api.get<CancelledCoupon[]>('/sales/stack'),   // lista todos os cancelamentos na pilha
  peekStack: () => api.get('/sales/stack/peek'),                 // consulta o topo da pilha sem remover
  popStack: () => api.post('/sales/stack/pop'),                  // desempilha o último cancelamento

  // Matriz de preços e Algoritmos de ordenação
  // Estrutura de dados: Matriz — representação tabular de preços por categoria
  getMatrix: () => api.get('/products/matrix'),
  // Ordenação via algoritmos acadêmicos (Quick Sort, Bubble Sort, etc.)
  sort: (params: { sortBy: string; algorithm: string }) =>
    api.post('/products/sort', params),
};

// Serviço de relatórios — consultas analíticas com filtro por período
export const reports = {
  // Relatório de vendas: totais, por dia, por forma de pagamento
  sales: (startDate: string, endDate: string) =>
    api.get('/reports/sales', { params: { startDate, endDate } }),
  // Relatório de caixa: aberturas, fechamentos, saldos
  cashRegisters: (startDate: string, endDate: string) =>
    api.get('/reports/cash-registers', { params: { startDate, endDate } }),
  // Relatório de produtos: totais, mais vendidos, estoque baixo
  products: () => api.get('/reports/products'),
  // Relatório de fornecedores: vínculos com produtos
  suppliers: () => api.get('/reports/suppliers'),
};

// Serviço de pagamento — processamento de pagamento para uma venda
export const payment = {
  process: (data: { saleId: number; method: string; amount: number }) =>
    api.post('/payment/process', data),
};

export default api;
