export const i18n = {
  defaultLocale: 'vi',
  locales: ['ko', 'en', 'vi'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
