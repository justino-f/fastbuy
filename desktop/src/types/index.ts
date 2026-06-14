export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export interface Product {
  id: number;
  name: string;
  barcode: string;
  sku: string;
  categoryId: number;
  category?: Category;
  brand: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  currentStock: number;
  description?: string;
  active: boolean;
  imageUrl?: string;
}

export interface Category {
  id: number;
  name: string;
  active: boolean;
}

export interface Client {
  id: number;
  name: string;
  cpf: string;
  phone?: string;
  email?: string;
}

export interface Supplier {
  id: number;
  companyName: string;
  cnpj: string;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
}

export interface StockMovement {
  id: number;
  productId: number;
  product?: Product;
  type: string;
  quantity: number;
  reason?: string;
  createdAt: string;
}

export interface Sale {
  id: number;
  clientId?: number;
  client?: Client;
  userId: number;
  total: number;
  discount: number;
  finalTotal: number;
  status: string;
  createdAt: string;
  items: SaleItem[];
  payment?: Payment;
}

export interface SaleItem {
  id: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Payment {
  id: number;
  method: string;
  amount: number;
  change?: number;
  status: string;
}

export interface CashRegister {
  id: number;
  userId: number;
  openingBalance: number;
  closingBalance?: number;
  status: string;
  openedAt: string;
  closedAt?: string;
}

export interface DashboardData {
  totalSoldToday: number;
  productsSoldToday: number;
  outOfStockCount: number;
  clientsServedToday: number;
  salesByHour: { hour: number; total: number }[];
  topProducts: { name: string; quantity: number }[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  name: string;
  email: string;
  role: string;
}

export interface CancelledCoupon {
  id: number;
  saleId: number;
  total: number;
  reason: string;
  cancelledAt: string;
}
