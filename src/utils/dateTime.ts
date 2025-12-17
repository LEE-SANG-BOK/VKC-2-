import dayjs from 'dayjs';

export function getJustNowLabel(locale: string) {
  if (locale === 'vi') return 'Vừa xong';
  if (locale === 'en') return 'Just now';
  return '방금 전';
}

export function formatDateTime(dateString?: string | null, locale?: string): string {
  if (!dateString) return '';
  if (locale && dateString === getJustNowLabel(locale)) return dateString;

  const date = dayjs(dateString);
  if (!date.isValid()) return dateString;

  return date.format('YYYY.MM.DD HH:mm');
}

