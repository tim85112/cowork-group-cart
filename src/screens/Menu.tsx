import { useMemo, useState } from 'react';
import { useGroupStore, selectIsHost, selectGroupTotal } from '@/store/useGroupStore';
import { useProducts } from '@/hooks/useProducts';
import { useRealtimeCart } from '@/hooks/useRealtimeCart';
import { useCountdown } from '@/hooks/useCountdown';
import { env } from '@/lib/env';
import { BrandHeader } from '@/components/BrandHeader';
import { CategoryTabs } from '@/components/CategoryTabs';
import { SearchBar } from '@/components/SearchBar';
import { ProductCard } from '@/components/ProductCard';
import { BottomActionBar } from '@/components/BottomActionBar';
import { ItemModal } from './ItemModal';
import { CartDrawer } from './CartDrawer';
import { ConfirmDialog } from './ConfirmDialog';
import type { Product, Category } from '@/types/product';

export function Menu() {
  const group = useGroupStore((s) => s.group);
  const items = useGroupStore((s) => s.items);
  const isHost = useGroupStore(selectIsHost);
  const total = useGroupStore(selectGroupTotal);
  const setScreen = useGroupStore((s) => s.setScreen);

  useRealtimeCart(group?.id ?? null);
  const { products, loading, error, reload } = useProducts(env.buildingId);

  const [activeCat, setActiveCat] = useState<Category | null>(null);
  const [search, setSearch] = useState('');
  const [tappedProduct, setTappedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (activeCat && p.food_label !== activeCat) return false;
      if (search.trim() && !p.food_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, activeCat, search]);

  const deadline = group ? new Date(group.created_at).getTime() + 24 * 3600 * 1000 : null;
  const countdown = useCountdown(deadline);
  const createdAt = group ? new Date(group.created_at).toLocaleString('zh-Hant', { hour12: false }) : '';

  function handleCloseGroup() {
    setShowCart(false);
    setShowConfirm(true);
  }

  function handleConfirmCloseGroup() {
    setShowConfirm(false);
    setScreen('review');
  }

  return (
    <div className="min-h-full pb-24">
      <BrandHeader
        ownerName={group?.owner_name}
        createdAt={createdAt}
        countdownText={countdown}
        showCloseButton={isHost && group?.status === 'open'}
        onCloseGroup={handleCloseGroup}
      />
      <CategoryTabs active={activeCat} onChange={setActiveCat} />
      <SearchBar value={search} onChange={setSearch} />

      <main className="px-4 py-3 space-y-2">
        {loading && <div className="text-center text-gray-400 py-8">載入餐點中…</div>}
        {error && (
          <div className="card p-4 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button onClick={reload} className="btn-ghost">重新載入</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center text-gray-400 py-8">沒有符合的餐點</div>
        )}
        {filtered.map((p) => (
          <ProductCard key={p.food_name + p.restaurant_name} product={p} onTap={setTappedProduct} />
        ))}
      </main>

      <BottomActionBar
        itemCount={items.length}
        total={total}
        onCart={() => setShowCart(true)}
        showCloseGroup={isHost && group?.status === 'open'}
        onCloseGroup={handleCloseGroup}
      />

      {group?.status === 'open' && (
        <button
          onClick={() => setScreen('share')}
          className="fixed bottom-24 right-4 bg-accent text-primary font-bold rounded-full shadow-lg w-14 h-14 flex flex-col items-center justify-center active:scale-95 z-40"
          aria-label="分享揪團連結"
        >
          <span className="text-lg leading-none">👥</span>
          <span className="text-[11px] leading-tight mt-0.5">分享</span>
        </button>
      )}

      {tappedProduct && (
        <ItemModal product={tappedProduct} onClose={() => setTappedProduct(null)} />
      )}
      {showCart && (
        <CartDrawer onClose={() => setShowCart(false)} onCloseGroup={handleCloseGroup} />
      )}
      {showConfirm && (
        <ConfirmDialog
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirmCloseGroup}
        />
      )}
    </div>
  );
}
