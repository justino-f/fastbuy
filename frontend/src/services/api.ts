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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const auth = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
};

export const products = {
  getAll: (params?: { search?: string; categoryId?: number; sortBy?: string; algorithm?: string }) =>
    api.get<Product[]>('/products', { params }),
  getById: (id: number) => api.get<Product>(`/products/${id}`),
  getByBarcode: (barcode: string) => api.get<Product>(`/products/barcode/${barcode}`),
  create: (data: Partial<Product>) => api.post<Product>('/products', data),
  update: (id: number, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const categories = {
  getAll: () => api.get<Category[]>('/categories'),
  create: (data: { name: string }) => api.post<Category>('/categories', data),
  update: (id: number, data: { name: string; active?: boolean }) =>
    api.put<Category>(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

export const clients = {
  getAll: (search?: string) => api.get<Client[]>('/clients', { params: { search } }),
  getById: (id: number) => api.get<Client>(`/clients/${id}`),
  create: (data: Partial<Client>) => api.post<Client>('/clients', data),
  update: (id: number, data: Partial<Client>) => api.put<Client>(`/clients/${id}`, data),
  getPurchaseHistory: (id: number) => api.get<Sale[]>(`/clients/${id}/purchases`),
};

export const suppliers = {
  getAll: () => api.get<Supplier[]>('/suppliers'),
  create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data),
  update: (id: number, data: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};

export const stock = {
  getMovements: (productId?: number) =>
    api.get<StockMovement[]>('/stock', { params: { productId } }),
  addMovement: (data: { productId: number; type: string; quantity: number; reason?: string }) =>
    api.post<StockMovement>('/stock', data),
  getLowStock: () => api.get<Product[]>('/stock/low'),
};

export const sales = {
  create: (data: {
    clientId?: number;
    items: { productId: number; quantity: number }[];
    discount?: number;
    payment: { method: string; amount: number };
  }) => api.post<Sale>('/sales', data),
  cancel: (id: number, reason: string) => api.put(`/sales/${id}/cancel`, { reason }),
  getAll: (params?: { startDate?: string; endDate?: string; status?: string }) =>
    api.get<Sale[]>('/sales', { params }),
  getById: (id: number) => api.get<Sale>(`/sales/${id}`),
};

export const cashRegister = {
  open: (openingBalance: number) =>
    api.post<CashRegister>('/cash-register/open', { openingBalance }),
  close: () => api.post<CashRegister>('/cash-register/close'),
  getCurrent: () => api.get<CashRegister>('/cash-register/current'),
};

export const dashboard = {
  get: () => api.get<DashboardData>('/dashboard'),
};

export const reports = {
  getSales: (period: string) => api.get('/reports/sales', { params: { period } }),
  getTopProducts: () => api.get('/reports/top-products'),
  getLowStock: () => api.get('/reports/low-stock'),
  getRevenue: () => api.get('/reports/revenue'),
};

export const dataStructures = {
  enqueueClient: (clientId: number) => api.post('/data-structures/queue/enqueue', { clientId }),
  dequeueClient: () => api.post('/data-structures/queue/dequeue'),
  peekQueue: () => api.get('/data-structures/queue/peek'),
  getQueue: () => api.get<Client[]>('/data-structures/queue'),
  getStack: () => api.get<CancelledCoupon[]>('/data-structures/stack'),
  peekStack: () => api.get('/data-structures/stack/peek'),
  popStack: () => api.post('/data-structures/stack/pop'),
  getMatrix: () => api.get('/data-structures/matrix'),
  sort: (params: { sortBy: string; algorithm: string }) =>
    api.get('/data-structures/sort', { params }),
};

export const payment = {
  process: (data: { saleId: number; method: string; amount: number }) =>
    api.post('/payment/process', data),
};

export default api;
