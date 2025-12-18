'use client';

import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import Button from '@/components/atoms/Button';
import { LogIn, UserPlus } from 'lucide-react';

interface LoginPromptTexts {
  title?: string;
  desc?: string;
  login?: string;
  signup?: string;
  cancel?: string;
}

interface LoginPromptProps {
  onClose: () => void;
  variant?: 'inline' | 'modal';
  translations?: {
    login?: LoginPromptTexts;
    common?: {
      signup?: string;
      cancel?: string;
      login?: string;
    };
  };
}

export default function LoginPrompt({ onClose, variant = 'inline', translations }: LoginPromptProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';

  const loginTexts = translations?.login || {};
  const commonTexts = translations?.common || {};

  const title = loginTexts.title || (locale === 'vi' ? 'Cần đăng nhập' : locale === 'en' ? 'Login required' : '로그인이 필요합니다');
  const desc = loginTexts.desc || (locale === 'vi' ? 'Vui lòng đăng nhập để dùng tính năng này.' : locale === 'en' ? 'Please log in to use this feature.' : '로그인 후 사용가능한 서비스입니다.');
  const loginButton = loginTexts.login || commonTexts.login || (locale === 'vi' ? 'Đăng nhập' : locale === 'en' ? 'Log in' : '로그인');
  const signupFallback = locale === 'vi' ? 'Bắt đầu' : locale === 'en' ? 'Get started' : '시작하기';
  const rawSignup = (loginTexts.signup || commonTexts.signup || '').trim();
  const shouldOverrideSignup = !rawSignup || ['회원가입', 'Sign up', 'Sign Up', 'Đăng ký'].includes(rawSignup);
  const signupButton = shouldOverrideSignup ? signupFallback : rawSignup;
  const cancelButton = loginTexts.cancel || commonTexts.cancel || (locale === 'vi' ? 'Hủy' : locale === 'en' ? 'Cancel' : '취소');

  const containerClassName =
    variant === 'modal'
      ? 'p-6'
      : 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 max-w-md mx-auto mt-8';

  return (
    <div className={containerClassName}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        <p className="text-gray-600">
          {desc}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => router.push(`/${locale}/login`)}
          className="w-full"
        >
          <LogIn className="h-5 w-5 mr-2" />
          {loginButton}
        </Button>
        <Button
          onClick={() => router.push(`/${locale}/signup`)}
          variant="secondary"
          className="w-full"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          {signupButton}
        </Button>
        <Button
          onClick={onClose}
          variant="secondary"
          className="w-full"
        >
          {cancelButton}
        </Button>
      </div>
    </div>
  );
}
