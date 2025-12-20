import 'server-only';
import type { Locale } from './config';

const dictionaries = {
  ko: () => import('../../messages/ko.json').then((module) => module.default),
  en: () => import('../../messages/en.json').then((module) => module.default),
  vi: () => import('../../messages/vi.json').then((module) => module.default),
};

type DictionaryValue = string | number | boolean | null | DictionaryValue[] | { [key: string]: DictionaryValue };
type Dictionary = Record<string, DictionaryValue>;

const isObject = (value: DictionaryValue): value is Dictionary =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const mergeDeep = (fallback: Dictionary, source: Dictionary) => {
  const output: Dictionary = { ...fallback };
  Object.entries(source).forEach(([key, value]) => {
    const fallbackValue = fallback[key];
    if (isObject(value) && isObject(fallbackValue)) {
      output[key] = mergeDeep(fallbackValue, value);
      return;
    }
    output[key] = value;
  });
  return output;
};

export const getDictionary = async (locale: Locale) => {
  if (locale === 'en') {
    const [enDict, koDict] = await Promise.all([dictionaries.en(), dictionaries.ko()]);
    return mergeDeep(koDict as Dictionary, enDict as Dictionary);
  }

  const dictFn = dictionaries[locale] || dictionaries.vi;
  return dictFn();
};
