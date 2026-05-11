import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { GroupRow, CartItemRow, SoloCartItem } from '@/types/db';
import type { Profile } from '@/lib/liff';

export type Screen = 'create' | 'share' | 'menu' | 'review' | 'solo-checkout' | 'upsell';

interface GroupState {
  profile: Profile | null;
  group: GroupRow | null;
  items: CartItemRow[];
  screen: Screen;
  loading: boolean;
  error: string | null;

  // 個人散單
  soloMode: boolean;
  soloItems: SoloCartItem[];

  setProfile: (p: Profile | null) => void;
  setGroup: (g: GroupRow | null) => void;
  setItems: (rows: CartItemRow[]) => void;
  upsertItem: (row: CartItemRow) => void;
  removeItem: (id: string) => void;
  setScreen: (s: Screen) => void;
  setLoading: (b: boolean) => void;
  setError: (e: string | null) => void;

  setSoloMode: (v: boolean) => void;
  addSoloItem: (item: Omit<SoloCartItem, 'id'>) => void;
  updateSoloQty: (id: string, qty: number) => void;
  clearSoloCart: () => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  profile: null,
  group: null,
  items: [],
  screen: 'create',
  loading: false,
  error: null,

  soloMode: false,
  soloItems: [],

  setProfile: (p) => set({ profile: p }),
  setGroup: (g) => set({ group: g }),
  setItems: (rows) => set({ items: rows }),
  upsertItem: (row) =>
    set((s) => {
      const idx = s.items.findIndex((i) => i.id === row.id);
      if (idx === -1) return { items: [...s.items, row] };
      const copy = s.items.slice();
      copy[idx] = row;
      return { items: copy };
    }),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  setScreen: (s) => set({ screen: s }),
  setLoading: (b) => set({ loading: b }),
  setError: (e) => set({ error: e }),

  setSoloMode: (v) => set({ soloMode: v }),
  addSoloItem: (item) =>
    set((s) => {
      // 相同 food_name + spec1 + spec2 合併數量
      const idx = s.soloItems.findIndex(
        (i) => i.food_name === item.food_name && i.spec1 === item.spec1 && i.spec2 === item.spec2
      );
      if (idx >= 0) {
        const copy = s.soloItems.slice();
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity };
        return { soloItems: copy };
      }
      return { soloItems: [...s.soloItems, { ...item, id: nanoid(8) }] };
    }),
  updateSoloQty: (id, qty) =>
    set((s) => {
      if (qty <= 0) return { soloItems: s.soloItems.filter((i) => i.id !== id) };
      return {
        soloItems: s.soloItems.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
      };
    }),
  clearSoloCart: () => set({ soloItems: [] })
}));

export function selectIsHost(s: GroupState): boolean {
  return !!s.profile && !!s.group && s.profile.userId === s.group.owner_user_id;
}

export function selectMyItems(s: GroupState): CartItemRow[] {
  if (!s.profile) return [];
  return s.items.filter((i) => i.user_id === s.profile!.userId);
}

export function selectGroupTotal(s: GroupState): number {
  return s.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
}

export function selectSoloTotal(s: GroupState): number {
  return s.soloItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
}

export function selectSoloCount(s: GroupState): number {
  return s.soloItems.reduce((sum, i) => sum + i.quantity, 0);
}
