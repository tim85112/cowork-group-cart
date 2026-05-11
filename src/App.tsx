import { useEffect } from 'react';
import { useGroupStore } from '@/store/useGroupStore';
import { supabase } from '@/lib/supabase';
import { CreateGroup } from '@/screens/CreateGroup';
import { ShareGroup } from '@/screens/ShareGroup';
import { Menu } from '@/screens/Menu';
import { ReviewClose } from '@/screens/ReviewClose';
import { SoloCheckout } from '@/screens/SoloCheckout';
import { UpsellScreen } from '@/screens/UpsellScreen';
import type { GroupRow } from '@/types/db';

export function App() {
  const screen = useGroupStore((s) => s.screen);
  const group = useGroupStore((s) => s.group);
  const soloMode = useGroupStore((s) => s.soloMode);
  const loading = useGroupStore((s) => s.loading);
  const error = useGroupStore((s) => s.error);
  const setGroup = useGroupStore((s) => s.setGroup);
  const setScreen = useGroupStore((s) => s.setScreen);
  const setLoading = useGroupStore((s) => s.setLoading);
  const setError = useGroupStore((s) => s.setError);
  const setSoloMode = useGroupStore((s) => s.setSoloMode);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('groupId');
    const mode = params.get('mode');

    if (groupId) {
      setLoading(true);
      supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .maybeSingle()
        .then(({ data, error: e }) => {
          if (e) {
            setError(e.message);
          } else if (!data) {
            setError('找不到此團購');
          } else {
            setGroup(data as GroupRow);
            setScreen('menu');
          }
          setLoading(false);
        });
    } else if (mode === 'create') {
      setScreen('create');
    } else {
      // 個人散單模式（預設；未來 ?tag=甜點 等其他 param 也走此路）
      setSoloMode(true);
      setScreen('menu');
    }
  }, [setGroup, setScreen, setLoading, setError, setSoloMode]);

  return (
    <div className="min-h-full bg-cream">
      {loading && !group && (
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          載入中…
        </div>
      )}
      {!loading && screen === 'create' && <CreateGroup />}
      {!loading && screen === 'share' && <ShareGroup />}
      {!loading && screen === 'menu' && (soloMode || group) && <Menu />}
      {!loading && screen === 'review' && group && <ReviewClose />}
      {!loading && screen === 'upsell' && (soloMode || group) && <UpsellScreen />}
      {!loading && screen === 'solo-checkout' && soloMode && <SoloCheckout />}

      {error && (
        <div
          className="fixed bottom-4 inset-x-4 z-50 bg-red-600 text-white text-sm rounded-xl px-4 py-3 shadow-lg cursor-pointer"
          onClick={() => setError(null)}
        >
          {error}
        </div>
      )}
    </div>
  );
}
