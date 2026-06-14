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
  getPendingSales,
  clearPendingSales,
} from './offlineStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.1.16:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await api.get<Product[]>('/products');
    saveProducts(response.data);
    return response.data;
  } catch {
    return getCachedProducts();
  }
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const response = await api.get<Product>(`/products/barcode/${barcode}`);
  return response.data;
}

export async function createSale(data: any): Promise<Sale> {
  const response = await api.post<Sale>('/sales', data);
  return response.data;
}

export async function getSales(): Promise<Sale[]> {
  const response = await api.get<Sale[]>('/sales');
  return response.data;
}

export async function syncPendingSales(): Promise<{ synced: number; failed: number }> {
  const pending = getPendingSales();
  let synced = 0;
  let failed = 0;
  for (const sale of pending) {
    try { await api.post('/sales', sale); synced++; } catch { failed++; }
  }
  if (failed === 0) clearPendingSales();
  return { synced, failed };
}

export async function getCurrentCashRegister(): Promise<CashRegister | null> {
  try {
    const response = await api.get<CashRegister>('/cash-register/current');
    return response.data;
  } catch {
    return null;
  }
}

export async function getCashRegisters(): Promise<CashRegister[]> {
  try {
    const response = await api.get<CashRegister>('/cash-register/current');
    return [response.data];
  } catch {
    return [];
  }
}

export async function openCashRegister(openingBalance: number): Promise<CashRegister> {
  const response = await api.post<CashRegister>('/cash-register/open', { openingBalance });
  return response.data;
}

export async function closeCashRegister(id: number): Promise<CashRegister> {
  const response = await api.put<CashRegister>(`/cash-register/${id}/close`);
  return response.data;
}

export async function getQueue(): Promise<{ clients: Client[]; count: number }> {
  const response = await api.get('/data-structures/queue');
  return response.data;
}

export async function enqueueClient(clientId: number): Promise<any> {
  const response = await api.post('/data-structures/queue/enqueue', { clientId });
  return response.data;
}

export async function dequeueClient(): Promise<any> {
  const response = await api.post('/data-structures/queue/dequeue');
  return response.data;
}

export async function getStack(): Promise<{ stack: any[]; size: number }> {
  const response = await api.get('/data-structures/stack');
  return response.data;
}

export async function getProductsSorted(sortBy: string, algorithm: string = 'quick'): Promise<Product[]> {
  const response = await api.get<Product[]>('/products', {
    params: { sortBy, sortAlgorithm: algorithm },
  });
  return response.data;
}

export async function cancelSale(id: number, reason: string): Promise<Sale> {
  const response = await api.put<Sale>(`/sales/${id}/cancel`, { reason });
  return response.data;
}

export async function getCashRegisterHistory(): Promise<any[]> {
  const response = await api.get('/cash-register/history');
  return response.data;
}
