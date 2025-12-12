'use client';

import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';

type LoginTranslations = {
  title: string;
  welcome: string;
  googleLogin: string;
  demoMode?: string;
};

const translations: Record<string, LoginTranslations> = {
  ko: {
    title: '로그인',
    welcome: 'K-Connect Q&A 커뮤니티에 오신 것을 환영합니다',
    googleLogin: 'Google로 로그인',
    demoMode: '',
  },
  en: {
    title: 'Login',
    welcome: 'Welcome to K-Connect Q&A Community',
    googleLogin: 'Sign in with Google',
    demoMode: '',
  },
  vi: {
    title: 'Đăng nhập',
    welcome: 'Chào mừng đến với Cộng đồng Hỏi đáp K-Connect',
    googleLogin: 'Đăng nhập với Google',
    demoMode: '',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || 'ko';
  const { data: session, status } = useSession();

  const t = translations[lang] || translations.ko;

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (!session.user.isProfileComplete) {
        router.push(`/${lang}/signup`);
      } else {
        router.push(`/${lang}`);
      }
    }
  }, [status, session, router, lang]);

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: `/${lang}/login` });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md dark:shadow-gray-900/50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-yellow-300 font-bold text-lg">★</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t.title}
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {t.welcome}
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t.googleLogin}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t.demoMode}
          </p>
        </div>
      </div>
    </div>
  );
}
