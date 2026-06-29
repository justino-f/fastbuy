// api.ts — Camada de comunicação HTTP com o backend (API REST)
// Usa Axios como cliente HTTP com interceptors para autenticação JWT
// Diferença principal do frontend web: baseURL aponta para IP direto (rede local) em vez de path relativo
// Isso é necessário porque o app desktop (Tauri) não roda atrás do mesmo servidor web

import axios from 'axios';
import {
  LoginRequest,
  LoginResponse,
  Product,
  Sale,
  CashRegister,
  Client,
} from '../types';
import {
  saveProducts,
  getProducts as getCachedProducts,
} from './offlineStore';

// Instância Axios com baseURL configurável via variável de ambiente
// Fallback para IP da rede local (192.168.1.16:5000) — endereço direto do servidor backend
// No frontend web, o baseURL seria relativo ('/api'), mas no desktop precisa ser absoluto
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.1.16:5000/api',
});

// Interceptor de requisição — injeta o token JWT em toda requisição automaticamente
// Mesmo padrão usado no frontend web — garante consistência na autenticação
// O token é lido do localStorage a cada requisição (não cached) para refletir login/logout em tempo real
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de resposta — trata erro 401 (não autorizado) globalmente
// Se o token expirou ou é inválido, limpa credenciais e redireciona para login
// Evita que cada chamada de API precise tratar expiração de sessão individualmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // força redirecionamento para tela de login
    }
    return Promise.reject(error);
  }
);

// Autenticação — envia credenciais e recebe JWT token + dados do usuário
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
}

// Busca todos os produtos com fallback offline
// Estratégia: tenta buscar da API → se sucesso, atualiza cache local → se falha, retorna cache
// Essa abordagem garante que o PDV funcione mesmo sem conexão com o servidor
export async function getProducts(): Promise<Product[]> {
  try {
    const response = await api.get<Product[]>('/products');
    saveProducts(response.data); // atualiza cache local a cada busca bem-sucedida
    return response.data;
  } catch {
    return getCachedProducts(); // fallback: retorna produtos do localStorage
  }
}

// Busca produto por código de barras via API
// Usada no PDV para leitura de código de barras — busca exata no backend
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const response = await api.get<Product>(`/products/barcode/${barcode}`);
  return response.data;
}

// Cria uma nova venda — envia payload do carrinho para o backend
// O backend processa: decrementa estoque, gera pagamento, cria cupom fiscal
export async function createSale(data: any): Promise<Sale> {
  const response = await api.post<Sale>('/sales', data);
  return response.data;
}

// Lista todas as vendas — usado na página de histórico e na aba de cupons do PDV
export async function getSales(): Promise<Sale[]> {
  const response = await api.get<Sale[]>('/sales');
  return response.data;
}

// Busca o caixa (Cash Register) atualmente aberto
// Retorna null se nenhum caixa estiver aberto — o PDV bloqueia vendas nesse caso
export async function getCurrentCashRegister(): Promise<CashRegister | null> {
  try {
    const response = await api.get<CashRegister>('/cash-register/current');
    return response.data;
  } catch {
    return null; // nenhum caixa aberto ou erro de conexão
  }
}

// Lista caixas registradores — wrapper que retorna array para compatibilidade com a UI
// Reutiliza o endpoint /current pois o sistema opera com um caixa por vez
export async function getCashRegisters(): Promise<CashRegister[]> {
  try {
    const response = await api.get<CashRegister>('/cash-register/current');
    return [response.data];
  } catch {
    return [];
  }
}

// Abre um novo caixa com saldo de abertura (fundo de troco)
// Pré-requisito para qualquer venda — regra de negócio do PDV
export async function openCashRegister(openingBalance: number): Promise<CashRegister> {
  const response = await api.post<CashRegister>('/cash-register/open', { openingBalance });
  return response.data;
}

// Fecha o caixa atual — o backend calcula o saldo de fechamento automaticamente
export async function closeCashRegister(id: number): Promise<CashRegister> {
  const response = await api.put<CashRegister>(`/cash-register/${id}/close`);
  return response.data;
}

// === Fila de Atendimento (Queue — FIFO) ===
// Estrutura de dados acadêmica: Fila (First In, First Out)
// Clientes entram na fila e são atendidos na ordem de chegada

// Retorna a fila atual de clientes aguardando atendimento
export async function getQueue(): Promise<{ clients: Client[]; count: number }> {
  const response = await api.get('/clients/queue');
  return response.data;
}

// Adiciona um cliente ao final da fila (enqueue — operação FIFO)
export async function enqueueClient(clientId: number): Promise<any> {
  const response = await api.post('/clients/queue/enqueue', { clientId });
  return response.data;
}

// Remove o primeiro cliente da fila para atendimento (dequeue — operação FIFO)
export async function dequeueClient(): Promise<any> {
  const response = await api.post('/clients/queue/dequeue');
  return response.data;
}

// === Pilha de Cancelamentos (Stack — LIFO) ===
// Estrutura de dados acadêmica: Pilha (Last In, First Out)
// Cancelamentos são empilhados — o último cancelamento fica no topo

// Retorna a pilha de cupons cancelados e seu tamanho
export async function getStack(): Promise<{ stack: any[]; size: number }> {
  const response = await api.get('/sales/stack');
  return response.data;
}

// === Ordenação de Produtos (Algoritmos de Ordenação) ===
// Endpoint acadêmico: permite escolher o algoritmo de ordenação (quick, bubble, merge, etc.)
// Demonstra conceitos de estrutura de dados — o backend executa o algoritmo selecionado

// Busca produtos ordenados por campo específico usando algoritmo escolhido
export async function getProductsSorted(sortBy: string, algorithm: string = 'quick'): Promise<Product[]> {
  const response = await api.get<Product[]>('/products', {
    params: { sortBy, sortAlgorithm: algorithm },
  });
  return response.data;
}

// Cancela uma venda pelo ID com motivo obrigatório — empilha na Stack de cancelamentos
export async function cancelSale(id: number, reason: string): Promise<Sale> {
  const response = await api.put<Sale>(`/sales/${id}/cancel`, { reason });
  return response.data;
}

// Retorna histórico de caixas (aberturas e fechamentos anteriores)
export async function getCashRegisterHistory(): Promise<any[]> {
  const response = await api.get('/cash-register/history');
  return response.data;
}
