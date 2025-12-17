'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { dispatchHomeReset } from '@/utils/homeReset';

export default function Logo() {
  const params = useParams();
  const locale = params?.lang as string || 'ko';

  return (
    <Link
      href={`/${locale}?c=popular`}
      className="flex items-center gap-1 group"
      translate="no"
      onClick={() => dispatchHomeReset()}
    >
      <div className="h-7 w-9 flex items-center justify-center">
        <svg
          viewBox="0 0 42 34"
          className="h-7 w-auto transition-transform duration-200 group-hover:scale-105"
          aria-hidden
        >
          <path
            d="M3 6 L14 30 L25 6"
            fill="none"
            stroke="#07A3A0"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 10 L26 27 L35 10"
            fill="none"
            stroke="#8BC53F"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span
        className="text-base sm:text-lg font-bold text-[#07A3A0] leading-tight"
        translate="no"
      >
        Viet K-Connect
      </span>
    </Link>
  );
}
