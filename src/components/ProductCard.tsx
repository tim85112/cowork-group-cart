import type { Product } from '@/types/product';
import { formatNTD } from '@/lib/format';
import { FoodNameLabel } from './FoodNameLabel';

interface Props {
  product: Product;
  onTap: (p: Product) => void;
}

export function ProductCard({ product, onTap }: Props) {
  return (
    <button
      onClick={() => onTap(product)}
      className="card w-full text-left flex gap-3 p-3 active:scale-[0.99] transition"
    >
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.food_name}
          className="w-20 h-20 rounded-xl object-cover bg-cream shrink-0"
          loading="lazy"
          onError={(e) => ((e.currentTarget.style.display = 'none'))}
        />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-cream shrink-0 flex items-center justify-center text-2xl">
          🍱
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-bold truncate">
          <FoodNameLabel name={product.food_name} />
        </p>
        {product.description && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{product.description}</p>
        )}
        <p className="text-primary font-bold mt-1">{formatNTD(product.price)}</p>
      </div>
    </button>
  );
}
