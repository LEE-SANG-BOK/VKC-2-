import 'server-only';
import type { Locale } from './config';

const dictionaries = {
  ko: () => import('../../messages/ko.json').then((module) => module.default),
  en: () => import('../../messages/en.json').then((module) => module.default),
  vi: () => import('../../messages/vi.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  const dictFn = dictionaries[locale] || dictionaries.vi;
  return dictFn();
};
