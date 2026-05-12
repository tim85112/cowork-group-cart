import { useState } from 'react';
import { useGroupStore, selectGroupTotal } from '@/store/useGroupStore';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { closeWindow, sendOrderFlex, isInClient } from '@/lib/liff';
import { MemberSection } from '@/components/MemberSection';
import { DesktopSuccessModal } from '@/components/DesktopSuccessModal';
import { formatNTD, getSessionDate } from '@/lib/format';
import type { CartItemRow } from '@/types/db';

function buildDisplayName(food: string, spec1: string | null, spec2: string | null): string {
  const spec = [spec1, spec2].filter(Boolean).join(', ');
  return spec ? `${food}（${spec}）` : food;
}

export function ReviewClose() {
  const group = useGroupStore((s) => s.group);
  const items = useGroupStore((s) => s.items);
  const total = useGroupStore(selectGroupTotal);
  const setScreen = useGroupStore((s) => s.setScreen);
  const setError = useGroupStore((s) => s.setError);
  const setGroup = useGroupStore((s) => s.setGroup);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Pay_ApplePay' | 'Pay_GooglePay' | 'Pay_CREDIT'>('Pay_ApplePay');
  const [showDesktopSuccess, setShowDesktopSuccess] = useState(false);

  const PAYMENT_OPTIONS = [
    { value: 'Pay_ApplePay' as const, label: 'Apple Pay' },
    { value: 'Pay_GooglePay' as const, label: 'Google Pay' },
    { value: 'Pay_CREDIT' as const,   label: '信用卡' },
  ];

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

      const sessionDate = getSessionDate();

      // 取得當日流水號（每棟商辦獨立，11:30 重置）
      const { data: pickupNum, error: rpcError } = await supabase.rpc('get_next_pickup_number', {
        p_building_id: group.building_id ?? 'B01',
        p_session_date: sessionDate,
      });
      if (rpcError) throw rpcError;

      // 先關閉群組，確保 n8n reply 查 Supabase 時資料已存在
      const { data, error } = await supabase
        .from('groups')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          total_amount: total,
          pickup_number: pickupNum,
        })
        .eq('id', group.id)
        .select()
        .single();
      if (error) throw error;
      setGroup(data);

      // 雙寫 orders + order_items（揪團也進統一訂單表）
      try {
        await supabase.from('orders').insert({
          id: group.id,
          order_type: 'group',
          building_id: group.building_id ?? 'B01',
          session_date: sessionDate,
          pickup_number: pickupNum,
          status: 'pending',
          payment_status: 'unpaid',
          customer_name: group.owner_name,
          customer_phone: group.owner_phone,
          customer_email: null,
          customer_notes: null,
          want_receipt: false,
          tax_id: group.tax_id,
          payment_method: paymentMethod,
          items_subtotal: total,
          net_amount: total
        });
        const orderItemRows = items.map((i, idx) => ({
          order_id: group.id,
          line_number: idx + 1,
          member_name: i.user_name,
          item_type: 'product',
          display_name: buildDisplayName(i.food_name, i.spec1, i.spec2),
          food_name: i.food_name,
          spec: [i.spec1, i.spec2].filter(Boolean).join(', ') || null,
          restaurant_name: null,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.unit_price * i.quantity,
          product_url: i.product_url
        }));
        await supabase.from('order_items').insert(orderItemRows);
      } catch (dualErr) {
        // 雙寫失敗不阻斷主流程，僅記錄到 console（未來後台會用到）
        console.error('orders 雙寫失敗：', dualErr);
      }

      // 觸發 Playwright 自動結帳（n8n 不再 push 訂單確認訊息）
      await api.notifyGroupConfirmed({
        group_id: group.id,
        owner_user_id: group.owner_user_id,
        total_amount: total,
        order_summary,
        cart_items,
        recipient: {
          name: group.owner_name,
          phone: group.owner_phone,
          tax_id: group.tax_id ?? null
        },
        payment_method: paymentMethod,
      });

      await sendOrderFlex(total, String(pickupNum ?? '?'), members);

      if (isInClient()) {
        await closeWindow();
      } else {
        // 桌機 / 外部瀏覽器：沒 LINE chat 可關閉，跳浮動提醒
        setShowDesktopSuccess(true);
      }
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
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">付款方式</p>
          <div className="flex gap-4">
            {PAYMENT_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                  disabled={submitting}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
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

      {showDesktopSuccess && <DesktopSuccessModal />}
    </div>
  );
}
