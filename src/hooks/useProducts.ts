import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/types/product';

const cache = new Map<string, { ts: number; data: Product[] }>();
const TTL = 5 * 60 * 1000;

export function useProducts(buildingId: string): {
  products: Product[];
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const [products, setProducts] = useState<Product[]>(() => cache.get(buildingId)?.data ?? []);
  const [loading, setLoading] = useState(!cache.get(buildingId));
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const cached = cache.get(buildingId);
    if (cached && Date.now() - cached.ts < TTL && reloadTick === 0) {
      setProducts(cached.data);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .fetchProducts(buildingId)
      .then((data) => {
        if (cancelled) return;
        cache.set(buildingId, { ts: Date.now(), data });
        setProducts(data);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [buildingId, reloadTick]);

  return { products, loading, error, reload: () => setReloadTick((t) => t + 1) };
}
