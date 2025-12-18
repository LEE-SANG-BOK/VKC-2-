'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MIN_LENGTH, generateDisplayNameFromEmail, normalizeDisplayName } from '@/lib/utils/profile';

type SignupTranslations = {
  title: string;
  welcome: string;
  nicknameLabel: string;
  nicknamePlaceholder: string;
  nicknameHint: string;
  nationalityLabel: string;
  nationalityDomestic: string;
  nationalityOverseas: string;
  genderLabel: string;
  ageGroupLabel: string;
  userTypeLabel: string;
  selectPlaceholder: string;
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  age10s: string;
  age20s: string;
  age30s: string;
  age40s: string;
  age50s: string;
  age60plus: string;
  userTypeStudent: string;
  userTypeWorker: string;
  userTypeResident: string;
  requiredFieldsError: string;
  missingSessionError: string;
  submitFailedError: string;
  submitUnknownError: string;
  processingLabel: string;
  submitLabel: string;
};

const translations: Record<string, SignupTranslations> = {
  ko: {
    title: '시작하기',
    welcome: '기본 정보를 입력하면 더 정확한 답변을 받을 수 있어요.',
    nicknameLabel: '닉네임',
    nicknamePlaceholder: '닉네임을 입력하세요',
    nicknameHint: '{min}~{max}자 권장 · 미입력 시 자동 생성됩니다.',
    nationalityLabel: '국적',
    nationalityDomestic: '국내',
    nationalityOverseas: '해외',
    genderLabel: '성별',
    ageGroupLabel: '연령대',
    userTypeLabel: '사용자 유형',
    selectPlaceholder: '선택하세요',
    genderMale: '남성',
    genderFemale: '여성',
    genderOther: '기타',
    age10s: '10대',
    age20s: '20대',
    age30s: '30대',
    age40s: '40대',
    age50s: '50대',
    age60plus: '60대 이상',
    userTypeStudent: '학생',
    userTypeWorker: '근로자',
    userTypeResident: '거주자',
    requiredFieldsError: '모든 필드를 입력해주세요.',
    missingSessionError: '로그인 정보를 찾을 수 없습니다.',
    submitFailedError: '프로필 설정에 실패했습니다. 다시 시도해주세요.',
    submitUnknownError: '프로필 설정 중 오류가 발생했습니다.',
    processingLabel: '처리 중...',
    submitLabel: '시작하기',
  },
  en: {
    title: 'Get started',
    welcome: 'Fill in a few details to get more accurate answers.',
    nicknameLabel: 'Nickname',
    nicknamePlaceholder: 'Enter your nickname',
    nicknameHint: 'Recommended {min}–{max} characters · Auto-generated if left blank.',
    nationalityLabel: 'Nationality',
    nationalityDomestic: 'Domestic',
    nationalityOverseas: 'Overseas',
    genderLabel: 'Gender',
    ageGroupLabel: 'Age group',
    userTypeLabel: 'User type',
    selectPlaceholder: 'Select',
    genderMale: 'Male',
    genderFemale: 'Female',
    genderOther: 'Other',
    age10s: 'Teens',
    age20s: '20s',
    age30s: '30s',
    age40s: '40s',
    age50s: '50s',
    age60plus: '60+',
    userTypeStudent: 'Student',
    userTypeWorker: 'Worker',
    userTypeResident: 'Resident',
    requiredFieldsError: 'Please fill out all required fields.',
    missingSessionError: "Couldn't find login information.",
    submitFailedError: 'Failed to set up your profile. Please try again.',
    submitUnknownError: 'An error occurred while setting up your profile.',
    processingLabel: 'Processing...',
    submitLabel: 'Get started',
  },
  vi: {
    title: 'Bắt đầu',
    welcome: 'Điền một vài thông tin để nhận câu trả lời chính xác hơn.',
    nicknameLabel: 'Biệt danh',
    nicknamePlaceholder: 'Nhập biệt danh của bạn',
    nicknameHint: 'Khuyến nghị {min}–{max} ký tự · Tự động tạo nếu bỏ trống.',
    nationalityLabel: 'Quốc tịch',
    nationalityDomestic: 'Trong nước',
    nationalityOverseas: 'Nước ngoài',
    genderLabel: 'Giới tính',
    ageGroupLabel: 'Nhóm tuổi',
    userTypeLabel: 'Loại người dùng',
    selectPlaceholder: 'Chọn',
    genderMale: 'Nam',
    genderFemale: 'Nữ',
    genderOther: 'Khác',
    age10s: 'Tuổi teen',
    age20s: '20 tuổi',
    age30s: '30 tuổi',
    age40s: '40 tuổi',
    age50s: '50 tuổi',
    age60plus: '60+ tuổi',
    userTypeStudent: 'Sinh viên',
    userTypeWorker: 'Người đi làm',
    userTypeResident: 'Cư trú',
    requiredFieldsError: 'Vui lòng điền đầy đủ các trường bắt buộc.',
    missingSessionError: 'Không tìm thấy thông tin đăng nhập.',
    submitFailedError: 'Không thể thiết lập hồ sơ. Vui lòng thử lại.',
    submitUnknownError: 'Đã xảy ra lỗi khi thiết lập hồ sơ.',
    processingLabel: 'Đang xử lý...',
    submitLabel: 'Bắt đầu',
  },
};

