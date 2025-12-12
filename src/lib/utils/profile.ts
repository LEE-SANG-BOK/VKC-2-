export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 16;

export function normalizeDisplayName(input: string | undefined | null) {
  const base = (input ?? '').normalize('NFKC').trim();
  const cleaned = base
    .replace(/[^\p{L}\p{N}_ .-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[-_.]+$/g, '')
    .replace(/^[-_.]+/g, '');

  const clipped = cleaned.slice(0, DISPLAY_NAME_MAX_LENGTH);
  return clipped.replace(/[-_.]+$/g, '').replace(/^[-_.]+/g, '');
}

export function sanitizeDisplayName(input: string | undefined | null, fallback = 'vietkconnect') {
  const normalized = normalizeDisplayName(input);
  return normalized.length >= DISPLAY_NAME_MIN_LENGTH ? normalized : fallback;
}

export function generateDisplayNameFromEmail(email?: string | null) {
  const localPart = (email || '').split('@')[0] || 'vietkconnect';
  const sanitizedLocal = sanitizeDisplayName(localPart, 'vietkconnect');
  const suffix = Math.random().toString().slice(2, 6);
  const maxBaseLength = Math.max(1, DISPLAY_NAME_MAX_LENGTH - (suffix.length + 1));
  return `${sanitizedLocal.slice(0, maxBaseLength)}-${suffix}`;
}
