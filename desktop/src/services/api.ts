import axios from 'axios';
import {
  LoginRequest,
  LoginResponse,
  Product,
  Sale,
  CashRegister,
} from '../types';
import {
  saveProducts,
  getProducts as getCachedProducts,
  savePendingSale,
  getPendingSales,
  clearPendingSales,
} from './offlineStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
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

export async function createSale(data: any): Promise<Sale> {
  try {
    const response = await api.post<Sale>('/sales', data);
    return response.data;
  } catch (error) {
    savePendingSale(data);
    throw error;
  }
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
    try {
      await api.post('/sales', sale);
      synced++;
    } catch {
      failed++;
    }
  }

  if (failed === 0) {
    clearPendingSales();
  }

  return { synced, failed };
}

export async function getCashRegisters(): Promise<CashRegister[]> {
  const response = await api.get<CashRegister[]>('/cash-registers');
  return response.data;
}

export async function openCashRegister(openingBalance: number): Promise<CashRegister> {
  const response = await api.post<CashRegister>('/cash-registers', { openingBalance });
  return response.data;
}

export async function closeCashRegister(id: number, closingBalance: number): Promise<CashRegister> {
  const response = await api.put<CashRegister>(`/cash-registers/${id}/close`, { closingBalance });
  return response.data;
}
