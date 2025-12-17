'use client';

import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { X, ShieldCheck, Edit, Info } from 'lucide-react';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import Modal from '@/components/atoms/Modal';
import Tooltip from '@/components/atoms/Tooltip';
import { useUserProfile, useMyProfile } from '@/repo/users/query';

dayjs.extend(relativeTime);

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

  dayjs.locale(locale);

  const { data: profileData, isLoading, isError, refetch, error } = useUserProfile(user?.id || '', {
    enabled: !!user?.id && isOpen,
    retry: 2,
    retryDelay: (attempt) => Math.min(2000, 1000 * 2 ** attempt),
  });
  const { data: selfProfile, isError: myProfileError, refetch: refetchMyProfile } = useMyProfile({
    enabled: !!user && isOpen,
    retry: 2,
    retryDelay: (attempt) => Math.min(2000, 1000 * 2 ** attempt),
  });

  const profile = profileData || selfProfile;

  const handleEditProfile = () => {
    onClose();
    router.push(`/${locale}/profile/edit`);
  };

  const handleVerification = () => {
    onClose();
    router.push(`/${locale}/verification/request`);
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male':
      case '남성':
        return t.male || '남성';
      case 'female':
      case '여성':
        return t.female || '여성';
      default: return t.other || '기타';
    }
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    switch (ageGroup) {
      case '10s':
      case '10대':
        return t.age10s || '10대';
      case '20s':
      case '20대':
        return t.age20s || '20대';
      case '30s':
      case '30대':
        return t.age30s || '30대';
      case '40s':
      case '40대':
        return t.age40s || '40대';
      case '50s':
      case '50대':
        return t.age50s || '50대';
      case '60plus':
      case '60대':
      case '60대+':
        return t.age60plus || '60대+';
      default: return ageGroup;
    }
  };

  const getNationalityLabel = (nationality: string) => {
    switch (nationality) {
      case 'korean':
      case '국내':
      case '한국':
      case '한국 거주':
        return t.korean || '한국 거주';
      case 'vietnamese':
      case '베트남':
      case '베트남 거주':
        return t.vietnamese || '베트남 거주';
      default: return nationality;
    }
  };

  const getUserTypeLabel = (value: string) => {
    switch (value) {
      case 'student':
      case '학생':
        return t.student || '학생';
      case 'worker':
      case '직장인':
      case '근로자':
        return t.worker || '근로자';
      case 'resident':
      case '거주자':
        return t.resident || (locale === 'vi' ? 'Cư dân' : locale === 'en' ? 'Resident' : '거주자');
      case 'business':
      case '사업자':
        return t.business || '사업자';
      case 'homemaker':
      case '주부':
        return t.homemaker || '주부';
      default:
        return value;
    }
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
            {t.myProfile || '내 프로필'}
          </h2>
          <div className="relative mr-8">
            <button
              onClick={handleEditProfile}
              className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              {t.editProfile || '프로필 편집하기'}
            </button>
            <div className="absolute -top-2 -right-2 sm:hidden">
              <Tooltip
                content={
                  t.editProfileTooltip ||
                  (locale === 'vi'
                    ? 'Chỉnh sửa hồ sơ của bạn.'
                    : locale === 'en'
                      ? 'Edit your profile.'
                      : '프로필을 수정할 수 있어요.')
                }
                position="top"
              >
                <button
                  type="button"
                  aria-label={t.editProfileTooltip || '프로필 편집 도움말'}
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
                      {t.communityMember || '커뮤니티 멤버'}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="text-gray-400">{t.joinDate || '가입일'}</span>
                        <br />
                        <span className="text-gray-700 dark:text-gray-300">
                          {dayjs(profile.joinedAt).format(locale === 'ko' ? 'YYYY년 MM월 DD일' : locale === 'vi' ? 'DD/MM/YYYY' : 'MMM DD, YYYY')}
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
                            #{getUserTypeLabel(effectiveUserType)}
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
                    <div className="text-xs text-gray-500">{t.answers || '답변'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {profile.stats?.accepted || 0}
                    </div>
                    <div className="text-xs text-gray-500">{t.adopted || '채택'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {profile.stats?.comments || 0}
                    </div>
                    <div className="text-xs text-gray-500">{t.helpful || '도움됨'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {profile.stats?.posts || 0}
                    </div>
                    <div className="text-xs text-gray-500">{t.questions || '질문'}</div>
                  </div>
                </div>

                {/* Verification Button */}
                {!profile.isVerified && (
                  <button
                    onClick={handleVerification}
                    className="w-full mt-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    {t.requestVerification || '사용자 정보 인증 신청하기'}
                  </button>
                )}
              </div>
            </>
          ) : isError || myProfileError ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-gray-500">
                {t.profileLoadError || '프로필을 불러오지 못했습니다. 다시 시도해주세요.'}
              </div>
              <div className="text-xs text-gray-400">
                {error instanceof Error ? error.message : ''}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    refetch();
                    refetchMyProfile();
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  {t.retry || '다시 시도'}
                </button>
              </div>
            </div>
          ) : !user ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-gray-500">{t.loginRequired || '로그인이 필요합니다.'}</div>
              <button
                onClick={() => router.push(`/${locale}/login`)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                {t.login || '로그인'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t.profileNotFound || '프로필을 불러올 수 없습니다.'}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
