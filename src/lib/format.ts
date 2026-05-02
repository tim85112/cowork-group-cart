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
