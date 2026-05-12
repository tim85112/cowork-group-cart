import { env } from './env';
import { normalizeImageUrl } from './imageUrl';
import { isInClient } from './liff';
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
  const url = `${env.n8nBase}/webhook/${path}`;
  // 預先驗證 URL（iOS WebKit 對 URL 較嚴格）
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new Error(`bad URL: ${url} (${(e as Error).message})`);
  }

  let res: Response;
  try {
    res = await fetch(parsed.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body)
    });
  } catch (netErr) {
    throw new Error(`fetch fail: ${(netErr as Error).message}`);
  }

  if (!res.ok) {
    let preview = '';
    try {
      preview = (await res.text()).slice(0, 150);
    } catch {}
    throw new Error(`${path} status=${res.status} ${preview}`);
  }

  // 不要求 JSON 回應；n8n 有時 respondImmediately 會回空 body
  let text = '';
  try {
    text = await res.text();
  } catch {
    return {} as T;
  }
  if (!text || !text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export const api = {
  notifyGroupCreated(payload: CreateGroupPayload) {
    return postJson<{ ok: boolean }>('group-cart/created', payload);
  },
  notifyGroupConfirmed(payload: ConfirmGroupPayload) {
    const liff_url = `https://liff.line.me/${env.liffId}?groupId=${payload.group_id}`;
    // sent_from：判斷 LIFF 端是否已用 liff.sendMessages 發 Flex。
    // 'lineApp' → LIFF 自己會發，n8n 不再 Push；'browser' → 桌機，n8n 補 Push
    const sent_from: 'lineApp' | 'browser' = isInClient() ? 'lineApp' : 'browser';
    // 不再送 ok_to_run；n8n「Dry-run validator」會根據 cart_items + recipient 自己 set
    return postJson<{ ok: boolean }>('group-cart/confirmed', { ...payload, liff_url, sent_from });
  },
  notifyIndividualConfirmed(payload: IndividualConfirmPayload) {
    // n8n「驗證 body」要求 order_summary 必須是陣列；個人散單就是一個成員，模擬同樣結構
    const order_summary = [
      {
        user_name: payload.recipient.name,
        is_owner: true,
        subtotal: payload.total_amount,
        items: payload.cart_items.map((i) => ({
          food_name: i.food_name,
          quantity: i.quantity,
          price: i.unit_price,
          spec: [i.spec1, i.spec2].filter(Boolean).join(' / ') || undefined
        }))
      }
    ];
    const sent_from: 'lineApp' | 'browser' = isInClient() ? 'lineApp' : 'browser';
    return postJson<{ ok: boolean }>('group-cart/confirmed', {
      ...payload,
      order_summary,
      sent_from
      // 不需要送 ok_to_run，n8n「Dry-run validator」會根據 cart_items + recipient 自己 set
    });
  },
  async fetchProducts(buildingId: string): Promise<Product[]> {
    const url = `${env.n8nBase}/webhook/group-cart/products?building=${encodeURIComponent(buildingId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`商品讀取失敗 ${res.status}`);
    const data = await res.json() as { products: Product[] };
    return (data.products || []).map((p) => ({ ...p, image_url: normalizeImageUrl(p.image_url) }));
  }
};
