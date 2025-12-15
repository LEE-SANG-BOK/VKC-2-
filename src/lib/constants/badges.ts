export const BADGE_TYPES = [
  'verified_student',
  'verified_worker',
  'verified_user',
  'expert',
  'expert_visa',
  'expert_employment',
  'trusted_answerer',
] as const;

export type BadgeType = (typeof BADGE_TYPES)[number];

export function normalizeBadgeType(value: unknown): BadgeType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const match = (BADGE_TYPES as readonly string[]).includes(normalized) ? normalized : null;
  return match as BadgeType | null;
}

export function isExpertBadgeType(value: unknown): boolean {
  const badgeType = normalizeBadgeType(value);
  return badgeType === 'expert' || badgeType === 'expert_visa' || badgeType === 'expert_employment';
}

export function suggestBadgeType(input: {
  verificationType?: string | null;
  visaType?: string | null;
  industry?: string | null;
  jobTitle?: string | null;
  extraInfo?: string | null;
}): BadgeType {
  const type = (input.verificationType || '').trim().toLowerCase();
  if (type === 'student') return 'verified_student';
  if (type === 'worker' || type === 'business') return 'verified_worker';
  if (type !== 'expert') return 'verified_user';

  const corpus = [input.visaType, input.industry, input.jobTitle, input.extraInfo]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const visaSignals = [
    'visa',
    '비자',
    '출입국',
    '이민국',
    'immigration',
    'law',
    'legal',
    '행정사',
    '변호사',
    '법률',
  ];
  if (visaSignals.some((token) => corpus.includes(token))) return 'expert_visa';

  const employmentSignals = [
    'employment',
    'job',
    'career',
    'recruit',
    'recruiter',
    'hr',
    '채용',
    '취업',
    '커리어',
    '인사',
  ];
  if (employmentSignals.some((token) => corpus.includes(token))) return 'expert_employment';

  return 'expert';
}

