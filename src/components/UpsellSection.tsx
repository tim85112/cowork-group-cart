import { useMemo } from 'react';
import { formatNTD } from '@/lib/format';
import type { Product } from '@/types/product';

const UPSELL_LABELS = ['駝小吃', '駝甜點', '駝飲料'];

interface Props {
  products: Product[];
  excludeFoodName: string;
  onTapProduct: (p: Product) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function UpsellSection({ products, excludeFoodName, onTapProduct }: Props) {
  const upsellItems = useMemo(() => {
    const candidates = products
      .filter((p) => UPSELL_LABELS.includes(p.food_label))
      .filter((p) => p.food_name !== excludeFoodName)
      .filter((p) => p.product_url);
    return shuffle(candidates).slice(0, 3);
  }, [products, excludeFoodName]);

  if (upsellItems.length === 0) return null;

  return (
    <div className="mt-5 pt-4 border-t border-cream">
      <p className="font-bold text-sm mb-2">是否加購？</p>
      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {upsellItems.map((p) => (
          <button
            key={p.food_name + p.restaurant_name}
            type="button"
            onClick={() => onTapProduct(p)}
            className="shrink-0 w-32 bg-cream/40 rounded-xl p-2 border border-cream text-left active:scale-95 transition-transform"
            style={{ touchAction: 'manipulation' }}
          >
            {p.image_url && (
              <img
                src={p.image_url}
                alt={p.food_name}
                className="w-full aspect-square object-cover rounded-lg mb-1.5"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
            <p className="text-xs font-medium truncate" title={p.food_name}>
              {p.food_name}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-primary font-bold">{formatNTD(p.price)}</span>
              <span
                className="w-7 h-7 rounded-full bg-primary text-white text-base font-bold flex items-center justify-center"
                aria-hidden="true"
              >
                +
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
