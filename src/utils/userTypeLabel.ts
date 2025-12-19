export type UserTypeKey = 'student' | 'worker' | 'resident' | 'business' | 'homemaker' | 'other';

type UserTypeLabels = Partial<Record<UserTypeKey, string>>;

const USER_TYPE_ALIASES: Record<UserTypeKey, string[]> = {
  student: ['student', '학생'],
  worker: ['worker', '직장인', '근로자'],
  resident: ['resident', '거주자'],
  business: ['business', '사업자'],
  homemaker: ['homemaker', '주부'],
  other: ['other', '기타'],
};

export function getUserTypeLabel(value: string, labels: UserTypeLabels = {}): string {
  if (!value) return value;
  const normalized = value.toLowerCase();
  const matchKey = (Object.keys(USER_TYPE_ALIASES) as UserTypeKey[]).find((key) =>
    USER_TYPE_ALIASES[key].some((alias) => alias === normalized || alias === value)
  );

  if (!matchKey) return value;
  return labels[matchKey] || value;
}
