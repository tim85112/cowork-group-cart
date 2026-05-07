import liff from '@line/liff';
import { env } from './env';

export interface Profile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

let initPromise: Promise<void> | null = null;

const RECOVERY_FLAG = 'liff_token_recovered';

function clearLiffAuthStorage() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('LIFF_STORE'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function recoverFromAuthError(): void {
  clearLiffAuthStorage();
  try {
    sessionStorage.removeItem(RECOVERY_FLAG);
  } catch {}
  window.location.reload();
}

export function initLiff(): Promise<void> {
  if (!initPromise) {
    initPromise = liff.init({ liffId: env.liffId }).catch((err) => {
      const msg = String((err && (err.message ?? err.code)) || err || '');
      const isAuthError = /revoke|expired|invalid.*token|unauthor/i.test(msg);
      const alreadyRecovered =
        (() => {
          try { return !!sessionStorage.getItem(RECOVERY_FLAG); } catch { return false; }
        })();

      if (isAuthError && !alreadyRecovered) {
        try { sessionStorage.setItem(RECOVERY_FLAG, '1'); } catch {}
        clearLiffAuthStorage();
        window.location.reload();
        return new Promise<void>(() => {}); // hang until reload
      }

      throw err;
    });
  }
  return initPromise;
}

export async function getProfile(): Promise<Profile> {
  await initLiff();
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return new Promise(() => {});
  }
  const p = await liff.getProfile();
  return { userId: p.userId, displayName: p.displayName, pictureUrl: p.pictureUrl };
}

export async function shareGroupLink(ownerName: string, shareUrl: string): Promise<boolean> {
  await initLiff();
  if (!liff.isApiAvailable('shareTargetPicker')) return false;
  const text = `${ownerName} 開了團購！一起點午餐～\n${shareUrl}`;
  const res = await liff.shareTargetPicker([{ type: 'text', text }]);
  return !!res;
}

export async function sendOrderTrigger(groupId: string): Promise<void> {
  await initLiff();
  if (!liff.isInClient()) return;
  await liff.sendMessages([{ type: 'text', text: `GROUP_CONFIRMED:${groupId}` }]);
}

export async function closeWindow(): Promise<void> {
  await initLiff();
  liff.closeWindow();
}

export function isInClient(): boolean {
  return liff.isInClient();
}
