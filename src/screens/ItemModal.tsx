import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useGroupStore } from '@/store/useGroupStore';
import { QtyStepper } from '@/components/QtyStepper';
import { SpecRadioGroup, parseSpecOptions } from '@/components/SpecRadioGroup';
import { formatNTD } from '@/lib/format';
import type { Product } from '@/types/product';

interface Props {
  product: Product;
  onClose: () => void;
}

export function ItemModal({ product, onClose }: Props) {
  const profile = useGroupStore((s) => s.profile);
  const group = useGroupStore((s) => s.group);
  const setError = useGroupStore((s) => s.setError);

  const opts1 = parseSpecOptions(product.spec1);
  const opts2 = parseSpecOptions(product.spec2);

  const [spec1, setSpec1] = useState(opts1[0] ?? '');
  const [spec2, setSpec2] = useState(opts2[0] ?? '');
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  function specAddonPrice(spec: string): number {
    const m = spec.match(/\(\+(\d+)\)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  const addon = specAddonPrice(spec1) + specAddonPrice(spec2);
  const unitPrice = product.price + addon;
  const total = unitPrice * qty;

  async function handleAdd() {
    if (!profile || !group) return;
    if (group.status !== 'open') {
      setError('團購已收單，無法再加品項');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('cart_items').insert({
        group_id: group.id,
        user_id: profile.userId,
        user_name: profile.displayName,
        food_name: product.food_name,
        spec1: spec1 || null,
        spec2: spec2 || null,
        quantity: qty,
        unit_price: unitPrice,
        product_url: product.product_url || null
      });
      if (error) throw error;
      onClose();
    } catch (e) {
      setError((e as Error).message || '加入購物車失敗');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.food_name}
            className="w-full aspect-[4/3] object-cover"
            onError={(e) => ((e.currentTarget.style.display = 'none'))}
          />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold">{product.food_name}</h2>
              <p className="text-xs text-gray-500">{product.restaurant_name}</p>
              {product.description && (
                <p className="text-sm text-gray-500 mt-1">{product.description}</p>
              )}
            </div>
            <p className="text-primary font-bold whitespace-nowrap">{formatNTD(unitPrice)}</p>
          </div>

          <div className="mt-5 space-y-4">
            {opts1.length > 0 && (
              <SpecRadioGroup label="規格一" options={opts1} value={spec1} onChange={setSpec1} />
            )}
            {opts2.length > 0 && (
              <SpecRadioGroup label="規格二" options={opts2} value={spec2} onChange={setSpec2} />
            )}
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">數量</span>
              <QtyStepper value={qty} onChange={setQty} />
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1">取消</button>
            <button onClick={handleAdd} className="btn-primary flex-1" disabled={submitting}>
              {submitting ? '加入中…' : `加入購物車 ${formatNTD(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
