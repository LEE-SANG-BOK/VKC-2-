const FILE_LIKE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp']);

export function normalizePostImageSrc(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const decoded = decodeHtmlEntities(trimmed).trim();
  if (!decoded) return null;

  const lowered = decoded.toLowerCase();
  if (lowered === 'undefined' || lowered === 'null') return null;
  if (decoded.startsWith('blob:') || decoded.startsWith('data:')) return null;
  if (decoded.startsWith('//')) return `https:${decoded}`;
  if (decoded.startsWith('/') || decoded.startsWith('http://') || decoded.startsWith('https://')) {
    return decoded;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|\?|#)/i.test(decoded)) {
    return `https://${decoded}`;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(decoded)) {
    const ext = decoded.split('.').pop()?.toLowerCase() ?? '';
    if (!FILE_LIKE_EXTENSIONS.has(ext)) {
      return `https://${decoded}`;
    }
  }
  if (/^[^\s]+\.[a-z0-9]{2,}(\/|\?|#)?$/i.test(decoded)) {
    return `/${decoded}`;
  }
  return null;
}

function decodeHtmlEntities(input: string): string {
  if (!input.includes('&')) return input;
  const basic = input
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  return basic
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => {
      const parsed = Number.parseInt(code, 16);
      if (!Number.isFinite(parsed)) return _;
      return String.fromCodePoint(parsed);
    })
    .replace(/&#(\d+);/g, (_, code: string) => {
      const parsed = Number.parseInt(code, 10);
      if (!Number.isFinite(parsed)) return _;
      return String.fromCodePoint(parsed);
    });
}
