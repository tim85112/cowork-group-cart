import { formatNTD } from '@/lib/format';

const PICKUP_TIME = '12:00~12:30';
const PICKUP_LOCATION = '取餐處：順天經貿大樓 1F 後門';
const PICKUP_MAP_URL =
  'https://lh3.googleusercontent.com/d/1Au_PvnKc3sSObrC3_PNVJ9VdTRyxX5xp=w800';

const PAYMENT_LABELS: Record<string, string> = {
  Pay_ApplePay: 'Apple Pay',
  Pay_GooglePay: 'Google Pay',
  Pay_CREDIT: '信用卡'
};

interface Props {
  total: number;
  paymentMethod: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SoloConfirmDialog({ total, paymentMethod, submitting, onCancel, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      onClick={submitting ? undefined : onCancel}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center mb-3">
            <span className="text-2xl text-gray-400">i</span>
          </div>
          <h2 className="font-bold text-lg mb-3">您即將送出訂單</h2>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">付款金額</span>
            <span className="font-bold text-primary">{formatNTD(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">付款方式</span>
            <span>{PAYMENT_LABELS[paymentMethod] ?? paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">取餐時間</span>
            <span>{PICKUP_TIME}</span>
          </div>
          <div className="pt-1.5">
            <p className="text-gray-500">{PICKUP_LOCATION}</p>
            <img
              src={PICKUP_MAP_URL}
              alt="取餐地點地圖"
              className="w-full rounded-lg mt-2 border border-cream"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1" disabled={submitting}>
            取消
          </button>
          <button onClick={onConfirm} className="btn-primary flex-1" disabled={submitting}>
            {submitting ? '送出中…' : '確認'}
          </button>
        </div>
      </div>
    </div>
  );
}
