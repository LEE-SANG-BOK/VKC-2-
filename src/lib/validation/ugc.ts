export const UGC_LIMITS = {
  postTitle: {
    min: 10,
    max: 120,
  },
  postContent: {
    min: 10,
    max: 8000,
  },
  answerContent: {
    min: 10,
    max: 5000,
  },
  commentContent: {
    min: 10,
    max: 800,
  },
} as const;

export function extractPlainText(input: string): string {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getPlainTextLength(input: string): number {
  return extractPlainText(input).length;
}

export function isLowQualityText(input: string): boolean {
  const text = extractPlainText(input);
  const compact = text.replace(/\s+/g, '');
  const core = compact.replace(/[^\p{L}\p{N}]+/gu, '');

  if (!core) return true;
  if (/^\d+$/.test(core)) return true;
  if (/^[ㄱ-ㅎㅏ-ㅣ]+$/.test(core)) return true;
  if (/(.)\1{7,}/u.test(core)) return true;

  const uniqueCount = new Set(core).size;
  if (core.length >= 12 && uniqueCount <= 2) return true;
  return false;
}

export type UgcValidationErrorCode =
  | 'UGC_REQUIRED'
  | 'UGC_TOO_SHORT'
  | 'UGC_TOO_LONG'
  | 'UGC_LOW_QUALITY';

export type UgcValidationResult =
  | { ok: true; length: number }
  | {
      ok: false;
      code: UgcValidationErrorCode;
      length: number;
      min: number;
      max: number;
    };

export function validateUgcText(input: string, min: number, max: number): UgcValidationResult {
  const length = getPlainTextLength(input);
  if (length === 0) {
    return { ok: false, code: 'UGC_REQUIRED', length, min, max };
  }
  if (length < min) {
    return { ok: false, code: 'UGC_TOO_SHORT', length, min, max };
  }
  if (length > max) {
    return { ok: false, code: 'UGC_TOO_LONG', length, min, max };
  }
  if (isLowQualityText(input)) {
    return { ok: false, code: 'UGC_LOW_QUALITY', length, min, max };
  }
  return { ok: true, length };
}
