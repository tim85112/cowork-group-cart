import { useState } from 'react';
import type { HotItem } from '@/hooks/useHotItems';
import type { Product } from '@/types/product';
import { formatNTD } from '@/lib/format';
import { FoodNameLabel } from './FoodNameLabel';

interface Props {
  hotItems: HotItem[];
  products: Product[];
  onTap: (p: Product) => void;
}

const RANK_BADGE: Record<number, string> = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-slate-400 text-white',
  3: 'bg-orange-500 text-white',
};

function HotCard({ rank, product, onTap }: { rank: number; product: Product; onTap: (p: Product) => void }) {
  const [imgError, setImgError] = useState(false);
  const badgeStyle = RANK_BADGE[rank];

  return (
    <button
      onClick={() => onTap(product)}
      className="relative shrink-0 w-28 text-left bg-white rounded-2xl shadow-sm overflow-hidden active:scale-[0.97] transition"
    >
      {/* 圖片區（badge 錨點一律在此 relative 容器內） */}
      <div className="relative w-full aspect-square bg-cream">
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.food_name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🍱</div>
        )}
        {badgeStyle && (
          <span
            className={`absolute top-1.5 left-1.5 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shadow-md ${badgeStyle}`}
          >
            {rank}
          </span>
        )}
      </div>

      {/* 文字區 */}
      <div className="p-2 pr-8">
        <p className="text-xs font-bold leading-tight line-clamp-2">
          <FoodNameLabel name={product.food_name} />
        </p>
        <p className="text-primary font-bold text-xs mt-1">{formatNTD(product.price)}</p>
      </div>

      {/* + 按鈕 */}
      <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-base font-bold leading-none shadow">
        +
      </div>
    </button>
  );
}

export function HotItemsSection({ hotItems, products, onTap }: Props) {
  const hotProducts = hotItems
    .map((h) => ({ rank: h.rank, product: products.find((p) => p.food_name === h.food_name) }))
    .filter((x): x is { rank: number; product: Product } => x.product != null);

  if (hotProducts.length === 0) return null;

  return (
    <section className="pt-3 pb-1">
      <h2 className="px-4 text-xl font-bold text-gray-800 mb-2">本週熱銷</h2>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
        {hotProducts.map(({ rank, product }) => (
          <HotCard key={`${rank}-${product.food_name}`} rank={rank} product={product} onTap={onTap} />
        ))}
      </div>
    </section>
  );
}
