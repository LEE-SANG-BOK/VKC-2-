'use client';

import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Lightbulb, Sparkles, Users, TrendingUp } from 'lucide-react';

interface VietnamBannerProps {
  translations: any;
}

export default function VietnamBanner({ translations }: VietnamBannerProps) {
  const t = translations?.banner || {};
  const router = useRouter();
  const params = useParams();
  const locale = params?.lang as string || 'ko';
  const { data: session } = useSession();
  const user = session?.user;

  const handleAskQuestion = () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    router.push(`/${locale}/posts/new?type=question`);
  };

  const handleSharePost = () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    router.push(`/${locale}/posts/new?type=share`);
  };

  const handleVerification = () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    router.push(`/${locale}/verification/request`);
  };

  return (
    <div className="w-full px-3 py-4">
      <div className="relative container mx-auto overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 rounded-2xl shadow-xl">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

        {/* Floating Shapes */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative px-4 py-8 sm:py-10">
        {/* Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-xs font-semibold text-white">{t.badge || '베트남 한인 커뮤니티'}</span>
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          </div>
        </div>

        {/* Title with Icon */}
        <div className="flex flex-col items-center justify-center gap-3 mb-4">
          <div className="relative">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-md opacity-40 animate-pulse"></div>
            <Lightbulb className="relative w-10 h-10 sm:w-12 sm:h-12 text-yellow-300 fill-yellow-300 drop-shadow-lg" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center drop-shadow-lg leading-tight max-w-3xl">
            {t.title || '베트남 Q&A 커뮤니티'}
          </h2>
        </div>

        {/* Description */}
        <p className="text-center text-sm sm:text-base text-white/90 mb-6 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          {t.description || '베트남 생활의 모든 것을 물어보세요'}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6">
          <div className="flex items-center gap-1.5 text-white/90">
            <Users className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">{t.members || '10,000+ 회원'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/90">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">{t.questions || '5,000+ 질문 답변'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/90">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">{t.updates || '매일 업데이트'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleAskQuestion}
            className="group relative w-full sm:w-auto px-6 sm:px-8 py-2.5 bg-white hover:bg-gray-50 text-blue-600 font-bold text-sm rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative flex items-center justify-center gap-1.5">
              {user ? t.askQuestion || '질문하기' : t.loginButton || '로그인하고 질문하기'}
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            onClick={handleSharePost}
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-sm rounded-lg border-2 border-white/30 hover:border-white/50 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
          >
            {user ? t.sharePost || '공유하기' : t.shareButton || '로그인하고 공유하기'}
          </button>

          <button
            onClick={handleVerification}
            className="group relative w-full sm:w-auto px-6 sm:px-8 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-sm rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative flex items-center justify-center gap-1.5">
              ⭐ {user ? t.verification || '인증 신청' : t.verificationButton || '로그인 후 인증 신청'}
            </span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
