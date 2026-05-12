import { useGroupStore, selectGroupTotal, selectIsHost } from '@/store/useGroupStore';
import { supabase } from '@/lib/supabase';
import { formatNTD } from '@/lib/format';
import { FoodNameLabel } from '@/components/FoodNameLabel';
import type { CartItemRow } from '@/types/db';

interface Props {
  onClose: () => void;
  onCloseGroup: () => void;
}

export function CartDrawer({ onClose, onCloseGroup }: Props) {
  const items = useGroupStore((s) => s.items);
  const profile = useGroupStore((s) => s.profile);
  const group = useGroupStore((s) => s.group);
  const isHost = useGroupStore(selectIsHost);
  const total = useGroupStore(selectGroupTotal);
  const removeItem = useGroupStore((s) => s.removeItem);
  const upsertItem = useGroupStore((s) => s.upsertItem);

  if (!group || !profile) return null;

  const myUserId = profile.userId;

  // 依使用者分組：自己最上面、團主次之、其他人依加入順序
  const grouped = new Map<
    string,
    { user_id: string; user_name: string; items: CartItemRow[]; isOwner: boolean; isMe: boolean }
  >();
  for (const it of items) {
    if (!grouped.has(it.user_id)) {
      grouped.set(it.user_id, {
        user_id: it.user_id,
        user_name: it.user_name,
        items: [],
        isOwner: it.user_id === group.owner_user_id,
        isMe: it.user_id === myUserId
      });
    }
    grouped.get(it.user_id)!.items.push(it);
  }
  const sortedMembers = Array.from(grouped.values()).sort((a, b) => {
    if (a.isMe !== b.isMe) return a.isMe ? -1 : 1;
    if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
    return 0;
  });

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const memberCount = grouped.size;

  async function updateQty(item: CartItemRow, newQty: number) {
    if (item.user_id !== myUserId) return;
    if (newQty <= 0) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', item.id)
        .eq('user_id', myUserId);
      if (!error) removeItem(item.id);
      return;
    }
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', item.id)
      .eq('user_id', myUserId)
      .select()
      .single();
    if (!error && data) upsertItem(data as CartItemRow);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow border border-gray-200 text-gray-500"
          aria-label="關閉"
        >
          ✕
        </button>

        <header className="px-6 pt-6 pb-3 text-center border-b border-cream">
          <h2 className="font-bold text-xl">訂購明細</h2>
          <p className="text-sm text-gray-500 mt-1">
            目前選購 <span className="text-primary font-bold">{totalItems}</span> 項商品
            <span className="mx-1">·</span>
            共 <span className="text-primary font-bold">{memberCount}</span> 位團員
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {sortedMembers.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-base">尚無人點餐</div>
          )}

          {sortedMembers.map((m) => {
            const subtotal = m.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
            return (
              <section key={m.user_id} className="space-y-2">
                <header className="flex items-center justify-between pb-1 border-b border-cream">
                  <h3 className="font-bold text-base">
                    {m.isMe ? '我' : m.user_name}
                    {m.isOwner && (
                      <span className="ml-2 text-xs bg-accent text-primary px-2 py-0.5 rounded-full">
                        團主
                      </span>
                    )}
                  </h3>
                  <span className="text-sm text-gray-500">小計 {formatNTD(subtotal)}</span>
                </header>

                <ul className="space-y-3">
                  {m.items.map((item) => {
                    const spec = [item.spec1, item.spec2].filter(Boolean).join(' / ');
                    const itemTotal = item.unit_price * item.quantity;
                    return (
                      <li key={item.id} className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-base">
                              <FoodNameLabel name={item.food_name} />
                            </p>
                            {spec && <p className="text-sm text-gray-500">{spec}</p>}
                            <p className="text-sm text-gray-400 mt-0.5">
                              {formatNTD(item.unit_price)}
                            </p>
                          </div>
                          <p className="font-bold text-base whitespace-nowrap">
                            {formatNTD(itemTotal)}
                          </p>
                        </div>

                        {m.isMe ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item, item.quantity - 1)}
                              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 text-lg active:scale-95"
                              aria-label="減少數量"
                            >
                              −
                            </button>
                            <span className="min-w-[2.5rem] text-center font-medium border border-gray-200 rounded px-2 py-0.5 text-base">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item, item.quantity + 1)}
                              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 text-lg active:scale-95"
                              aria-label="增加數量"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">×{item.quantity}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="px-5 py-3 bg-cream/50 border-t border-cream text-center text-base">
          總計 <span className="font-bold">{totalItems}</span> 項 / 共{' '}
          <span className="font-bold text-primary">
            ${' '}
            {total.toLocaleString('zh-Hant')}
          </span>
        </div>

        <div className="px-5 py-4 flex gap-2 border-t border-cream">
          <button onClick={onClose} className="btn-ghost flex-1">
            回目錄
          </button>
          {isHost && (
            <button
              onClick={onCloseGroup}
              disabled={items.length === 0}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              收單
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
