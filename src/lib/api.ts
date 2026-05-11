import { env } from './env';
import { normalizeImageUrl } from './imageUrl';
import type { Product } from '@/types/product';

interface CreateGroupPayload {
  group_id: string;
  owner_name: string;
  owner_phone: string;
  owner_user_id: string;
  building?: string;
  created_at?: string;
}

interface CartItemSummary {
  food_name: string;
  spec1: string | null;
  spec2: string | null;
  quantity: number;
  unit_price: number;
  product_url: string | null;
  user_name: string;
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
  cart_items: CartItemSummary[];
  recipient: {
    name: string;
    phone: string;
    tax_id?: string | null;
  };
  payment_method?: string;
}

interface IndividualConfirmPayload {
  group_id: string;            // FastAPI 追蹤 ID，使用 orders.id
  order_type: 'solo';
  owner_user_id: string;
  total_amount: number;
  cart_items: CartItemSummary[];
  recipient: {
    name: string;
    phone: string;
    tax_id?: string | null;
    notes?: string | null;
    want_receipt?: boolean;
  };
  payment_method: string;
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
  notifyIndividualConfirmed(payload: IndividualConfirmPayload) {
    return postJson<{ ok: boolean }>('group-cart/confirmed', payload);
  },
  async fetchProducts(buildingId: string): Promise<Product[]> {
    const url = `${env.n8nBase}/webhook/group-cart/products?building=${encodeURIComponent(buildingId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`商品讀取失敗 ${res.status}`);
    const data = await res.json() as { products: Product[] };
    return (data.products || []).map((p) => ({ ...p, image_url: normalizeImageUrl(p.image_url) }));
  }
};
