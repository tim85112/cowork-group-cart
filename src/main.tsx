import React from 'react';
import { createRoot } from 'react-dom/client';
import { initLiff, getProfile } from '@/lib/liff';
import { useGroupStore } from '@/store/useGroupStore';
import { App } from '@/App';
import './index.css';

async function bootstrap() {
  const root = createRoot(document.getElementById('root')!);
  try {
    await initLiff();
    const profile = await getProfile();
    useGroupStore.getState().setProfile(profile);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (e) {
    root.render(
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="card p-6 max-w-sm text-center">
          <h2 className="font-bold text-primary mb-2">無法啟動</h2>
          <p className="text-sm text-gray-500 break-all">{(e as Error).message}</p>
        </div>
      </div>
    );
  }
}

bootstrap();
