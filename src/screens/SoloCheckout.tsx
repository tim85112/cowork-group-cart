import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import { useGroupStore, selectSoloTotal } from '@/store/useGroupStore';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { closeWindow, sendSoloOrderFlex, isInClient } from '@/lib/liff';
import { DesktopSuccessModal } from '@/components/DesktopSuccessModal';
import { formatNTD, getSessionDate } from '@/lib/format';
import { env } from '@/lib/env';
import { loadSavedMemberInfo, saveMemberInfo, type SavedMemberInfo } from '@/lib/memberInfo';
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
  const [savedInfo, setSavedInfo] = useState<SavedMemberInfo | null>(null);
  const [showDesktopSuccess, setShowDesktopSuccess] = useState(false);

  useEffect(() => {
    if (!name && profile?.displayName) setName(profile.displayName);
  }, [profile, name]);

  useEffect(() => {
    setSavedInfo(loadSavedMemberInfo());
  }, []);

  function applySavedMemberInfo() {
    if (!savedInfo) return;
    if (savedInfo.name) setName(savedInfo.name);
    if (savedInfo.phone) setPhone(savedInfo.phone);
    if (savedInfo.taxId) {
      setTaxId(savedInfo.taxId);
    }
  }

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

    let step = '';
    try {
      step = '1.orders.insert';
      {
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
      }

      step = '2.order_items.insert';
      {
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
      }

      step = '3.rpc.get_next_pickup_number';
      const { data: pickupNum, error: rpcErr } = await supabase.rpc('get_next_pickup_number', {
        p_building_id: buildingId,
        p_session_date: sessionDate
      });
      if (rpcErr) throw rpcErr;

      step = '4.orders.update.pickup_number';
      {
        const { error: updErr } = await supabase
          .from('orders')
          .update({ pickup_number: pickupNum })
          .eq('id', orderId);
        if (updErr) throw updErr;
      }

      // 先呼叫 n8n（觸發 Playwright 代填），確認成功後再送 Flex；
      // 避免 n8n 沒接到但用戶以為已下單
      step = '5.api.notifyIndividualConfirmed';
      await api.notifyIndividualConfirmed({
        group_id: orderId,
        order_type: 'solo',
        owner_user_id: profile.userId,
        total_amount: total,
        pickup_number: pickupNum ?? null,
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

      step = '6.sendSoloOrderFlex';
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

      step = '7.closeWindow';
      saveMemberInfo({
        name: name.trim(),
        phone: phone.trim(),
        taxId: trimmedTaxId ?? ''
      });
      clearSoloCart();
      if (isInClient()) {
        await closeWindow();
      } else {
        setShowDesktopSuccess(true);
      }
    } catch (e) {
      const msg = (e as Error).message || '送出訂單失敗';
      setError(`[${step}] ${msg}`);
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
        {savedInfo && (
          <button
            type="button"
            onClick={applySavedMemberInfo}
            className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg border-2 border-primary text-primary bg-white text-base font-bold active:bg-primary/5"
          >
            帶入會員資料
          </button>
        )}

        <div>
          <label className="block text-base font-bold mb-1.5">
            <span className="text-red-500">*</span>訂購人
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-base"
            placeholder="姓名"
          />
        </div>

        <div>
          <label className="block text-base font-bold mb-1.5">
            <span className="text-red-500">*</span>手機號碼
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-base"
            placeholder="09xxxxxxxx 或 +886912345678"
          />
        </div>

        <div>
          <label className="block text-base font-bold mb-1.5">
            備註（最多 {NOTES_MAX} 字）
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
            rows={3}
            maxLength={NOTES_MAX}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-base resize-none"
            placeholder="如有特殊需求請填寫"
          />
          <p className="text-xs text-gray-400 text-right mt-0.5">
            {notes.length} / {NOTES_MAX}
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={wantReceipt}
            onChange={(e) => setWantReceipt(e.target.checked)}
            className="w-5 h-5"
          />
          <span className="text-base font-bold">索取收據</span>
        </label>

        <div>
          <label className="block text-base font-bold mb-1.5">
            公司統編 <span className="text-gray-400 font-normal">（選填）</span>
          </label>
          <input
            type="text"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value.replace(/\D/g, '').slice(0, 8))}
            inputMode="numeric"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-base"
            placeholder="8 位數字"
          />
        </div>

        <div>
          <label className="block text-base font-bold mb-2">
            <span className="text-red-500">*</span>付款方式
          </label>
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                  className="w-4 h-4"
                />
                <span className="text-base">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-cream">
          <div className="flex items-center justify-between">
            <span className="text-base text-gray-500">訂單金額</span>
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

      {showDesktopSuccess && <DesktopSuccessModal />}
    </div>
  );
}
