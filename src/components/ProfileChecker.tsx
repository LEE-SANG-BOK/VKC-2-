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
    // 로딩 중이면 아무것도 하지 않음
    if (status === 'loading') return;

    // 로그인 페이지나 회원가입 페이지는 체크하지 않음
    if (pathname.includes('/login') || pathname.includes('/signup')) return;

    // 로그인했고 프로필이 미완성이면 회원가입 페이지로
    if (status === 'authenticated' && session?.user && !session.user.isProfileComplete) {
      router.push(`/${locale}/signup`);
    }
  }, [status, session, pathname, router, locale]);

  return null;
}
