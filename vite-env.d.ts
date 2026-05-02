/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIFF_ID: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_N8N_WEBHOOK_BASE: string;
  readonly VITE_BUILDING_ID: string;
  readonly VITE_LIFF_ENDPOINT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
