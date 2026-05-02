import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGroupStore } from '@/store/useGroupStore';
import type { CartItemRow } from '@/types/db';

export function useRealtimeCart(groupId: string | null): void {
  const setItems = useGroupStore((s) => s.setItems);
  const upsertItem = useGroupStore((s) => s.upsertItem);
  const removeItem = useGroupStore((s) => s.removeItem);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      if (!cancelled && !error && data) setItems(data as CartItemRow[]);
    })();

    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: `group_id=eq.${groupId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as Partial<CartItemRow>;
            if (old.id) removeItem(old.id);
          } else {
            const row = payload.new as CartItemRow;
            upsertItem(row);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [groupId, setItems, upsertItem, removeItem]);
}
