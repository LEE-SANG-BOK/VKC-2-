'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

const locales = ['ko', 'en', 'vi'] as const;
const visibleLocales = ['ko', 'vi'] as const;
type Locale = (typeof locales)[number];

const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  vi: 'Tiếng Việt',
};

export default function LanguageSwitcher() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLocale = (params.lang as Locale) || 'ko';

  const handleLocaleChange = (newLocale: Locale) => {
    setIsOpen(false);

    // 현재 경로에서 언어 부분만 교체
    const segments = pathname.split('/').filter(Boolean);
    segments[0] = newLocale;
    const newPathname = '/' + segments.join('/');

    router.push(newPathname);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef} data-testid="language-switcher">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Language"
        data-testid="language-switcher-toggle"
        className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-300"
      >
        <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden md:inline text-xs sm:text-sm">{localeNames[currentLocale]}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-32 sm:w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          data-testid="language-switcher-menu"
        >
          {visibleLocales.map((locale) => (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              data-testid={`language-option-${locale}`}
              className={`w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors first:rounded-t-lg last:rounded-b-lg ${currentLocale === locale ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
            >
              {localeNames[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
