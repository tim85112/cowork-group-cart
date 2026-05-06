import { useState } from 'react';
import { useGroupStore, selectGroupTotal } from '@/store/useGroupStore';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { closeWindow } from '@/lib/liff';
import { MemberSection } from '@/components/MemberSection';
import { formatNTD } from '@/lib/format';
import type { CartItemRow } from '@/types/db';

export function ReviewClose() {
  const group = useGroupStore((s) => s.group);
  const items = useGroupStore((s) => s.items);
  const total = useGroupStore(selectGroupTotal);
  const setScreen = useGroupStore((s) => s.setScreen);
  const setError = useGroupStore((s) => s.setError);
  const setGroup = useGroupStore((s) => s.setGroup);
  const [submitting, setSubmitting] = useState(false);

  if (!group) return null;

  // 依 user 分組
  const grouped = new Map<string, { user_name: string; items: CartItemRow[]; isOwner: boolean }>();
  for (const it of items) {
    const isOwner = it.user_id === group.owner_user_id;
    if (!grouped.has(it.user_id)) {
      grouped.set(it.user_id, { user_name: it.user_name, items: [], isOwner });
    }
    grouped.get(it.user_id)!.items.push(it);
  }
  const members = Array.from(grouped.values()).sort(
    (a, b) => (b.isOwner ? 1 : 0) - (a.isOwner ? 1 : 0)
  );

  async function handleConfirm() {
    if (!group) return;
    setSubmitting(true);
    try {
      const order_summary = members.map((m) => ({
        user_name: m.user_name,
        is_owner: m.isOwner,
        subtotal: m.items.reduce((s, i) => s + i.unit_price * i.quantity, 0),
        items: m.items.map((i) => ({
          food_name: i.food_name,
          quantity: i.quantity,
          price: i.unit_price,
          spec: [i.spec1, i.spec2].filter(Boolean).join(' / ') || undefined
        }))
      }));

      const cart_items = items.map((i) => ({
        food_name: i.food_name,
        spec1: i.spec1,
        spec2: i.spec2,
        quantity: i.quantity,
        unit_price: i.unit_price,
        product_url: i.product_url,
        user_name: i.user_name
      }));

      await api.notifyGroupConfirmed({
        group_id: group.id,
        owner_user_id: group.owner_user_id,
        total_amount: total,
        order_summary,
        cart_items,
        recipient: {
          name: group.owner_name,
          phone: group.owner_phone
        }
      });

      const { data, error } = await supabase
        .from('groups')
        .update({ status: 'closed', closed_at: new Date().toISOString(), total_amount: total })
        .eq('id', group.id)
        .select()
        .single();
      if (error) throw error;
      setGroup(data);

      await closeWindow();
    } catch (e) {
      setError((e as Error).message || '確認訂單失敗');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full bg-cream pb-32">
      <header className="bg-primary text-white px-4 py-3">
        <h1 className="font-bold">確認訂單</h1>
        <p className="text-xs opacity-80">收單後不可再修改</p>
      </header>

      <main className="px-4 py-3 space-y-3">
        {members.map((m) => (
          <MemberSection
            key={m.user_name + (m.isOwner ? '_o' : '')}
            userName={m.user_name}
            isOwner={m.isOwner}
            items={m.items}
          />
        ))}
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-cream px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">群組總計</span>
          <span className="text-2xl font-bold text-primary">{formatNTD(total)}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setScreen('menu')}
            className="btn-ghost flex-1"
            disabled={submitting}
          >
            返回修改
          </button>
          <button onClick={handleConfirm} className="btn-primary flex-1" disabled={submitting}>
            {submitting ? '確認中…' : `確認訂單 ${formatNTD(total)}`}
          </button>
        </div>
      </footer>
    </div>
  );
}
