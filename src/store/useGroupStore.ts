import { create } from 'zustand';
import type { GroupRow, CartItemRow } from '@/types/db';
import type { Profile } from '@/lib/liff';

export type Screen = 'create' | 'share' | 'menu' | 'review';

interface GroupState {
  profile: Profile | null;
  group: GroupRow | null;
  items: CartItemRow[];
  screen: Screen;
  loading: boolean;
  error: string | null;

  setProfile: (p: Profile | null) => void;
  setGroup: (g: GroupRow | null) => void;
  setItems: (rows: CartItemRow[]) => void;
  upsertItem: (row: CartItemRow) => void;
  removeItem: (id: string) => void;
  setScreen: (s: Screen) => void;
  setLoading: (b: boolean) => void;
  setError: (e: string | null) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  profile: null,
  group: null,
  items: [],
  screen: 'create',
  loading: false,
  error: null,

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
  setError: (e) => set({ error: e })
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
