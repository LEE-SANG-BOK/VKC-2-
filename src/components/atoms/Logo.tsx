'use client';

import Image from 'next/image';
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
      <Image
        src="/brand-logo.png"
        alt="Hỏi Hàn"
        width={700}
        height={168}
        priority
        sizes="140px"
        className="h-7 sm:h-8 w-auto transition-transform duration-200 group-hover:scale-[1.02]"
        draggable={false}
      />
    </Link>
  );
}
