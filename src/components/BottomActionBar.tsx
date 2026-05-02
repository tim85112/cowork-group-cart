import { formatNTD } from '@/lib/format';

interface Props {
  itemCount: number;
  total: number;
  onCart: () => void;
  onCloseGroup?: () => void;
  showCloseGroup?: boolean;
}

export function BottomActionBar({ itemCount, total, onCart, onCloseGroup, showCloseGroup }: Props) {
  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-cream px-4 py-3 flex items-center gap-2 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <button onClick={onCart} className="flex-1 btn-ghost flex items-center justify-between">
        <span>
          已點 {itemCount} 件 · {formatNTD(total)}
        </span>
        <span>揪團訂單 ›</span>
      </button>
      {showCloseGroup && (
        <button onClick={onCloseGroup} className="btn-primary">
          收單
        </button>
      )}
    </div>
  );
}
