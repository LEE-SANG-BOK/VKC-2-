'use client';

import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import Button from '../atoms/Button';
import { LogIn, UserPlus } from 'lucide-react';

interface LoginPromptProps {
  onClose: () => void;
}

export default function LoginPrompt({ onClose }: LoginPromptProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';

  const text = {
    title: locale === 'vi' ? 'Cần đăng nhập' : locale === 'en' ? 'Login required' : '로그인이 필요합니다',
    desc: locale === 'vi' ? 'Vui lòng đăng nhập để dùng tính năng này.' : locale === 'en' ? 'Please log in to use this feature.' : '로그인 후 사용가능한 서비스입니다.',
    login: locale === 'vi' ? 'Đăng nhập' : locale === 'en' ? 'Log in' : '로그인 하러가기',
    signup: locale === 'vi' ? 'Đăng ký' : locale === 'en' ? 'Sign up' : '회원가입 하러가기',
    cancel: locale === 'vi' ? 'Hủy' : locale === 'en' ? 'Cancel' : '취소',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md mx-auto mt-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {text.title}
        </h2>
        <p className="text-gray-600">
          {text.desc}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => router.push(`/${locale}/login`)}
          className="w-full"
        >
          <LogIn className="h-5 w-5 mr-2" />
          {text.login}
        </Button>
        <Button
          onClick={() => router.push(`/${locale}/signup`)}
          variant="secondary"
          className="w-full"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          {text.signup}
        </Button>
        <Button
          onClick={onClose}
          variant="secondary"
          className="w-full"
        >
          {text.cancel}
        </Button>
      </div>
    </div>
  );
}
