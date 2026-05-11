import { useMemo, useState } from 'react';
import {
  useGroupStore,
  selectIsHost,
  selectGroupTotal,
  selectSoloTotal,
  selectSoloCount
} from '@/store/useGroupStore';
import { useProducts } from '@/hooks/useProducts';
import { useHotItems } from '@/hooks/useHotItems';
import { useRealtimeCart } from '@/hooks/useRealtimeCart';
import { useCountdown } from '@/hooks/useCountdown';
import { env } from '@/lib/env';
import { BrandHeader } from '@/components/BrandHeader';
import { CategoryTabs } from '@/components/CategoryTabs';
import { SearchBar } from '@/components/SearchBar';
import { ProductCard } from '@/components/ProductCard';
import { HotItemsSection } from '@/components/HotItemsSection';
import { BottomActionBar } from '@/components/BottomActionBar';
import { CartModal } from '@/components/CartModal';
import { GroupStartDialog } from '@/components/GroupStartDialog';
import { ItemModal } from './ItemModal';
import { CartDrawer } from './CartDrawer';
import { ConfirmDialog } from './ConfirmDialog';
import type { Product, Category } from '@/types/product';

export function Menu() {
  const group = useGroupStore((s) => s.group);
  const items = useGroupStore((s) => s.items);
  const isHost = useGroupStore(selectIsHost);
  const groupTotal = useGroupStore(selectGroupTotal);
  const soloMode = useGroupStore((s) => s.soloMode);
  const soloTotal = useGroupStore(selectSoloTotal);
  const soloCount = useGroupStore(selectSoloCount);
  const setScreen = useGroupStore((s) => s.setScreen);
  const setSoloMode = useGroupStore((s) => s.setSoloMode);

  useRealtimeCart(soloMode ? null : group?.id ?? null);
  const { products, loading, error, reload } = useProducts(env.buildingId);
  const hotItems = useHotItems(env.buildingId);

  const [activeCat, setActiveCat] = useState<Category | null>(null);
  const [search, setSearch] = useState('');
  const [tappedProduct, setTappedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showGroupStart, setShowGroupStart] = useState(false);

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

  function handleGroupStartConfirm() {
    setShowGroupStart(false);
    setSoloMode(false);
    setScreen('create');
  }

  // 顯示用：solo 模式用 soloItems / soloTotal；group 模式用既有
  const displayCount = soloMode ? soloCount : items.length;
  const displayTotal = soloMode ? soloTotal : groupTotal;

  return (
    <div className="min-h-full pb-24">
      <BrandHeader
        ownerName={soloMode ? undefined : group?.owner_name}
        createdAt={soloMode ? '' : createdAt}
        countdownText={soloMode ? '' : countdown}
        showCloseButton={!soloMode && isHost && group?.status === 'open'}
        onCloseGroup={handleCloseGroup}
      />
      <HotItemsSection hotItems={hotItems} products={products} onTap={setTappedProduct} />
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
        itemCount={displayCount}
        total={displayTotal}
        onCart={() => setShowCart(true)}
        showCloseGroup={!soloMode && isHost && group?.status === 'open'}
        onCloseGroup={handleCloseGroup}
        soloMode={soloMode}
        onSoloCheckout={() => setScreen('solo-checkout')}
      />

      {/* solo 模式：揪團 + 購物車 兩個 floating badge */}
      {soloMode && (
        <>
          <button
            onClick={() => setShowGroupStart(true)}
            className="fixed bottom-24 right-4 bg-accent text-primary font-extrabold rounded-full shadow-xl w-20 h-20 flex flex-col items-center justify-center active:scale-95 z-40 ring-2 ring-white"
            aria-label="開啟揪團"
            style={{ touchAction: 'manipulation' }}
          >
            <span className="text-3xl leading-none">👥</span>
            <span className="text-sm leading-tight mt-1">揪團</span>
          </button>

          <button
            onClick={() => setShowCart(true)}
            className="fixed bottom-48 right-4 bg-primary text-white rounded-full shadow-xl w-20 h-20 flex flex-col items-center justify-center active:scale-95 z-40 ring-2 ring-white"
            aria-label="開啟購物車"
            style={{ touchAction: 'manipulation' }}
          >
            <span className="text-3xl leading-none">🛒</span>
            <span className="text-sm leading-tight mt-1 font-bold">購物車</span>
            {soloCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-primary text-xs font-bold rounded-full min-w-[1.5rem] h-6 px-1 flex items-center justify-center border-2 border-white">
                {soloCount}
              </span>
            )}
          </button>
        </>
      )}

      {/* group 模式：保留原本分享按鈕 */}
      {!soloMode && group?.status === 'open' && (
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
        <ItemModal
          key={tappedProduct.food_name + tappedProduct.restaurant_name}
          product={tappedProduct}
          products={products}
          onClose={() => setTappedProduct(null)}
          onSwitchProduct={(p) => setTappedProduct(p)}
        />
      )}

      {/* solo 用 CartModal；group 用 CartDrawer */}
      {showCart && soloMode && (
        <CartModal
          onClose={() => setShowCart(false)}
          onCheckout={() => {
            setShowCart(false);
            setScreen('solo-checkout');
          }}
        />
      )}
      {showCart && !soloMode && (
        <CartDrawer onClose={() => setShowCart(false)} onCloseGroup={handleCloseGroup} />
      )}

      {showConfirm && (
        <ConfirmDialog
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirmCloseGroup}
        />
      )}
      {showGroupStart && (
        <GroupStartDialog
          onCancel={() => setShowGroupStart(false)}
          onConfirm={handleGroupStartConfirm}
        />
      )}
    </div>
  );
}
