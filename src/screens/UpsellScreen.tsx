import { useEffect, useMemo, useState } from 'react';
import { useGroupStore, selectSoloTotal } from '@/store/useGroupStore';
import { useProducts } from '@/hooks/useProducts';
import { env } from '@/lib/env';
import { formatNTD } from '@/lib/format';
import { FoodNameLabel } from '@/components/FoodNameLabel';
import { ItemModal } from './ItemModal';
import type { Product } from '@/types/product';

const UPSELL_LABELS = ['駝小吃', '駝甜點', '駝飲料'];
const UPSELL_MAX = 6;

function shuffle<T>(arr: T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function UpsellScreen() {
  const { products, loading } = useProducts(env.buildingId);
  const soloItems = useGroupStore((s) => s.soloItems);
  const total = useGroupStore(selectSoloTotal);
  const setScreen = useGroupStore((s) => s.setScreen);

  const [tappedProduct, setTappedProduct] = useState<Product | null>(null);

  // 隨機 6 個加購商品。故意只依賴 products 與 soloItems 第一次的 snapshot，
  // 避免使用者加完一個商品 -> soloItems 變動 -> 整頁洗牌（很糟的 UX）
  const initialInCart = useMemo(
    () => new Set(soloItems.map((i) => i.food_name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const upsellItems = useMemo(() => {
    const candidates = products
      .filter((p) => UPSELL_LABELS.includes(p.food_label))
      .filter((p) => !initialInCart.has(p.food_name))
      .filter((p) => p.product_url);
    return shuffle(candidates).slice(0, UPSELL_MAX);
  }, [products, initialInCart]);

  // 沒商品 / 沒可加購選項 → 自動跳到結帳
  useEffect(() => {
    if (!loading && products.length > 0 && upsellItems.length === 0) {
      setScreen('solo-checkout');
    }
  }, [loading, products.length, upsellItems.length, setScreen]);

  // 計算每個加購商品在 cart 中已加的數量（即時更新）
  function qtyInCart(foodName: string): number {
    return soloItems
      .filter((i) => i.food_name === foodName)
      .reduce((s, i) => s + i.quantity, 0);
  }

  return (
    <div className="min-h-full bg-cream pb-32">
      <header className="bg-primary text-white px-4 py-4">
        <h1 className="font-bold text-2xl leading-tight">加購推薦</h1>
        <p className="text-base opacity-90 mt-1">來點甜點飲料配你的餐點吧！</p>
      </header>

      <main className="px-4 py-4">
        {loading && <div className="text-center text-gray-400 py-8">載入中…</div>}

        {!loading && upsellItems.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {upsellItems.map((p) => (
              <UpsellCard
                key={p.food_name + p.restaurant_name}
                product={p}
                qty={qtyInCart(p.food_name)}
                onTap={() => setTappedProduct(p)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-cream px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="text-gray-500">訂單總計</span>
          <span className="font-bold text-primary text-lg">{formatNTD(total)}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setScreen('menu')} className="btn-ghost flex-1">
            繼續選購
          </button>
          <button
            onClick={() => setScreen('solo-checkout')}
            className="btn-primary flex-1"
          >
            下一步
          </button>
        </div>
      </footer>

      {tappedProduct && (
        <ItemModal product={tappedProduct} onClose={() => setTappedProduct(null)} />
      )}
    </div>
  );
}

interface CardProps {
  product: Product;
  qty: number;
  onTap: () => void;
}

function UpsellCard({ product, qty, onTap }: CardProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="relative bg-white rounded-xl border border-cream p-2 text-left active:scale-[0.98] transition-transform shadow-sm flex flex-col"
      style={{ touchAction: 'manipulation' }}
    >
      {/* 固定的圖片區塊：有圖顯示圖、沒圖顯示佔位，讓所有卡片視覺對齊 */}
      <div className="w-full aspect-square rounded-lg mb-1.5 overflow-hidden bg-cream/40 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.food_name}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <span className="text-4xl text-gray-300" aria-hidden="true">🍱</span>
        )}
      </div>
      <p
        className="text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem]"
        title={product.food_name}
      >
        <FoodNameLabel name={product.food_name} />
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-sm text-primary font-bold">{formatNTD(product.price)}</span>
        <span
          className="w-8 h-8 rounded-full bg-primary text-white text-lg font-bold flex items-center justify-center"
          aria-hidden="true"
        >
          +
        </span>
      </div>

      {qty > 0 && (
        <span className="absolute -top-2 -right-2 bg-accent text-primary text-xs font-bold rounded-full min-w-[2rem] h-7 px-2 flex items-center justify-center border-2 border-white shadow">
          已加 {qty}
        </span>
      )}
    </button>
  );
}
