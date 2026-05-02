import { useGroupStore, selectGroupTotal, selectIsHost } from '@/store/useGroupStore';
import { supabase } from '@/lib/supabase';
import { MemberSection } from '@/components/MemberSection';
import { formatNTD } from '@/lib/format';
import { useCountdown } from '@/hooks/useCountdown';
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

  const deadline = group ? new Date(group.created_at).getTime() + 24 * 3600 * 1000 : null;
  const countdown = useCountdown(deadline);

  if (!group || !profile) return null;

  // 依 user 分組（揪團者排第一）
  const grouped = new Map<string, { user_name: string; items: CartItemRow[]; isOwner: boolean }>();
  for (const it of items) {
    const isOwner = it.user_id === group.owner_user_id;
    if (!grouped.has(it.user_id)) {
      grouped.set(it.user_id, { user_name: it.user_name, items: [], isOwner });
    }
    grouped.get(it.user_id)!.items.push(it);
  }
  const sortedMembers = Array.from(grouped.values()).sort(
    (a, b) => (b.isOwner ? 1 : 0) - (a.isOwner ? 1 : 0)
  );

  async function handleRemove(id: string) {
    await supabase.from('cart_items').delete().eq('id', id).eq('user_id', profile!.userId);
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/40 flex items-end" onClick={onClose}>
      <div
        className="bg-cream w-full rounded-t-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 flex items-center justify-between">
          <h2 className="font-bold text-lg">揪團訂單</h2>
          <div className="flex items-center gap-2">
            {countdown && <span className="text-xs text-gray-500">{countdown}</span>}
            <button onClick={onClose} className="text-gray-400 text-xl px-2">✕</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {sortedMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">尚無人點餐</div>
          ) : (
            sortedMembers.map((m) => (
              <MemberSection
                key={m.user_name + (m.isOwner ? '_o' : '')}
                userName={m.user_name}
                isOwner={m.isOwner}
                items={m.items}
                onRemove={
                  m.items[0]?.user_id === profile.userId ? handleRemove : undefined
                }
              />
            ))
          )}
        </div>

        <footer className="bg-white px-4 py-3 border-t border-cream">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">總計</span>
            <span className="text-xl font-bold text-primary">{formatNTD(total)}</span>
          </div>
          {isHost ? (
            <button
              onClick={onCloseGroup}
              disabled={items.length === 0}
              className="btn-primary w-full"
            >
              收單（共 {items.length} 件）
            </button>
          ) : (
            <p className="text-xs text-gray-400 text-center">由團主統一收單</p>
          )}
        </footer>
      </div>
    </div>
  );
}
