'use client';

import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { X, ShieldCheck, Edit, Info } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Avatar from '@/components/atoms/Avatar';
import Modal from '@/components/atoms/Modal';
import Tooltip from '@/components/atoms/Tooltip';
import { useUserProfile } from '@/repo/users/query';
import { getUserTypeLabel } from '@/utils/userTypeLabel';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations?: Record<string, unknown>;
}
export default function ProfileModal({ isOpen, onClose, translations = {} }: ProfileModalProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.lang as string || 'ko';
  const { data: session } = useSession();
  const user = session?.user;

  const tUserMenu = (translations?.userMenu || {}) as Record<string, string>;
  const tProfile = (translations?.profile || {}) as Record<string, string>;
  const tLoginPrompt = (translations?.loginPrompt || {}) as Record<string, string>;
  const tTooltip = (translations?.tooltips || {}) as Record<string, string>;
  const modalLabels = {
    myProfile: tUserMenu.myProfile || '',
    editProfile: tUserMenu.editProfile || '',
    editProfileTooltip: tUserMenu.editProfileTooltip || tProfile.editProfileTooltip || '',
    communityMember: tUserMenu.communityMember || '',
    joinDate: tUserMenu.joinDate || '',
    answers: tUserMenu.answers || '',
    adopted: tUserMenu.adopted || '',
    helpful: tUserMenu.helpful || '',
    questions: tUserMenu.questions || '',
    requestVerification: tUserMenu.requestVerification || '',
    profileLoadError: tUserMenu.profileLoadError || tUserMenu.profileNotFound || '',
    retry: tUserMenu.retry || tUserMenu.refresh || '',
    loginRequired: tUserMenu.loginRequired || tLoginPrompt.title || '',
    login: tUserMenu.login || tLoginPrompt.login || '',
    profileNotFound: tUserMenu.profileNotFound || '',
    male: tUserMenu.male || '',
    female: tUserMenu.female || '',
    other: tUserMenu.other || '',
    age10s: tUserMenu.age10s || '',
    age20s: tUserMenu.age20s || '',
    age30s: tUserMenu.age30s || '',
    age40s: tUserMenu.age40s || '',
    age50s: tUserMenu.age50s || '',
    age60plus: tUserMenu.age60plus || '',
    korean: tUserMenu.korean || '',
    vietnamese: tUserMenu.vietnamese || '',
    student: tUserMenu.student || tProfile.userTypeStudent || '',
    worker: tUserMenu.worker || tProfile.userTypeWorker || '',
    resident: tUserMenu.resident || tProfile.userTypeResident || '',
    business: tUserMenu.business || tProfile.userTypeBusiness || '',
    homemaker: tUserMenu.homemaker || tProfile.userTypeHomemaker || '',
  };
  const closeLabel = tTooltip.close || '';

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
    const resolvedLocale = (['ko', 'en', 'vi'] as const).includes(locale as 'ko' | 'en' | 'vi') ? (locale as 'ko' | 'en' | 'vi') : 'ko';
    const dateLocale = { ko: 'ko-KR', en: 'en-US', vi: 'vi-VN' } as const;
    const dateOptions = {
      ko: { year: 'numeric', month: 'long', day: 'numeric' },
      en: { month: 'short', day: '2-digit', year: 'numeric' },
      vi: { day: '2-digit', month: '2-digit', year: 'numeric' },
    } as const;
    return new Intl.DateTimeFormat(dateLocale[resolvedLocale], dateOptions[resolvedLocale]).format(date);
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
          aria-label={closeLabel}
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
	                    <Avatar name={profile.displayName} imageUrl={profile.avatar} size="xl" />
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
