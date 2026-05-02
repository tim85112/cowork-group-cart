import liff from '@line/liff';
import { env } from './env';

export interface Profile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

let initPromise: Promise<void> | null = null;

export function initLiff(): Promise<void> {
  if (!initPromise) {
    initPromise = liff.init({ liffId: env.liffId });
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

export async function closeWindow(): Promise<void> {
  await initLiff();
  liff.closeWindow();
}

export function isInClient(): boolean {
  return liff.isInClient();
}
