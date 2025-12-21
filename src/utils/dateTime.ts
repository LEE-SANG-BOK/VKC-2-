import dayjs from 'dayjs';

export function getJustNowLabel(locale: string) {
  const resolvedLocale = (['ko', 'en', 'vi'] as const).includes(locale as 'ko' | 'en' | 'vi') ? (locale as 'ko' | 'en' | 'vi') : 'ko';
  const labelByLocale = {
    ko: '방금 전',
    en: 'Just now',
    vi: 'Vừa xong',
  } as const;
  return labelByLocale[resolvedLocale] || labelByLocale.ko;
}

export function formatDateTime(dateString?: string | null, locale?: string): string {
  if (!dateString) return '';
  if (locale && dateString === getJustNowLabel(locale)) return dateString;

  const date = dayjs(dateString);
  if (!date.isValid()) return dateString;

  return date.format('YYYY.MM.DD HH:mm');
}
