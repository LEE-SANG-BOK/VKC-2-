'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Image from 'next/image';
import { Camera, Save, Bell, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useUpdateMyProfile } from '@/repo/users/mutation';
import { useUserProfile } from '@/repo/users/query';
import { toast } from 'sonner';

interface FormData {
  name: string;
  bio: string;
  gender: string;
  ageGroup: string;
  status: string;
}

interface NotificationSettings {
  all: boolean;
  answers: boolean;
  comments: boolean;
  replies: boolean;
  adoptions: boolean;
  follows: boolean;
}

interface ProfileEditClientProps {
  lang: string;
  translations: Record<string, any>;
}

export default function ProfileEditClient({ lang, translations }: ProfileEditClientProps) {
  const router = useRouter();
  const { data: session, status: authStatus, update: updateSession } = useSession();
  const user = session?.user;

  const t = (translations?.profileEdit || {}) as Record<string, string>;

  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id || '', {
    enabled: !!user?.id,
  });

  const updateProfile = useUpdateMyProfile();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    bio: '',
    gender: '',
    ageGroup: '',
    status: '',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    all: true,
    answers: true,
    comments: true,
    replies: true,
    adoptions: true,
    follows: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.displayName || '',
        bio: profile.bio || '',
        gender: profile.gender || '',
        ageGroup: profile.ageGroup || '',
        status: profile.status || '',
      });
      const p = profile as { notifyAnswers?: boolean; notifyComments?: boolean; notifyReplies?: boolean; notifyAdoptions?: boolean; notifyFollows?: boolean };
      const answersVal = p.notifyAnswers ?? true;
      const commentsVal = p.notifyComments ?? true;
      const repliesVal = p.notifyReplies ?? true;
      const adoptionsVal = p.notifyAdoptions ?? true;
      const followsVal = p.notifyFollows ?? true;
      setNotifications({
        answers: answersVal,
        comments: commentsVal,
        replies: repliesVal,
        adoptions: adoptionsVal,
        follows: followsVal,
        all: answersVal && commentsVal && repliesVal && adoptionsVal && followsVal,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push(`/${lang}/login`);
    }
  }, [authStatus, router, lang]);

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    if (key === 'all') {
      setNotifications((prev) => {
        const newValue = !prev.all;
        return {
          all: newValue,
          answers: newValue,
          comments: newValue,
          replies: newValue,
          adoptions: newValue,
          follows: newValue,
        };
      });
    } else {
      setNotifications((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        updated.all = updated.answers && updated.comments && updated.replies && updated.adoptions && updated.follows;
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateProfile.mutateAsync({
        name: formData.name,
        displayName: formData.name,
        bio: formData.bio,
        gender: formData.gender,
        ageGroup: formData.ageGroup,
        status: formData.status,
        notifyAnswers: notifications.answers,
        notifyComments: notifications.comments,
        notifyReplies: notifications.replies,
        notifyAdoptions: notifications.adoptions,
        notifyFollows: notifications.follows,
      });

      await updateSession({ name: formData.name });

      toast.success(t.updateSuccess || '프로필이 업데이트되었습니다.');
      router.push(`/${lang}/profile/${user?.id}`);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t.updateFailed || '프로필 업데이트에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avatarPreview = profile?.avatar || user?.image || '/avatar-default.jpg';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.backButton || '뒤로 가기'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.pageTitle || '프로필 수정'}</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="relative group">
                  <Image
                    src={avatarPreview}
                    alt={formData.name || 'Profile'}
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-gray-700 object-cover"
                  />
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-red-600 to-amber-500 text-white rounded-full p-2.5 hover:from-red-700 hover:to-amber-600 transition-all duration-300 shadow-lg"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.avatarChange || '프로필 사진 변경'}</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t.nameLabel || '이름'}
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder={t.namePlaceholder || '이름을 입력하세요'}
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t.bioLabel || '자기소개'}
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
                  placeholder={t.bioPlaceholder || '자기소개를 입력하세요'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.genderLabel || '성별'}
                  </label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t.genderSelect || '선택'}</option>
                    <option value="male">{t.genderMale || '남성'}</option>
                    <option value="female">{t.genderFemale || '여성'}</option>
                    <option value="other">{t.genderOther || '기타'}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ageGroup" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.ageGroupLabel || '연령대'}
                  </label>
                  <select
                    id="ageGroup"
                    value={formData.ageGroup}
                    onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t.genderSelect || '선택'}</option>
                    <option value="10s">{t.ageGroup10s || '10대'}</option>
                    <option value="20s">{t.ageGroup20s || '20대'}</option>
                    <option value="30s">{t.ageGroup30s || '30대'}</option>
                    <option value="40s">{t.ageGroup40s || '40대'}</option>
                    <option value="50s">{t.ageGroup50s || '50대'}</option>
                    <option value="60plus">{t.ageGroup60plus || '60대+'}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.statusLabel || '상태'}
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t.genderSelect || '선택'}</option>
                    <option value="학생">{t.statusStudent || '학생'}</option>
                    <option value="직장인">{t.statusWorker || '직장인'}</option>
                    <option value="기타">{t.statusOther || '기타'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.notificationTitle || '알림 설정'}</h2>
                </div>

                <div className="space-y-4">
                  {(['all', 'answers', 'comments', 'replies', 'adoptions', 'follows'] as const).map((key) => {
                    const labels = {
                      all: t.notifyAll || '전체 알림',
                      answers: t.notifyAnswers || '답변 알림',
                      comments: t.notifyComments || '댓글 알림',
                      replies: t.notifyReplies || '대댓글 알림',
                      adoptions: t.notifyAdoptions || '채택 알림',
                      follows: t.notifyFollows || '팔로우 알림',
                    };
                    const descs = {
                      all: t.notifyAllDesc || '모든 알림을 한 번에 켜거나 끕니다',
                      answers: t.notifyAnswersDesc || '내 질문에 새 답변이 달릴 때 알림을 받습니다',
                      comments: t.notifyCommentsDesc || '내 게시글에 새 댓글이 달릴 때 알림을 받습니다',
                      replies: t.notifyRepliesDesc || '내 댓글에 답글이 달릴 때 알림을 받습니다',
                      adoptions: t.notifyAdoptionsDesc || '내 답변이 채택되었을 때 알림을 받습니다',
                      follows: t.notifyFollowsDesc || '새로운 팔로워가 생길 때 알림을 받습니다',
                    };
                    return (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-4 ${
                        key === 'all'
                          ? 'bg-gray-50 dark:bg-gray-700/50'
                          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      } rounded-lg`}
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {labels[key]}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {descs[key]}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNotificationToggle(key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                          notifications[key]
                            ? 'bg-gradient-to-r from-red-600 to-amber-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifications[key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );})
                  }
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {t.saveButton || '저장하기'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50"
                >
                  {t.cancelButton || '취소'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
