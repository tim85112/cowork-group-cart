import React from 'react';
import { createRoot } from 'react-dom/client';
import { initLiff, getProfile, recoverFromAuthError } from '@/lib/liff';
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
    const msg = (e as Error).message || '';
    const looksLikeAuth = /revoke|expired|invalid.*token|unauthor/i.test(msg);
    root.render(
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="card p-6 max-w-sm text-center">
          <h2 className="font-bold text-primary mb-2">無法啟動</h2>
          <p className="text-sm text-gray-500 break-all mb-4">{msg}</p>
          {looksLikeAuth && (
            <button onClick={recoverFromAuthError} className="btn-primary w-full">
              重新登入
            </button>
          )}
        </div>
      </div>
    );
  }
}

bootstrap();
