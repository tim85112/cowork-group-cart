export type GroupStatus = 'open' | 'closed' | 'cancelled';

export interface GroupRow {
  id: string;
  building_id: string;
  owner_user_id: string;
  owner_name: string;
  owner_phone: string;
  tax_id: string | null;
  status: GroupStatus;
  created_at: string;
  closed_at: string | null;
  total_amount: number | null;
  pickup_number: number | null;
}

export interface CartItemRow {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  food_name: string;
  spec1: string | null;
  spec2: string | null;
  quantity: number;
  unit_price: number;
  product_url: string | null;
  created_at: string;
}

export type OrderType = 'solo' | 'group';
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderRow {
  id: string;
  order_type: OrderType;
  building_id: string;
  session_date: string;
  pickup_number: number | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_notes: string | null;
  want_receipt: boolean;
  tax_id: string | null;
  payment_method: string | null;
  delivery_person: string | null;
  promo_code: string | null;
  items_subtotal: number;
  delivery_fee: number;
  delivery_fee_by_consumer: boolean;
  payment_fee: number;
  payment_fee_by_consumer: boolean;
  net_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  line_number: number;
  member_name: string | null;
  item_type: 'product' | 'discount' | 'refund';
  display_name: string;
  food_name: string;
  spec: string | null;
  restaurant_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_url: string | null;
  created_at: string;
}

// 前端本地購物車（solo 模式專用，結帳前不進 Supabase）
export interface SoloCartItem {
  id: string;
  food_name: string;
  spec1: string | null;
  spec2: string | null;
  quantity: number;
  unit_price: number;
  product_url: string | null;
  restaurant_name: string | null;
}
