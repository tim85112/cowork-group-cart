export type GroupStatus = 'open' | 'closed' | 'cancelled';

export interface GroupRow {
  id: string;
  building_id: string;
  owner_user_id: string;
  owner_name: string;
  owner_phone: string;
  status: GroupStatus;
  created_at: string;
  closed_at: string | null;
  total_amount: number | null;
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
