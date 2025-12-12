'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MIN_LENGTH, generateDisplayNameFromEmail, normalizeDisplayName } from '@/lib/utils/profile';

export default function SignupPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const { data: session, status, update } = useSession();
  const email = session?.user?.email || '';
  const [formData, setFormData] = useState({
    nationality: '국내',
    gender: '',
    ageGroup: '',
    userType: '',
    nickname: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      nickname: prev.nickname || generateDisplayNameFromEmail(email),
    }));
  }, [email]);

  // 로그인하지 않은 사용자는 로그인 페이지로
  // 로그인했고 프로필이 완성된 사용자는 홈으로
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/login`);
    } else if (status === 'authenticated' && session?.user?.isProfileComplete) {
      router.push("/");
    }
  }, [status, session, router, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 필드 검증
    if (!formData.gender || !formData.ageGroup || !formData.userType) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    const normalizedNickname = normalizeDisplayName(formData.nickname);
    const nicknameFallback = generateDisplayNameFromEmail(email);
    const finalNickname = normalizedNickname.length >= DISPLAY_NAME_MIN_LENGTH ? normalizedNickname : nicknameFallback;

    if (!session?.user?.id) {
      toast.error('로그인 정보를 찾을 수 없습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userTypeLabel =
        formData.userType === 'student' ? '학생' : formData.userType === 'worker' ? '근로자' : '거주자';

      // 사용자 정보 업데이트 API 호출
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender: formData.gender,
          ageGroup: formData.ageGroup,
          nationality: formData.nationality,
          userType: formData.userType,
          bio: `${formData.nationality} / ${userTypeLabel}`,
          displayName: finalNickname,
          isProfileComplete: true,
        }),
      });

      if (response.ok) {
        // 세션 업데이트
        await update({ isProfileComplete: true });
        // 페이지 전체 새로고침으로 세션 완전히 갱신
        window.location.href = `/${lang}`;
      } else {
        toast.error('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Error updating user info:', error);
      toast.error('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-yellow-300 font-bold text-lg">★</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              회원가입
            </h2>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                placeholder="닉네임을 입력하세요"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {DISPLAY_NAME_MIN_LENGTH}~{DISPLAY_NAME_MAX_LENGTH}자 권장 · 미입력 시 자동 생성됩니다.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                국적
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="nationality"
                    value="국내"
                    checked={formData.nationality === '국내'}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">국내</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="nationality"
                    value="해외"
                    checked={formData.nationality === '해외'}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">해외</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                성별
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div>
              <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                연령대
              </label>
              <select
                id="ageGroup"
                name="ageGroup"
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                <option value="10s">10대</option>
                <option value="20s">20대</option>
                <option value="30s">30대</option>
                <option value="40s">40대</option>
                <option value="50s">50대</option>
                <option value="60plus">60대 이상</option>
              </select>
            </div>

            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                사용자 유형
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                <option value="student">학생</option>
                <option value="worker">근로자</option>
                <option value="resident">거주자</option>
              </select>
            </div>

          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '처리 중...' : '회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
