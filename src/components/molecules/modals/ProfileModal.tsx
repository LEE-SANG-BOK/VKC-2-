'use client';

import { useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { X, ShieldCheck, Edit, Info } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/atoms/Modal';
import Tooltip from '@/components/atoms/Tooltip';
import { useUserProfile } from '@/repo/users/query';
import { getUserTypeLabel } from '@/utils/userTypeLabel';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations?: Record<string, string>;
}



export default function ProfileModal({ isOpen, onClose, translations = {} }: ProfileModalProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.lang as string || 'ko';
  const { data: session } = useSession();
  const user = session?.user;

  const t = translations;
  const modalFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        myProfile: 'My Profile',
        editProfile: 'Edit Profile',
        editProfileTooltip: 'Edit your profile.',
        communityMember: 'Community Member',
        joinDate: 'Joined',
        answers: 'Answers',
        adopted: 'Adopted',
        helpful: 'Helpful',
        questions: 'Questions',
        requestVerification: 'Request verification',
        profileLoadError: 'Unable to load profile. Please try again.',
        retry: 'Retry',
        loginRequired: 'Login required.',
        login: 'Log in',
        profileNotFound: 'Profile not found.',
        male: 'Male',
        female: 'Female',
        other: 'Other',
        age10s: 'Teens',
        age20s: '20s',
        age30s: '30s',
        age40s: '40s',
        age50s: '50s',
        age60plus: '60+',
        korean: 'Living in Korea',
        vietnamese: 'Living in Vietnam',
        student: 'Student',
        worker: 'Worker',
        resident: 'Resident',
        business: 'Business Owner',
        homemaker: 'Homemaker',
      };
    }
    if (locale === 'vi') {
      return {
        myProfile: 'Hồ sơ của tôi',
        editProfile: 'Chỉnh sửa hồ sơ',
        editProfileTooltip: 'Chỉnh sửa hồ sơ của bạn.',
        communityMember: 'Thành viên cộng đồng',
        joinDate: 'Ngày tham gia',
        answers: 'Câu trả lời',
        adopted: 'Được chọn',
        helpful: 'Hữu ích',
        questions: 'Câu hỏi',
        requestVerification: 'Yêu cầu xác minh',
        profileLoadError: 'Không thể tải hồ sơ. Vui lòng thử lại.',
        retry: 'Thử lại',
        loginRequired: 'Vui lòng đăng nhập.',
        login: 'Đăng nhập',
        profileNotFound: 'Không thể tải hồ sơ.',
        male: 'Nam',
        female: 'Nữ',
        other: 'Khác',
        age10s: '10-19 tuổi',
        age20s: '20-29 tuổi',
        age30s: '30-39 tuổi',
        age40s: '40-49 tuổi',
        age50s: '50-59 tuổi',
        age60plus: '60+ tuổi',
        korean: 'Sống tại Hàn Quốc',
        vietnamese: 'Sống tại Việt Nam',
        student: 'Sinh viên',
        worker: 'Người lao động',
        resident: 'Cư dân',
        business: 'Chủ doanh nghiệp',
        homemaker: 'Nội trợ',
      };
    }
    return {
      myProfile: '내 프로필',
      editProfile: '프로필 편집하기',
      editProfileTooltip: '프로필을 수정할 수 있어요.',
      communityMember: '커뮤니티 멤버',
      joinDate: '가입일',
      answers: '답변',
      adopted: '채택',
      helpful: '도움됨',
      questions: '질문',
      requestVerification: '사용자 정보 인증 신청하기',
      profileLoadError: '프로필을 불러오지 못했습니다. 다시 시도해주세요.',
      retry: '다시 시도',
      loginRequired: '로그인이 필요합니다.',
      login: '로그인',
      profileNotFound: '프로필을 불러올 수 없습니다.',
      male: '남성',
      female: '여성',
      other: '기타',
      age10s: '10대',
      age20s: '20대',
      age30s: '30대',
      age40s: '40대',
      age50s: '50대',
      age60plus: '60대+',
      korean: '한국 거주',
      vietnamese: '베트남 거주',
      student: '학생',
      worker: '근로자',
      resident: '거주자',
      business: '사업자',
      homemaker: '주부',
    };
  }, [locale]);
  const modalLabels = {
    myProfile: t.myProfile || modalFallbacks.myProfile,
    editProfile: t.editProfile || modalFallbacks.editProfile,
    editProfileTooltip: t.editProfileTooltip || modalFallbacks.editProfileTooltip,
    communityMember: t.communityMember || modalFallbacks.communityMember,
    joinDate: t.joinDate || modalFallbacks.joinDate,
    answers: t.answers || modalFallbacks.answers,
    adopted: t.adopted || modalFallbacks.adopted,
    helpful: t.helpful || modalFallbacks.helpful,
    questions: t.questions || modalFallbacks.questions,
    requestVerification: t.requestVerification || modalFallbacks.requestVerification,
    profileLoadError: t.profileLoadError || modalFallbacks.profileLoadError,
    retry: t.retry || modalFallbacks.retry,
    loginRequired: t.loginRequired || modalFallbacks.loginRequired,
    login: t.login || modalFallbacks.login,
    profileNotFound: t.profileNotFound || modalFallbacks.profileNotFound,
    male: t.male || modalFallbacks.male,
    female: t.female || modalFallbacks.female,
    other: t.other || modalFallbacks.other,
    age10s: t.age10s || modalFallbacks.age10s,
    age20s: t.age20s || modalFallbacks.age20s,
    age30s: t.age30s || modalFallbacks.age30s,
    age40s: t.age40s || modalFallbacks.age40s,
    age50s: t.age50s || modalFallbacks.age50s,
    age60plus: t.age60plus || modalFallbacks.age60plus,
    korean: t.korean || modalFallbacks.korean,
    vietnamese: t.vietnamese || modalFallbacks.vietnamese,
    student: t.student || modalFallbacks.student,
    worker: t.worker || modalFallbacks.worker,
    resident: t.resident || modalFallbacks.resident,
    business: t.business || modalFallbacks.business,
    homemaker: t.homemaker || modalFallbacks.homemaker,
  };

  const { data: profile, isLoading, isError, refetch, error } = useUserProfile(user?.id || '', {
    enabled: !!user?.id && isOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(2000, 1000 * 2 ** attempt),
  });

  const handleEditProfile = () => {
    onClose();
    router.push(`/${locale}/profile/edit`);
  };

  const handleVerification = () => {
    onClose();
    router.push(`/${locale}/verification/request`);
  };

  const formatJoinDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    if (locale === 'vi') {
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    }

    if (locale === 'en') {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(date);
    }

    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male':
      case '남성':
        return modalLabels.male;
      case 'female':
      case '여성':
        return modalLabels.female;
      default: return modalLabels.other;
    }
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    switch (ageGroup) {
      case '10s':
      case '10대':
        return modalLabels.age10s;
      case '20s':
      case '20대':
        return modalLabels.age20s;
      case '30s':
      case '30대':
        return modalLabels.age30s;
      case '40s':
      case '40대':
        return modalLabels.age40s;
      case '50s':
      case '50대':
        return modalLabels.age50s;
      case '60plus':
      case '60대':
      case '60대+':
        return modalLabels.age60plus;
      default: return ageGroup;
    }
  };

  const getNationalityLabel = (nationality: string) => {
    switch (nationality) {
      case 'korean':
      case '국내':
      case '한국':
      case '한국 거주':
        return modalLabels.korean;
      case 'vietnamese':
      case '베트남':
      case '베트남 거주':
        return modalLabels.vietnamese;
      default: return nationality;
    }
  };

  const userTypeLabels = {
    student: modalLabels.student,
    worker: modalLabels.worker,
    resident: modalLabels.resident,
    business: modalLabels.business,
    homemaker: modalLabels.homemaker,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-[500px]">
      <div className="relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {modalLabels.myProfile}
          </h2>
          <div className="relative mr-8">
            <button
              onClick={handleEditProfile}
              className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              {modalLabels.editProfile}
            </button>
            <div className="absolute -top-2 -right-2 sm:hidden">
              <Tooltip
                content={modalLabels.editProfileTooltip}
                position="top"
              >
                <button
                  type="button"
                  aria-label={modalLabels.editProfileTooltip}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/60 text-gray-600 dark:text-gray-200 shadow-sm"
                >
                  <Info className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : profile ? (
            <>
              {/* Profile Card */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {profile.avatar ? (
                      <Image
                        src={profile.avatar}
                        alt={profile.displayName}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {profile.displayName?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {profile.displayName}
                      </h3>
                      {profile.isVerified && (
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {modalLabels.communityMember}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="text-gray-400">{modalLabels.joinDate}</span>
                        <br />
                        <span className="text-gray-700 dark:text-gray-300">
                          {formatJoinDate(profile.joinedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {profile.nationality && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                          #{getNationalityLabel(profile.nationality)}
                        </span>
                      )}
                      {profile.gender && (
                        <span className="px-2 py-0.5 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full">
                          #{getGenderLabel(profile.gender)}
                        </span>
                      )}
                      {profile.ageGroup && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                          #{getAgeGroupLabel(profile.ageGroup)}
                        </span>
                      )}
                      {(() => {
                        const legacyStatus = profile.status;
                        const effectiveUserType =
                          profile.userType ||
                          (legacyStatus && legacyStatus !== 'banned' && legacyStatus !== 'suspended' ? legacyStatus : null);
                        if (!effectiveUserType) return null;
                        return (
                          <span className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                            #{getUserTypeLabel(effectiveUserType, userTypeLabels)}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Stats - 가로 정렬 */}
                <div className="flex justify-around border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {profile.stats?.accepted || 0}
                    </div>
                    <div className="text-xs text-gray-500">{modalLabels.answers}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {profile.stats?.accepted || 0}
                    </div>
                    <div className="text-xs text-gray-500">{modalLabels.adopted}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {profile.stats?.comments || 0}
                    </div>
                    <div className="text-xs text-gray-500">{modalLabels.helpful}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {profile.stats?.posts || 0}
                    </div>
                    <div className="text-xs text-gray-500">{modalLabels.questions}</div>
                  </div>
                </div>

                {/* Verification Button */}
                {!profile.isVerified && (
                  <button
                    onClick={handleVerification}
                    className="w-full mt-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    {modalLabels.requestVerification}
                  </button>
                )}
              </div>
            </>
          ) : isError ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-gray-500">
                {modalLabels.profileLoadError}
              </div>
              <div className="text-xs text-gray-400">
                {error instanceof Error ? error.message : ''}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    refetch();
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  {modalLabels.retry}
                </button>
              </div>
            </div>
          ) : !user ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-gray-500">{modalLabels.loginRequired}</div>
              <button
                onClick={() => router.push(`/${locale}/login`)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                {modalLabels.login}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {modalLabels.profileNotFound}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
