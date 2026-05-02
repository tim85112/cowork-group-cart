import { useEffect, useState } from 'react';
import { formatRelativeCountdown } from '@/lib/format';

export function useCountdown(deadlineMs: number | null): string {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!deadlineMs) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [deadlineMs]);

  if (!deadlineMs) return '';
  return formatRelativeCountdown(deadlineMs, now);
}
