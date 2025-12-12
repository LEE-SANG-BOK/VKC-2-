export function sanitizeDisplayName(input: string | undefined | null, fallback = 'vietkconnect') {
  const base = (input ?? '').normalize('NFKC').trim();
  const cleaned = base
    // 허용: 문자/숫자/공백/언더스코어/하이픈/마침표
    .replace(/[^\p{L}\p{N}_ .-]+/gu, '')
    .replace(/\s+/g, '-');

  const clipped = cleaned.slice(0, 24);
  return clipped.length > 2 ? clipped : fallback;
}

export function generateDisplayNameFromEmail(email?: string | null) {
  const localPart = (email || '').split('@')[0] || 'vietkconnect';
  const sanitizedLocal = sanitizeDisplayName(localPart, 'vietkconnect');
  const suffix = Math.random().toString().slice(2, 6);
  return `${sanitizedLocal}-${suffix}`;
}
