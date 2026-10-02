/** Thin client for /api/admin. Every call carries the session cookie; errors become ApiError. */
import type { Photo, Tag, Stock, Zone } from '../shared/catalog';
import type { Business, Returns } from '../shared/legal';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: { error?: string; fields?: string[]; reasons?: string[]; detail?: string },
  ) {
    super(body.error ?? `HTTP ${status}`);
  }
}

export interface AdminPhoto extends Photo {
  altSq: string;
  altEn: string;
}

export interface AdminProduct {
  id: string;
  slug: string;
  nameSq: string;
  nameEn: string;
  descriptionSq: string;
  descriptionEn: string;
  price: number | null;
  comparePrice: number | null;
  color: string;
  categories: Tag[];
  status: 'draft' | 'published';
  featured: boolean;
  instagramUrl: string;
  sort: number;
  stock: Stock;
  photos: AdminPhoto[];
  updatedAt: string;
  /** Shown as new until then; null until the first publication. */
  newUntil: string | null;
}

export interface SaleOrder {
  id: string;
  number: number;
  created_at: string;
  status: OrderStatus;
  payment_method: 'cod' | 'card';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  customer_name: string;
  phone: string;
  city: string;
  zone: string;
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  source: string;
  items: { product_id: string | null; name: string; size: string; qty: number; price: number }[];
}

export interface SalesReport {
  prev: string;
  from: string;
  to: string;
  orders: SaleOrder[];
  previous: SaleOrder[];
  visits: number;
  prevVisits: number;
}

export type OrderStatus = 'awaiting_payment' | 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderSummary {
  id: string;
  number: number;
  status: OrderStatus;
  payment_method: 'cod' | 'card';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  customer_name: string;
  phone: string;
  city: string;
  total: number;
  delivery_fee: number | null;
  created_at: string;
  pieces: number;
}

export interface LinkedChat {
  id: number;
  name: string;
  at: string;
}

export interface InstagramState {
  linked: boolean;
  username: string;
  followers: number;
  source: 'instagram' | 'manual' | 'seed';
  checkedAt: string;
  error: string;
}

export interface StatsReport {
  days: number;
  visits: number;
  views: number;
  daily: { day: string; n: number }[];
  sources: { key: string; visits: number; orders: number }[];
  campaigns: { key: string; n: number }[];
  dresses: { slug: string; name: string; n: number }[];
  funnel: { checkout: number; submit: number; invalid: number; orders: number };
  invalidFields: { key: string; n: number }[];
  sales: { orders: number; total: number };
}

export interface OrderDetail {
  order: OrderSummary & { email: string; zone: string; address: string; notes: string; subtotal: number; lang: string; payment_ref: string; source: string };
  items: { product_id: string | null; name: string; size: string; qty: number; price: number; image_key: string }[];
  next: OrderStatus[];
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(res.status, data as never);
  return data;
}

export const api = {
  me: () => call<{ admin: boolean; devLogin: boolean; passwordSet: boolean }>('GET', '/me'),
  login: (password: string) => call<{ ok: true }>('POST', '/login', { password }),
  devLogin: () => call<{ ok: true }>('POST', '/dev-login'),
  logout: () => call<{ ok: true }>('POST', '/logout'),
  summary: () => call<{ published: number; drafts: number; newOrders: number; awaitingPayment: number; confirmed: number; soldOut: number; demo: boolean }>('GET', '/summary'),
  products: () => call<AdminProduct[]>('GET', '/products'),
  product: (id: string) => call<AdminProduct>('GET', `/products/${id}`),
  create: (nameSq: string) => call<AdminProduct>('POST', '/products', { nameSq }),
  save: (id: string, patch: Partial<AdminProduct>) => call<AdminProduct>('PUT', `/products/${id}`, patch),
  /** true: new for two weeks from now; false: no longer new. */
  markNew: (id: string, on: boolean) => call<AdminProduct>('PUT', `/products/${id}`, { markNew: on }),
  sales: (prev: string, from: string, to: string) => call<SalesReport>('GET', `/sales?prev=${prev}&from=${from}&to=${to}`),
  remove: (id: string) => call<{ ok: true }>('DELETE', `/products/${id}`),
  reorder: (ids: string[]) => call<{ ok: true }>('POST', '/products/reorder', { ids }),
  photoOrder: (id: string, ids: string[]) => call<AdminProduct>('PUT', `/products/${id}/photos/order`, { ids }),
  photoAlt: (photoId: string, altSq: string, altEn: string) => call<AdminProduct>('PATCH', `/photos/${photoId}`, { altSq, altEn }),
  deletePhoto: (photoId: string) => call<AdminProduct>('DELETE', `/photos/${photoId}`),
  orders: (status?: string) => call<OrderSummary[]>('GET', `/orders${status ? `?status=${status}` : ''}`),
  order: (id: string) => call<OrderDetail>('GET', `/orders/${id}`),
  updateOrder: (id: string, patch: { status?: OrderStatus; paymentStatus?: string }) => call<OrderDetail>('PATCH', `/orders/${id}`, patch),
  settings: () => call<{ zones: Zone[]; shopPhone: string; card: boolean }>('GET', '/settings'),
  saveSettings: (zones: Zone[]) => call<{ zones: Zone[] }>('PUT', '/settings', { zones }),
  stats: (days: number) => call<StatsReport>('GET', `/stats?days=${days}`),
  legal: () => call<{ business: Business; returns: Returns; updated: string }>('GET', '/legal'),
  saveLegal: (business: Business, returns: Returns) => call<{ business: Business; returns: Returns; updated: string }>('PUT', '/legal', { business, returns }),
  telegram: () => call<{ ready: boolean; bot: string | null; chats: LinkedChat[] }>('GET', '/telegram'),
  telegramLink: () => call<{ code: string; bot: string; url: string }>('POST', '/telegram/link'),
  telegramCheck: () => call<{ state: 'linked' | 'waiting' | 'expired' | 'none'; chat?: LinkedChat }>('POST', '/telegram/check'),
  telegramRemove: (id: number) => call<{ chats: LinkedChat[] }>('DELETE', `/telegram/chats/${id}`),
  telegramTest: () => call<{ sent: number }>('POST', '/telegram/test'),
  instagram: () => call<InstagramState>('GET', '/instagram'),
  instagramToken: (token: string) => call<InstagramState>('PUT', '/instagram', { token }),
  instagramFollowers: (followers: number) => call<InstagramState>('PUT', '/instagram', { followers }),
  instagramSync: () => call<InstagramState>('POST', '/instagram/sync'),
  instagramUnlink: () => call<InstagramState>('DELETE', '/instagram'),
};

/** Upload with progress (fetch has no upload progress). Resolves to the updated product. */
export function uploadPhoto(productId: string, form: FormData, onProgress: (f: number) => void): Promise<AdminProduct> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/admin/products/${productId}/photos`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body: unknown = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* keep {} */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as AdminProduct);
      else reject(new ApiError(xhr.status, body as never));
    };
    xhr.onerror = () => reject(new ApiError(0, { error: 'network' }));
    xhr.send(form);
  });
}
