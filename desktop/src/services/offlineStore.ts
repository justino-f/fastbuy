// offlineStore.ts — Camada de armazenamento offline baseada em localStorage
// Permite que o PDV desktop funcione mesmo sem conexão com o servidor (API)
// Estratégia: cache de produtos para consulta offline + fila de vendas pendentes para sincronização futura

import { Product } from '../types';

// Chaves do localStorage — centralizadas como constante para evitar typos e facilitar manutenção
// Prefixo 'fastbuy_' previne conflito com outros dados no localStorage
const KEYS = {
  products: 'fastbuy_products',         // cache local da lista de produtos
  pendingSales: 'fastbuy_pending_sales', // fila de vendas realizadas offline, aguardando sincronização
} as const;

// Salva a lista completa de produtos no localStorage como cache offline
// Chamada sempre que getProducts() da API retorna com sucesso — mantém o cache atualizado
export function saveProducts(products: Product[]): void {
  localStorage.setItem(KEYS.products, JSON.stringify(products));
}

// Recupera a lista de produtos do cache local (localStorage)
// Retorna array vazio se não houver cache ou se o JSON estiver corrompido
export function getProducts(): Product[] {
  const raw = localStorage.getItem(KEYS.products);
  if (!raw) return [];
  // try/catch protege contra JSON corrompido no localStorage
  try { return JSON.parse(raw) as Product[]; } catch { return []; }
}

// Busca um produto específico pelo código de barras no cache offline
// Usado como fallback quando a busca online falha no PDV
// Retorna null se o produto não for encontrado no cache
export function getProductByBarcode(barcode: string): Product | null {
  return getProducts().find((p) => p.barcode === barcode) ?? null;
}

// Adiciona uma venda à fila de pendentes no localStorage
// Chamada quando finalizeSale() falha na API — a venda é salva localmente para sincronização posterior
// O payload é do tipo 'any' pois é o mesmo objeto enviado para a API (flexibilidade)
export function savePendingSale(sale: any): void {
  const pending = getPendingSales();
  pending.push(sale);  // adiciona ao final da fila (FIFO — primeira venda pendente será sincronizada primeiro)
  localStorage.setItem(KEYS.pendingSales, JSON.stringify(pending));
}

// Recupera todas as vendas pendentes de sincronização
// Retorna array vazio se não houver pendências ou se o JSON estiver corrompido
export function getPendingSales(): any[] {
  const raw = localStorage.getItem(KEYS.pendingSales);
  if (!raw) return [];
  try { return JSON.parse(raw) as any[]; } catch { return []; }
}

// Remove todas as vendas pendentes do localStorage
// Chamada após sincronização bem-sucedida com o servidor
export function clearPendingSales(): void {
  localStorage.removeItem(KEYS.pendingSales);
}

// Verifica se o servidor (API) está acessível — health check com timeout de 3 segundos
// Faz uma requisição GET ao endpoint /categories como sonda de conectividade
// Retorna true se a resposta for 200 OK, false em qualquer outro caso
// O timeout de 3s (via AbortController) evita que a UI fique travada aguardando resposta em redes lentas
export async function isOnline(): Promise<boolean> {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://192.168.1.16:5000/api';
  try {
    // AbortController permite cancelar a requisição após o timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 segundos de timeout
    // Usa /categories como endpoint leve para verificação — requer token JWT para autenticação
    const res = await fetch(`${baseUrl}/categories`, { signal: controller.signal, headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
    clearTimeout(timeout); // limpa o timeout se a resposta chegou antes dos 3s
    return res.ok; // true se status 200-299
  } catch {
    // Qualquer erro (rede, timeout, abort) significa que o servidor está inacessível
    return false;
  }
}
