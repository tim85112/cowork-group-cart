import type { CartItemRow } from '@/types/db';
import { formatNTD } from '@/lib/format';
import { FoodNameLabel } from './FoodNameLabel';

interface Props {
  userName: string;
  isOwner: boolean;
  items: CartItemRow[];
  onRemove?: (id: string) => void;
}

export function MemberSection({ userName, isOwner, items, onRemove }: Props) {
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  return (
    <section className="card p-3">
      <header className="flex items-center justify-between mb-2">
        <h3 className="font-bold">
          {userName}
          {isOwner && (
            <span className="ml-2 text-xs bg-accent text-primary px-2 py-0.5 rounded-full">
              團主
            </span>
          )}
        </h3>
        <span className="text-sm text-gray-500">小計 {formatNTD(subtotal)}</span>
      </header>
      <ul className="space-y-1.5">
        {items.map((it) => {
          const spec = [it.spec1, it.spec2].filter(Boolean).join(' / ');
          return (
            <li key={it.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  <FoodNameLabel name={it.food_name} />
                  <span className="ml-1">×{it.quantity}</span>
                </p>
                {spec && <p className="text-xs text-gray-400 truncate">{spec}</p>}
              </div>
              <span className="text-gray-700 shrink-0">
                {formatNTD(it.unit_price * it.quantity)}
              </span>
              {onRemove && (
                <button
                  onClick={() => onRemove(it.id)}
                  className="text-xs text-gray-400 active:text-primary px-1"
                  aria-label="移除"
                >
                  ✕
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
