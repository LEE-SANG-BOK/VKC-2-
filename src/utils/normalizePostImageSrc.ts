export function normalizePostImageSrc(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();
  if (lowered === 'undefined' || lowered === 'null') return null;
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return null;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|\?|#)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  if (/^[^\s]+\.[a-z0-9]{2,}(\/|\?|#)?$/i.test(trimmed)) {
    return `/${trimmed}`;
  }
  return null;
}

