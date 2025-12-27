import { normalizeBadgeType, type BadgeType } from '@/lib/constants/badges';
import type { TrustLevel } from '@/components/atoms/TrustBadge';

type TrustBadgeTranslations = Record<string, string | undefined>;

export type TrustBadgePresentation = {
  show: boolean;
  level: TrustLevel;
  label: string;
  tooltip: string;
  badgeType: BadgeType | null;
};

function getLocaleFallback(locale: string) {
  const fallback = {
    verified: '검증됨',
    verifiedTooltip: '인증된 사용자 기반 정보',
    community: '커뮤니티',
    communityTooltip: '커뮤니티 신뢰 정보',
    expert: '전문가',
    expertTooltip: '전문가/공식 답변자',
    outdated: '오래된 정보',
    outdatedTooltip: '12개월 이상 지난 정보',
    verifiedStudent: '학생 인증',
    verifiedStudentTooltip: '학생 신분이 확인된 사용자',
    verifiedWorker: '직장/재직 인증',
    verifiedWorkerTooltip: '재직/직장인 증빙이 확인된 사용자',
    verifiedUser: '인증 사용자',
    verifiedUserTooltip: '신분 서류가 확인된 사용자',
    expertVisa: '비자 전문가',
    expertVisaTooltip: '비자/출입국 관련 전문 자격 또는 경력 확인',
    expertEmployment: '취업 전문가',
    expertEmploymentTooltip: '취업/채용 관련 전문 경력 확인',
    trustedAnswerer: '신뢰 답변자',
    trustedAnswererTooltip: '커뮤니티 활동 기반 신뢰 답변자',
  } as const;

  void locale;
  return fallback;
}

function pick(translations: TrustBadgeTranslations, key: string, fallback: string) {
  const value = translations[key];
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function getTrustBadgePresentation(input: {
  locale?: string;
  trustBadge?: string | null;
  author?: {
    isVerified?: boolean;
    isExpert?: boolean;
    badgeType?: string | null;
  } | null;
  translations?: TrustBadgeTranslations;
}): TrustBadgePresentation {
  const locale = input.locale || 'ko';
  const translations = input.translations || {};
  const fallback = getLocaleFallback(locale);

  const trustBadge = typeof input.trustBadge === 'string' ? input.trustBadge.trim() : '';
  const trustLevelFromPost: TrustLevel | null =
    trustBadge === 'verified' || trustBadge === 'community' || trustBadge === 'expert' || trustBadge === 'outdated'
      ? (trustBadge as TrustLevel)
      : null;

  const badgeType = normalizeBadgeType(input.author?.badgeType);

  if (trustLevelFromPost === 'outdated') {
    return {
      show: true,
      level: 'outdated',
      label: pick(translations, 'outdatedLabel', fallback.outdated),
      tooltip: pick(translations, 'outdatedTooltip', fallback.outdatedTooltip),
      badgeType,
    };
  }

  if (badgeType === 'trusted_answerer') {
    return {
      show: true,
      level: 'community',
      label: pick(translations, 'trustedAnswererLabel', fallback.trustedAnswerer),
      tooltip: pick(translations, 'trustedAnswererTooltip', fallback.trustedAnswererTooltip),
      badgeType,
    };
  }

  if (badgeType === 'verified_student') {
    return {
      show: true,
      level: 'verified',
      label: pick(translations, 'verifiedStudentLabel', fallback.verifiedStudent),
      tooltip: pick(translations, 'verifiedStudentTooltip', fallback.verifiedStudentTooltip),
      badgeType,
    };
  }

  if (badgeType === 'verified_worker') {
    return {
      show: true,
      level: 'verified',
      label: pick(translations, 'verifiedWorkerLabel', fallback.verifiedWorker),
      tooltip: pick(translations, 'verifiedWorkerTooltip', fallback.verifiedWorkerTooltip),
      badgeType,
    };
  }

  if (badgeType === 'verified_user') {
    return {
      show: true,
      level: 'verified',
      label: pick(translations, 'verifiedUserLabel', fallback.verifiedUser),
      tooltip: pick(translations, 'verifiedUserTooltip', fallback.verifiedUserTooltip),
      badgeType,
    };
  }

  if (badgeType === 'expert_visa') {
    return {
      show: true,
      level: 'expert',
      label: pick(translations, 'expertVisaLabel', fallback.expertVisa),
      tooltip: pick(translations, 'expertVisaTooltip', fallback.expertVisaTooltip),
      badgeType,
    };
  }

  if (badgeType === 'expert_employment') {
    return {
      show: true,
      level: 'expert',
      label: pick(translations, 'expertEmploymentLabel', fallback.expertEmployment),
      tooltip: pick(translations, 'expertEmploymentTooltip', fallback.expertEmploymentTooltip),
      badgeType,
    };
  }

  if (badgeType === 'expert' || input.author?.isExpert) {
    return {
      show: true,
      level: 'expert',
      label: pick(translations, 'expertLabel', fallback.expert),
      tooltip: pick(translations, 'expertTooltip', fallback.expertTooltip),
      badgeType,
    };
  }

  if (badgeType) {
    return {
      show: true,
      level: 'verified',
      label: pick(translations, 'verifiedLabel', fallback.verified),
      tooltip: pick(translations, 'verifiedTooltip', fallback.verifiedTooltip),
      badgeType,
    };
  }

  if (input.author?.isVerified || trustLevelFromPost === 'verified') {
    return {
      show: true,
      level: 'verified',
      label: pick(translations, 'verifiedLabel', fallback.verified),
      tooltip: pick(translations, 'verifiedTooltip', fallback.verifiedTooltip),
      badgeType,
    };
  }

  if (trustLevelFromPost === 'expert') {
    return {
      show: true,
      level: 'expert',
      label: pick(translations, 'expertLabel', fallback.expert),
      tooltip: pick(translations, 'expertTooltip', fallback.expertTooltip),
      badgeType,
    };
  }

  return {
    show: false,
    level: 'community',
    label: pick(translations, 'communityLabel', fallback.community),
    tooltip: pick(translations, 'communityTooltip', fallback.communityTooltip),
    badgeType,
  };
}
