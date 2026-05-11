import { useGroupStore, selectSoloTotal } from '@/store/useGroupStore';
import { formatNTD } from '@/lib/format';

interface Props {
  onClose: () => void;
  onCheckout: () => void;
}

export function CartModal({ onClose, onCheckout }: Props) {
  const soloItems = useGroupStore((s) => s.soloItems);
  const total = useGroupStore(selectSoloTotal);
  const updateSoloQty = useGroupStore((s) => s.updateSoloQty);

  const totalItems = soloItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow border border-gray-200 text-gray-500"
          aria-label="關閉"
        >
          ✕
        </button>

        <header className="px-6 pt-6 pb-3 text-center border-b border-cream">
          <h2 className="font-bold text-lg">訂購明細</h2>
          <p className="text-xs text-gray-500 mt-1">
            目前選購 <span className="text-primary font-bold">{soloItems.length}</span> 項商品
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {soloItems.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">尚未選購任何商品</div>
          )}

          {soloItems.map((item) => {
            const spec = [item.spec1, item.spec2].filter(Boolean).join(' / ');
            const subtotal = item.unit_price * item.quantity;
            return (
              <div key={item.id} className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm">{item.food_name}</p>
                    {spec && <p className="text-xs text-gray-500">{spec}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatNTD(item.unit_price)}</p>
                  </div>
                  <p className="font-bold text-sm whitespace-nowrap">{formatNTD(subtotal)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSoloQty(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 active:scale-95"
                  >
                    −
                  </button>
                  <span className="min-w-[2.5rem] text-center font-medium border border-gray-200 rounded px-2 py-0.5 text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateSoloQty(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 bg-cream/50 border-t border-cream text-center text-sm">
          總計 <span className="font-bold">{totalItems}</span> 項 / 共{' '}
          <span className="font-bold text-primary">{formatNTD(total)}</span>
        </div>

        <div className="px-5 py-4 flex gap-2 border-t border-cream">
          <button onClick={onClose} className="btn-ghost flex-1">
            回目錄
          </button>
          <button
            onClick={onCheckout}
            className="btn-primary flex-1 disabled:opacity-50"
            disabled={soloItems.length === 0}
          >
            確認訂單
          </button>
        </div>
      </div>
    </div>
  );
}
