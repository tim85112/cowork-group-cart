import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface HotItem {
  food_name: string;
  rank: number;
  is_manual: boolean;
}

export function useHotItems(buildingId: string) {
  const [hotItems, setHotItems] = useState<HotItem[]>([]);

  useEffect(() => {
    supabase
      .rpc('get_hot_items', { p_building_id: buildingId })
      .then(({ data }) => {
        if (data) setHotItems(data as HotItem[]);
      });
  }, [buildingId]);

  return hotItems;
}
