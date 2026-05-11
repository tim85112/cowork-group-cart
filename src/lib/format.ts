export function formatNTD(n: number): string {
  return `NT$ ${n.toLocaleString('zh-Hant')}`;
}

export function formatRelativeCountdown(targetMs: number, nowMs: number = Date.now()): string {
  const diff = Math.max(0, targetMs - nowMs);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h <= 0 && m <= 0) return '已截止';
  if (h <= 0) return `剩 ${m} 分`;
  return `剩 ${h} 小時 ${m} 分`;
}

// 11:30 前算前一天的 session date（與 ReviewClose / n8n 一致）
export function getSessionDate(): string {
  const now = new Date();
  const twNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const hour = twNow.getUTCHours();
  const min = twNow.getUTCMinutes();
  if (hour < 11 || (hour === 11 && min < 30)) {
    twNow.setUTCDate(twNow.getUTCDate() - 1);
  }
  return twNow.toISOString().split('T')[0];
}
