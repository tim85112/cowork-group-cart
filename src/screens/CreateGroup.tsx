import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useGroupStore } from '@/store/useGroupStore';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { env } from '@/lib/env';
import type { GroupRow } from '@/types/db';

export function CreateGroup() {
  const profile = useGroupStore((s) => s.profile);
  const setGroup = useGroupStore((s) => s.setGroup);
  const setScreen = useGroupStore((s) => s.setScreen);
  const setError = useGroupStore((s) => s.setError);
  const setLoading = useGroupStore((s) => s.setLoading);
  const loading = useGroupStore((s) => s.loading);

  const [name, setName] = useState(profile?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (!name.trim() || !phone.trim()) {
      setError('請填寫姓名與電話');
      return;
    }
    if (!/^09\d{8}$/.test(phone.replace(/\D/g, ''))) {
      setError('電話格式不正確（請輸入 09 開頭的 10 位手機號碼）');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const groupId = nanoid(10);
      const row: Partial<GroupRow> = {
        id: groupId,
        building_id: env.buildingId,
        owner_user_id: profile.userId,
        owner_name: name.trim(),
        owner_phone: phone.trim(),
        tax_id: taxId.trim() || null,
        status: 'open'
      };
      const { data, error } = await supabase.from('groups').insert(row).select().single();
      if (error) throw error;

      await api.notifyGroupCreated({
        group_id: groupId,
        owner_name: name.trim(),
        owner_phone: phone.trim(),
        owner_user_id: profile.userId
      });

      setGroup(data as GroupRow);
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      url.searchParams.set('groupId', groupId);
      window.history.replaceState({}, '', url.toString());
      setScreen('share');
    } catch (err) {
      setError((err as Error).message || '建立揪團失敗');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-cream">
      <div className="px-4 pt-6 pb-24">
        <div className="card p-6 mt-4">
          <div className="flex flex-col items-center mb-5">
            <img src="https://i.meee.com.tw/TxIzl4T.png" className="w-28 h-28 object-contain" />
            <p style={{ fontFamily: "'Ma Shan Zheng', cursive", fontSize: '1.6rem', letterSpacing: '0.15em', color: '#3a1a00' }}>
              商辦駝獸
            </p>
          </div>
          <h2 className="text-xl font-bold mb-1">開啟團體購物車</h2>
          <p className="text-sm text-gray-500 mb-6">輕鬆揪團，每天省下 30 分鐘的訂餐時間！</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold">揪團者姓名</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field mt-1"
                placeholder="您的稱呼"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">聯絡電話</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field mt-1"
                placeholder="0912345678"
                inputMode="tel"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">公司統編</span>
              <span className="text-xs text-gray-400 ml-1">非必填</span>
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="input-field mt-1"
                placeholder="8碼統一編號"
                inputMode="numeric"
                maxLength={8}
              />
            </label>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? '建立中…' : '開始揪團'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
