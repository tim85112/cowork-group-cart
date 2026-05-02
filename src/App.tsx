import { useEffect } from 'react';
import { useGroupStore } from '@/store/useGroupStore';
import { supabase } from '@/lib/supabase';
import { CreateGroup } from '@/screens/CreateGroup';
import { ShareGroup } from '@/screens/ShareGroup';
import { Menu } from '@/screens/Menu';
import { ReviewClose } from '@/screens/ReviewClose';
import type { GroupRow } from '@/types/db';

export function App() {
  const screen = useGroupStore((s) => s.screen);
  const group = useGroupStore((s) => s.group);
  const loading = useGroupStore((s) => s.loading);
  const error = useGroupStore((s) => s.error);
  const setGroup = useGroupStore((s) => s.setGroup);
  const setScreen = useGroupStore((s) => s.setScreen);
  const setLoading = useGroupStore((s) => s.setLoading);
  const setError = useGroupStore((s) => s.setError);

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
      setScreen('create');
    }
  }, [setGroup, setScreen, setLoading, setError]);

  return (
    <div className="min-h-full bg-cream">
      {loading && !group && (
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          載入中…
        </div>
      )}
      {!loading && screen === 'create' && <CreateGroup />}
      {!loading && screen === 'share' && <ShareGroup />}
      {!loading && screen === 'menu' && group && <Menu />}
      {!loading && screen === 'review' && group && <ReviewClose />}

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
