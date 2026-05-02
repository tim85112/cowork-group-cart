import { env } from './env';
import type { Product } from '@/types/product';

interface CreateGroupPayload {
  group_id: string;
  owner_name: string;
  owner_phone: string;
  owner_user_id: string;
  building?: string;
  created_at?: string;
}

interface ConfirmGroupPayload {
  group_id: string;
  owner_user_id: string;
  total_amount: number;
  order_summary: Array<{
    user_name: string;
    is_owner: boolean;
    subtotal: number;
    items: Array<{ food_name: string; quantity: number; price: number; spec?: string }>;
  }>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${env.n8nBase}/webhook/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${path} 失敗 ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  notifyGroupCreated(payload: CreateGroupPayload) {
    return postJson<{ ok: boolean }>('group-cart/created', payload);
  },
  notifyGroupConfirmed(payload: ConfirmGroupPayload) {
    const liff_url = `https://liff.line.me/${env.liffId}?groupId=${payload.group_id}`;
    return postJson<{ ok: boolean }>('group-cart/confirmed', { ...payload, liff_url });
  },
  async fetchProducts(buildingId: string): Promise<Product[]> {
    const url = `${env.n8nBase}/webhook/group-cart/products?building=${encodeURIComponent(buildingId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`商品讀取失敗 ${res.status}`);
    const data = await res.json() as { products: Product[] };
    return data.products || [];
  }
};