export default function SignupPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params.lang as string) || 'ko';
  const { data: session, status, update } = useSession();
  const t = translations[lang] || translations.ko;
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
      router.push(`/${lang}`);
    }
  }, [status, session, router, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 필드 검증
    if (!formData.gender || !formData.ageGroup || !formData.userType) {
      toast.error(t.requiredFieldsError);
      return;
    }

    const normalizedNickname = normalizeDisplayName(formData.nickname);
    const nicknameFallback = generateDisplayNameFromEmail(email);
    const finalNickname = normalizedNickname.length >= DISPLAY_NAME_MIN_LENGTH ? normalizedNickname : nicknameFallback;

    if (!session?.user?.id) {
      toast.error(t.missingSessionError);
      return;
    }

    setIsSubmitting(true);

    try {
      const userTypeLabel =
        formData.userType === 'student'
          ? t.userTypeStudent
          : formData.userType === 'worker'
            ? t.userTypeWorker
            : t.userTypeResident;
      const nationalityLabel = formData.nationality === '해외' ? t.nationalityOverseas : t.nationalityDomestic;

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
          bio: `${nationalityLabel} / ${userTypeLabel}`,
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
        toast.error(t.submitFailedError);
      }
    } catch (error) {
      console.error('Error updating user info:', error);
      toast.error(t.submitUnknownError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nicknameHint = (t.nicknameHint || '')
    .replace('{min}', String(DISPLAY_NAME_MIN_LENGTH))
    .replace('{max}', String(DISPLAY_NAME_MAX_LENGTH));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.nicknameLabel}
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                placeholder={t.nicknamePlaceholder}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {nicknameHint}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.nationalityLabel}
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
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t.nationalityDomestic}</span>
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
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t.nationalityOverseas}</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.genderLabel}
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">{t.selectPlaceholder}</option>
                <option value="male">{t.genderMale}</option>
                <option value="female">{t.genderFemale}</option>
                <option value="other">{t.genderOther}</option>
              </select>
            </div>

            <div>
              <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.ageGroupLabel}
              </label>
              <select
                id="ageGroup"
                name="ageGroup"
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">{t.selectPlaceholder}</option>
                <option value="10s">{t.age10s}</option>
                <option value="20s">{t.age20s}</option>
                <option value="30s">{t.age30s}</option>
                <option value="40s">{t.age40s}</option>
                <option value="50s">{t.age50s}</option>
                <option value="60plus">{t.age60plus}</option>
              </select>
            </div>

            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.userTypeLabel}
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">{t.selectPlaceholder}</option>
                <option value="student">{t.userTypeStudent}</option>
                <option value="worker">{t.userTypeWorker}</option>
                <option value="resident">{t.userTypeResident}</option>
              </select>
            </div>

          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t.processingLabel : t.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
