import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import { useGroupStore, selectSoloTotal } from '@/store/useGroupStore';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { closeWindow, sendSoloOrderFlex } from '@/lib/liff';
import { formatNTD, getSessionDate } from '@/lib/format';
import { env } from '@/lib/env';
import { SoloConfirmDialog } from '@/components/SoloConfirmDialog';

const PAYMENT_OPTIONS = [
  { value: 'Pay_ApplePay' as const, label: 'Apple Pay' },
  { value: 'Pay_GooglePay' as const, label: 'Google Pay' },
  { value: 'Pay_CREDIT' as const, label: '信用卡' }
];

type PaymentValue = (typeof PAYMENT_OPTIONS)[number]['value'];

const NOTES_MAX = 50;
const PHONE_RE = /^(\+886|0)?9\d{8}$/;

function buildDisplayName(foodName: string, spec1: string | null, spec2: string | null) {
  const spec = [spec1, spec2].filter(Boolean).join(', ');
  return spec ? `${foodName}（${spec}）` : foodName;
}

export function SoloCheckout() {
  const profile = useGroupStore((s) => s.profile);
  const soloItems = useGroupStore((s) => s.soloItems);
  const total = useGroupStore(selectSoloTotal);
  const setScreen = useGroupStore((s) => s.setScreen);
  const setError = useGroupStore((s) => s.setError);
  const clearSoloCart = useGroupStore((s) => s.clearSoloCart);

  const [name, setName] = useState(profile?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [wantReceipt, setWantReceipt] = useState(false);
  const [taxId, setTaxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentValue>('Pay_ApplePay');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!name && profile?.displayName) setName(profile.displayName);
  }, [profile, name]);

  // 沒有商品就跳回 menu
  useEffect(() => {
    if (soloItems.length === 0 && !submitting) setScreen('menu');
  }, [soloItems.length, submitting, setScreen]);

  const phoneOk = PHONE_RE.test(phone.trim());
  const nameOk = name.trim().length > 0;
  const taxIdOk = !taxId || /^\d{8}$/.test(taxId.trim());
  const canSubmit = nameOk && phoneOk && taxIdOk && soloItems.length > 0;

  function handleGotoConfirm() {
    if (!canSubmit) {
      if (!nameOk) setError('請填寫訂購人姓名');
      else if (!phoneOk) setError('請填寫正確的手機號碼');
      else if (!taxIdOk) setError('統編需為 8 位數字');
      return;
    }
    setShowConfirm(true);
  }

  async function handleSubmit() {
    if (!profile) {
      setError('LINE 登入狀態異常');
      return;
    }
    setSubmitting(true);
    const orderId = nanoid(10);
    const sessionDate = getSessionDate();
    const buildingId = env.buildingId;
    const trimmedNotes = notes.trim() || null;
    const trimmedTaxId = taxId.trim() || null;

    try {
      // 1. 建立 orders（status='pending'）
      const { error: insErr } = await supabase.from('orders').insert({
        id: orderId,
        order_type: 'solo',
        building_id: buildingId,
        session_date: sessionDate,
        status: 'pending',
        payment_status: 'unpaid',
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: null,
        customer_notes: trimmedNotes,
        want_receipt: wantReceipt,
        tax_id: trimmedTaxId,
        payment_method: paymentMethod,
        items_subtotal: total,
        net_amount: total
      });
      if (insErr) throw insErr;

      // 2. 寫入 order_items
      const rows = soloItems.map((item, idx) => ({
        order_id: orderId,
        line_number: idx + 1,
        member_name: null,
        item_type: 'product',
        display_name: buildDisplayName(item.food_name, item.spec1, item.spec2),
        food_name: item.food_name,
        spec: [item.spec1, item.spec2].filter(Boolean).join(', ') || null,
        restaurant_name: item.restaurant_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
        product_url: item.product_url
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(rows);
      if (itemsErr) throw itemsErr;

      // 3. 取得流水號（與揪團共用 daily_counters）
      const { data: pickupNum, error: rpcErr } = await supabase.rpc('get_next_pickup_number', {
        p_building_id: buildingId,
        p_session_date: sessionDate
      });
      if (rpcErr) throw rpcErr;

      // 4. 更新 orders.pickup_number
      const { error: updErr } = await supabase
        .from('orders')
        .update({ pickup_number: pickupNum })
        .eq('id', orderId);
      if (updErr) throw updErr;

      // 5. 寄送橘色 Flex（含取餐碼）
      await sendSoloOrderFlex(
        total,
        String(pickupNum ?? '?'),
        name.trim(),
        soloItems.map((i) => ({
          food_name: i.food_name,
          spec1: i.spec1,
          spec2: i.spec2,
          unit_price: i.unit_price,
          quantity: i.quantity
        }))
      );

      // 6. 觸發 n8n / FastAPI 代填
      await api.notifyIndividualConfirmed({
        group_id: orderId,
        order_type: 'solo',
        owner_user_id: profile.userId,
        total_amount: total,
        cart_items: soloItems.map((i) => ({
          food_name: i.food_name,
          spec1: i.spec1,
          spec2: i.spec2,
          quantity: i.quantity,
          unit_price: i.unit_price,
          product_url: i.product_url,
          user_name: name.trim()
        })),
        recipient: {
          name: name.trim(),
          phone: phone.trim(),
          tax_id: trimmedTaxId,
          notes: trimmedNotes,
          want_receipt: wantReceipt
        },
        payment_method: paymentMethod
      });

      clearSoloCart();
      await closeWindow();
    } catch (e) {
      setError((e as Error).message || '送出訂單失敗');
      setSubmitting(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="min-h-full bg-cream pb-32">
      <header className="bg-primary text-white px-4 py-3">
        <h1 className="font-bold">請填寫訂購資訊</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        <div>
          <label className="block text-xs font-bold mb-1">
            <span className="text-red-500">*</span>訂購人
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
            placeholder="姓名"
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">
            <span className="text-red-500">*</span>手機號碼
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
            placeholder="09xxxxxxxx 或 +886912345678"
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">
            備註（最多 {NOTES_MAX} 字）
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
            rows={3}
            maxLength={NOTES_MAX}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm resize-none"
            placeholder="如有特殊需求請填寫"
          />
          <p className="text-[11px] text-gray-400 text-right mt-0.5">
            {notes.length} / {NOTES_MAX}
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={wantReceipt}
            onChange={(e) => setWantReceipt(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">索取收據</span>
        </label>

        <div>
          <label className="block text-xs font-bold mb-1">
            公司統編 <span className="text-gray-400 font-normal">（選填）</span>
          </label>
          <input
            type="text"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value.replace(/\D/g, '').slice(0, 8))}
            inputMode="numeric"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
            placeholder="8 位數字"
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-2">
            <span className="text-red-500">*</span>付款方式
          </label>
          <div className="space-y-1.5">
            {PAYMENT_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-cream">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">訂單金額</span>
            <span className="font-bold text-primary text-lg">{formatNTD(total)}</span>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-cream px-4 py-3 flex gap-2 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <button onClick={() => setScreen('menu')} className="btn-ghost flex-1" disabled={submitting}>
          上一步
        </button>
        <button onClick={handleGotoConfirm} className="btn-primary flex-1" disabled={submitting}>
          前往結帳
        </button>
      </footer>

      {showConfirm && (
        <SoloConfirmDialog
          total={total}
          paymentMethod={paymentMethod}
          submitting={submitting}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleSubmit}
        />
      )}
    </div>
  );
}
