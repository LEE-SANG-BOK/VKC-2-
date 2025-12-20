import 'server-only';
import type { Locale } from './config';

type DictionaryJson = Record<string, any>;

const dictionaries: Record<Locale, () => Promise<DictionaryJson>> = {
  ko: () => import('../../messages/ko.json').then((module) => module.default),
  en: () => import('../../messages/en.json').then((module) => module.default),
  vi: () => import('../../messages/vi.json').then((module) => module.default),
};

const isObject = (value: unknown): value is DictionaryJson =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const mergeDeep = (fallback: DictionaryJson, source: DictionaryJson) => {
  const output: DictionaryJson = { ...fallback };
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

export const getDictionary = async (locale: Locale): Promise<DictionaryJson> => {
  if (locale === 'en') {
    const [enDict, koDict] = await Promise.all([dictionaries.en(), dictionaries.ko()]);
    return mergeDeep(koDict, enDict);
  }

  const dictFn = dictionaries[locale] || dictionaries.vi;
  return dictFn();
};
