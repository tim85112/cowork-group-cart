import { useMemo } from 'react';
import { useGroupStore } from '@/store/useGroupStore';
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
  const addSoloItem = useGroupStore((s) => s.addSoloItem);

  const upsellItems = useMemo(() => {
    const candidates = products
      .filter((p) => UPSELL_LABELS.includes(p.food_label))
      .filter((p) => p.food_name !== excludeFoodName)
      .filter((p) => p.product_url);
    return shuffle(candidates).slice(0, 3);
  }, [products, excludeFoodName]);

  if (upsellItems.length === 0) return null;

  function handleQuickAdd(p: Product) {
    // 如果商品有規格，改為開啟商品 modal 讓使用者選
    const hasSpec1 = !!(p.spec1 && p.spec1.includes(','));
    const hasSpec2 = !!(p.spec2 && p.spec2.includes(','));
    if (hasSpec1 || hasSpec2) {
      onTapProduct(p);
      return;
    }
    addSoloItem({
      food_name: p.food_name,
      spec1: null,
      spec2: null,
      quantity: 1,
      unit_price: p.price,
      product_url: p.product_url,
      restaurant_name: p.restaurant_name
    });
  }

  return (
    <div className="mt-5 pt-4 border-t border-cream">
      <p className="font-bold text-sm mb-2">是否加購？</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {upsellItems.map((p) => (
          <div
            key={p.food_name + p.restaurant_name}
            className="shrink-0 w-32 bg-cream/40 rounded-xl p-2 border border-cream"
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
              <button
                onClick={() => handleQuickAdd(p)}
                className="w-6 h-6 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center active:scale-95"
                aria-label="加入"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
