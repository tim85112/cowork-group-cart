function required(key: keyof ImportMetaEnv): string {
  const v = import.meta.env[key];
  if (!v) throw new Error(`Missing env var ${String(key)}`);
  return v;
}

export const env = {
  liffId: required('VITE_LIFF_ID'),
  supabaseUrl: required('VITE_SUPABASE_URL'),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY'),
  n8nBase: required('VITE_N8N_WEBHOOK_BASE').replace(/\/$/, ''),
  buildingId: import.meta.env.VITE_BUILDING_ID || 'B01',
  endpointUrl: import.meta.env.VITE_LIFF_ENDPOINT_URL || window.location.origin
};
