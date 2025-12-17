const UUID_LIKE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const HEXISH_ID = /^[0-9a-fA-F-]{20,}$/;
const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function safeDisplayName(raw: string | undefined | null, fallback: string): string {
  const name = raw?.trim();
  if (!name) return fallback;
  if (UUID_LIKE.test(name) || HEXISH_ID.test(name)) return fallback;
  if (EMAIL_LIKE.test(name)) {
    const local = name.split('@')[0];
    if (!local || local.length > 20) return fallback;
    return local;
  }
  return name;
}

export function safeShortLabel(raw: string | undefined | null): string {
  const value = raw?.trim();
  if (!value) return '';
  if (UUID_LIKE.test(value) || HEXISH_ID.test(value) || value.length > 40) return '';
  return value;
}

