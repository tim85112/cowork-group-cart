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

export async function sendOrderFlex(
  total: number,
  pickup_code: string,
  members: Array<{
    user_name: string;
    isOwner: boolean;
    items: Array<{ food_name: string; spec1: string | null; spec2: string | null; unit_price: number; quantity: number }>;
  }>
): Promise<void> {
  await initLiff();
  if (!liff.isInClient()) throw new Error('liff.isInClient()=false，請從 LINE app 內開啟 LIFF。');

  const fmt = (n: number) => 'NT$ ' + n.toLocaleString('en-US');

  const secs = members.map(m => {
    const sub = m.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const rows = m.items.map(i => ({
      type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: i.food_name + ' x' + i.quantity + (i.spec1 ? ' ' + [i.spec1, i.spec2].filter(Boolean).join('/') : ''), size: 'sm', color: '#555555', flex: 5, wrap: true },
        { type: 'text', text: fmt(i.unit_price * i.quantity), size: 'sm', color: '#555555', align: 'end', flex: 2 }
      ]
    }));
    return {
      type: 'box', layout: 'vertical', margin: 'md', spacing: 'xs', contents: [
        { type: 'text', text: m.user_name + (m.isOwner ? ' (團主)' : ''), weight: 'bold', size: 'md', color: '#c94625' },
        ...rows,
        { type: 'text', text: '小計 ' + fmt(sub), size: 'sm', color: '#888888', align: 'end' }
      ]
    };
  });

  const bubble = {
    type: 'bubble',
    header: {
      type: 'box', layout: 'vertical', backgroundColor: '#c94625', paddingAll: 'md',
      contents: [{ type: 'text', text: '🧾 完成揪團！', weight: 'bold', color: '#ffffff', size: 'lg' }]
    },
    body: {
      type: 'box', layout: 'vertical', spacing: 'sm', contents: [
        { type: 'text', text: '總計 ' + fmt(total), weight: 'bold', size: 'xl', color: '#c94625' },
        { type: 'separator', margin: 'md' },
        {
          type: 'box', layout: 'vertical', margin: 'sm', spacing: 'xs', contents: [
            { type: 'text', text: '取餐碼', weight: 'bold', size: 'sm', color: '#555555', align: 'center' },
            { type: 'text', text: pickup_code, weight: 'bold', size: 'xl', color: '#555555', align: 'center' }
          ]
        },
        { type: 'separator', margin: 'md' },
        ...secs,
        { type: 'separator', margin: 'md' },
        { type: 'text', text: '付款連結產製中，請稍後⏳', weight: 'bold', size: 'sm', color: '#c94625', align: 'center', margin: 'md', wrap: true }
      ]
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await liff.sendMessages([{ type: 'flex', altText: '揪團收單：' + fmt(total), contents: bubble as any }]);
}

export async function sendSoloOrderFlex(
  total: number,
  pickup_code: string,
  customerName: string,
  items: Array<{
    food_name: string;
    spec1: string | null;
    spec2: string | null;
    unit_price: number;
    quantity: number;
  }>
): Promise<void> {
  await initLiff();
  if (!liff.isInClient()) throw new Error('liff.isInClient()=false，請從 LINE app 內開啟 LIFF。');

  const fmt = (n: number) => 'NT$ ' + n.toLocaleString('en-US');

  const rows = items.map((i) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text:
          i.food_name +
          ' x' +
          i.quantity +
          (i.spec1 ? ' ' + [i.spec1, i.spec2].filter(Boolean).join('/') : ''),
        size: 'sm',
        color: '#555555',
        flex: 5,
        wrap: true
      },
      {
        type: 'text',
        text: fmt(i.unit_price * i.quantity),
        size: 'sm',
        color: '#555555',
        align: 'end',
        flex: 2
      }
    ]
  }));

  const bubble = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#c94625',
      paddingAll: 'md',
      contents: [
        { type: 'text', text: '🧾 完成訂購！', weight: 'bold', color: '#ffffff', size: 'lg' }
      ]
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        { type: 'text', text: '總計 ' + fmt(total), weight: 'bold', size: 'xl', color: '#c94625' },
        { type: 'separator', margin: 'md' },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'sm',
          spacing: 'xs',
          contents: [
            {
              type: 'text',
              text: '取餐碼',
              weight: 'bold',
              size: 'sm',
              color: '#555555',
              align: 'center'
            },
            {
              type: 'text',
              text: pickup_code,
              weight: 'bold',
              size: 'xl',
              color: '#555555',
              align: 'center'
            }
          ]
        },
        { type: 'separator', margin: 'md' },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          spacing: 'xs',
          contents: [
            {
              type: 'text',
              text: customerName,
              weight: 'bold',
              size: 'md',
              color: '#c94625'
            },
            ...rows
          ]
        },
        { type: 'separator', margin: 'md' },
        {
          type: 'text',
          text: '付款連結產製中，請稍後⏳',
          weight: 'bold',
          size: 'sm',
          color: '#c94625',
          align: 'center',
          margin: 'md',
          wrap: true
        }
      ]
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await liff.sendMessages([{ type: 'flex', altText: '訂購完成：' + fmt(total), contents: bubble as any }]);
}

export async function closeWindow(): Promise<void> {
  await initLiff();
  liff.closeWindow();
}

export function isInClient(): boolean {
  return liff.isInClient();
}
