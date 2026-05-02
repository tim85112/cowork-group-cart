import { useState } from 'react';
import { useGroupStore } from '@/store/useGroupStore';
import { shareGroupLink } from '@/lib/liff';
import { env } from '@/lib/env';
import { QRCodeBlock } from '@/components/QRCodeBlock';

export function ShareGroup() {
  const group = useGroupStore((s) => s.group);
  const setScreen = useGroupStore((s) => s.setScreen);
  const setError = useGroupStore((s) => s.setError);
  const [copied, setCopied] = useState(false);

  if (!group) return null;
  const shareUrl = `${env.endpointUrl}/?groupId=${group.id}`;

  async function handleLineShare() {
    if (!group) return;
    try {
      const ok = await shareGroupLink(group.owner_name, shareUrl);
      if (!ok) setError('LINE 分享功能未啟用，請改用「複製連結」');
    } catch (e) {
      setError((e as Error).message || 'LINE 分享失敗');
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-full bg-cream">
      <div className="px-4 pt-6 pb-24">
        <div className="card p-6 flex flex-col items-center text-center">
          <h2 className="text-xl font-bold mb-1">揪團已建立！</h2>
          <p className="text-sm text-gray-500 mb-4">分享下方連結讓同事加入</p>
          <QRCodeBlock text={shareUrl} />
          <p className="text-xs text-gray-400 break-all mt-4 mb-2">{shareUrl}</p>
          <div className="grid grid-cols-2 gap-2 w-full mt-2">
            <button onClick={handleLineShare} className="btn-ghost">
              LINE 分享
            </button>
            <button onClick={handleCopy} className="btn-ghost">
              {copied ? '已複製 ✓' : '複製連結'}
            </button>
          </div>
          <button onClick={() => setScreen('menu')} className="btn-primary w-full mt-4">
            前往點餐
          </button>
        </div>
      </div>
    </div>
  );
}
