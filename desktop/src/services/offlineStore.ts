import { Product } from '../types';

const KEYS = {
  products: 'fastbuy_products',
  pendingSales: 'fastbuy_pending_sales',
  lastSync: 'fastbuy_last_sync',
} as const;

export function saveProducts(products: Product[]): void {
  localStorage.setItem(KEYS.products, JSON.stringify(products));
}

export function getProducts(): Product[] {
  const raw = localStorage.getItem(KEYS.products);
  if (!raw) return [];
  try { return JSON.parse(raw) as Product[]; } catch { return []; }
}

export function getProductByBarcode(barcode: string): Product | null {
  return getProducts().find((p) => p.barcode === barcode) ?? null;
}

export function savePendingSale(sale: any): void {
  const pending = getPendingSales();
  pending.push(sale);
  localStorage.setItem(KEYS.pendingSales, JSON.stringify(pending));
}

export function getPendingSales(): any[] {
  const raw = localStorage.getItem(KEYS.pendingSales);
  if (!raw) return [];
  try { return JSON.parse(raw) as any[]; } catch { return []; }
}

export function clearPendingSales(): void {
  localStorage.removeItem(KEYS.pendingSales);
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(KEYS.lastSync);
}

export function setLastSyncTime(): void {
  localStorage.setItem(KEYS.lastSync, new Date().toISOString());
}

export async function isOnline(): Promise<boolean> {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://192.168.1.16:5000/api';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${baseUrl}/categories`, { signal: controller.signal, headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}
