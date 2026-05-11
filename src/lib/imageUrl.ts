const DRIVE_PATTERNS: RegExp[] = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/
];

export function normalizeImageUrl(url: string | null | undefined, width = 800): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.includes('lh3.googleusercontent.com/d/')) return trimmed;
  for (const re of DRIVE_PATTERNS) {
    const m = trimmed.match(re);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w${width}`;
  }
  return trimmed;
}
