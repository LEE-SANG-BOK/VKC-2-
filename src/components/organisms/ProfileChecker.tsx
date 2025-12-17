'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'nextjs-toploader/app';
import { usePathname } from 'next/navigation';

export default function ProfileChecker({ locale }: { locale: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;
    if (pathname.includes('/login') || pathname.includes('/signup')) return;

    if (status === 'authenticated' && session?.user && !session.user.isProfileComplete) {
      router.push(`/${locale}/signup`);
    }
  }, [status, session, pathname, router, locale]);

  return null;
}
