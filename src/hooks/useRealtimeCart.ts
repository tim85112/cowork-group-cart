import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGroupStore } from '@/store/useGroupStore';
import type { CartItemRow, GroupRow } from '@/types/db';

export function useRealtimeCart(groupId: string | null): void {
  const setItems = useGroupStore((s) => s.setItems);
  const upsertItem = useGroupStore((s) => s.upsertItem);
  const removeItem = useGroupStore((s) => s.removeItem);
  const setGroup = useGroupStore((s) => s.setGroup);

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
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'groups', filter: `id=eq.${groupId}` },
        (payload) => {
          // 團主收單後 (status→closed) 即時同步給所有客戶端，
          // 避免別人還在試 +/- 或加品項撞 RLS
          setGroup(payload.new as GroupRow);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [groupId, setItems, upsertItem, removeItem, setGroup]);
}
