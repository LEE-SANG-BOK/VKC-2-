'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { X, Bell, MessageCircle, Lightbulb, MessageSquare, Award, Users, Save, Rss } from 'lucide-react';
import Modal from '@/components/atoms/Modal';
import { useSession } from 'next-auth/react';
import { useUserProfile } from '@/repo/users/query';
import { useUpdateMyProfile } from '@/repo/users/mutation';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations?: Record<string, string>;
}

interface NotificationSettings {
  answers: boolean;
  comments: boolean;
  replies: boolean;
  adoptions: boolean;
  follows: boolean;
}

export default function SettingsModal({ isOpen, onClose, translations = {} }: SettingsModalProps) {
  const t = translations;
  const router = useRouter();
  const params = useParams();
  const locale = params.lang as string || 'ko';
  const { data: session } = useSession();
  const user = session?.user;
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id || '', {
    enabled: !!user?.id && isOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const updateProfile = useUpdateMyProfile();
  const settingsFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        notificationSettings: 'Notification Settings',
        webNotifications: 'Web notifications',
        notificationCategories: 'Notifications to receive',
        selectFew: 'Choose only what you need',
        save: 'Save',
        saveSuccess: 'Notification settings saved.',
        saveError: 'Failed to save notification settings.',
        newAnswer: 'New answer',
        newAnswerDesc: 'Get notified when someone answers your question.',
        questionComment: 'Question comments',
        questionCommentDesc: 'Quickly check comments on your questions.',
        answerComment: 'Answer comments',
        answerCommentDesc: 'Never miss feedback on your answers.',
        adoption: 'Answer adopted',
        adoptionDesc: 'Get notified when your answer is adopted.',
        newFollower: 'New follower',
        newFollowerDesc: 'Get notified when someone follows you.',
        subscriptionSettings: 'Subscription settings',
        subscriptionSettingsDesc: 'Manage category and topic subscriptions plus notification frequency.',
        manageSubscriptions: 'Manage subscriptions',
      };
    }
    if (locale === 'vi') {
      return {
        notificationSettings: 'Cài đặt thông báo',
        webNotifications: 'Thông báo web',
        notificationCategories: 'Chọn thông báo muốn nhận',
        selectFew: 'Chỉ chọn mục cần thiết',
        save: 'Lưu',
        saveSuccess: 'Đã lưu cài đặt thông báo.',
        saveError: 'Không thể lưu cài đặt thông báo.',
        newAnswer: 'Có câu trả lời mới',
        newAnswerDesc: 'Nhận thông báo khi ai đó trả lời câu hỏi của bạn.',
        questionComment: 'Bình luận câu hỏi',
        questionCommentDesc: 'Theo dõi nhanh bình luận trên câu hỏi của bạn.',
        answerComment: 'Bình luận câu trả lời',
        answerCommentDesc: 'Không bỏ lỡ phản hồi cho câu trả lời của bạn.',
        adoption: 'Câu trả lời được chọn',
        adoptionDesc: 'Nhận thông báo khi câu trả lời của bạn được chọn.',
        newFollower: 'Người theo dõi mới',
        newFollowerDesc: 'Nhận thông báo khi có người theo dõi bạn.',
        subscriptionSettings: 'Cài đặt theo dõi',
        subscriptionSettingsDesc: 'Quản lý danh mục/chủ đề theo dõi và tần suất nhận thông báo.',
        manageSubscriptions: 'Quản lý theo dõi',
      };
    }
    return {
      notificationSettings: '알림 설정',
      webNotifications: '웹 알림',
      notificationCategories: '알림 받을 항목',
      selectFew: '필요한 것만 선택',
      save: '저장하기',
      saveSuccess: '알림 설정이 저장되었습니다.',
      saveError: '알림 설정 저장에 실패했습니다.',
      newAnswer: '새 답변 등록',
      newAnswerDesc: '내 질문에 새로운 답변이 달리면 바로 알려드려요.',
      questionComment: '질문 댓글',
      questionCommentDesc: '질문에 달린 댓글을 빠르게 확인할 수 있어요.',
      answerComment: '답변 댓글',
      answerCommentDesc: '내 답변에 달린 피드백을 놓치지 않게 도와줘요.',
      adoption: '답변 채택',
      adoptionDesc: '내 답변이 채택되면 바로 알려드려요.',
      newFollower: '새 팔로워',
      newFollowerDesc: '누군가 나를 팔로우하면 알려드려요.',
      subscriptionSettings: '구독 설정',
      subscriptionSettingsDesc: '카테고리/토픽 구독과 알림 빈도를 관리할 수 있어요.',
      manageSubscriptions: '구독 관리',
    };
  }, [locale]);
  const settingsLabels = {
    notificationSettings: t.notificationSettings || settingsFallbacks.notificationSettings,
    webNotifications: t.webNotifications || settingsFallbacks.webNotifications,
    notificationCategories: t.notificationCategories || settingsFallbacks.notificationCategories,
    selectFew: t.selectFew || settingsFallbacks.selectFew,
    save: t.save || settingsFallbacks.save,
    saveSuccess: t.saveSuccess || settingsFallbacks.saveSuccess,
    saveError: t.saveError || settingsFallbacks.saveError,
    newAnswer: t.newAnswer || settingsFallbacks.newAnswer,
    newAnswerDesc: t.newAnswerDesc || settingsFallbacks.newAnswerDesc,
    questionComment: t.questionComment || settingsFallbacks.questionComment,
    questionCommentDesc: t.questionCommentDesc || settingsFallbacks.questionCommentDesc,
    answerComment: t.answerComment || settingsFallbacks.answerComment,
    answerCommentDesc: t.answerCommentDesc || settingsFallbacks.answerCommentDesc,
    adoption: t.adoption || settingsFallbacks.adoption,
    adoptionDesc: t.adoptionDesc || settingsFallbacks.adoptionDesc,
    newFollower: t.newFollower || settingsFallbacks.newFollower,
    newFollowerDesc: t.newFollowerDesc || settingsFallbacks.newFollowerDesc,
    subscriptionSettings: t.subscriptionSettings || settingsFallbacks.subscriptionSettings,
    subscriptionSettingsDesc: t.subscriptionSettingsDesc || settingsFallbacks.subscriptionSettingsDesc,
    manageSubscriptions: t.manageSubscriptions || settingsFallbacks.manageSubscriptions,
  };

  const [webNotificationsEnabled, setWebNotificationsEnabled] = useState(true);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    answers: true,
    comments: true,
    replies: true,
    adoptions: true,
    follows: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
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
      });
      setWebNotificationsEnabled(answersVal || commentsVal || repliesVal || adoptionsVal || followsVal);
    }
  }, [profile]);

  const toggleWebNotifications = () => {
    const newValue = !webNotificationsEnabled;
    setWebNotificationsEnabled(newValue);
    if (!newValue) {
      setNotifications({
        answers: false,
        comments: false,
        replies: false,
        adoptions: false,
        follows: false,
      });
    } else {
      setNotifications({
        answers: true,
        comments: true,
        replies: true,
        adoptions: true,
        follows: true,
      });
    }
  };

  const toggleNotificationSetting = (key: keyof NotificationSettings) => {
    if (!webNotificationsEnabled) return;

    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setWebNotificationsEnabled(Object.values(updated).some(v => v));
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const originalNotifications = { ...notifications };
    
    try {
      await updateProfile.mutateAsync({
        notifyAnswers: notifications.answers,
        notifyComments: notifications.comments,
        notifyReplies: notifications.replies,
        notifyAdoptions: notifications.adoptions,
        notifyFollows: notifications.follows,
      });
      toast.success(settingsLabels.saveSuccess);
      onClose();
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      setNotifications(originalNotifications);
      toast.error(settingsLabels.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const notificationItems = [
    {
      key: 'answers' as const,
      icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
      title: settingsLabels.newAnswer,
      description: settingsLabels.newAnswerDesc,
    },
    {
      key: 'comments' as const,
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      title: settingsLabels.questionComment,
      description: settingsLabels.questionCommentDesc,
    },
    {
      key: 'replies' as const,
      icon: <MessageSquare className="w-5 h-5 text-purple-500" />,
      title: settingsLabels.answerComment,
      description: settingsLabels.answerCommentDesc,
    },
    {
      key: 'adoptions' as const,
      icon: <Award className="w-5 h-5 text-green-500" />,
      title: settingsLabels.adoption,
      description: settingsLabels.adoptionDesc,
    },
    {
      key: 'follows' as const,
      icon: <Users className="w-5 h-5 text-pink-500" />,
      title: settingsLabels.newFollower,
      description: settingsLabels.newFollowerDesc,
    },
  ];

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
        <div className="px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {settingsLabels.notificationSettings}
          </h2>
        </div>

        {profileLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Content */}
            <div className="px-5 pb-5 space-y-4">
              {/* Web Notifications Toggle */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {settingsLabels.webNotifications}
                    </h3>
                  </div>
                  <button
                    onClick={toggleWebNotifications}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      webNotificationsEnabled
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        webNotificationsEnabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Notification Categories */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {settingsLabels.notificationCategories}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {settingsLabels.selectFew}
                  </span>
                </div>

                <div className="space-y-2">
                  {notificationItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => toggleNotificationSetting(item.key)}
                      disabled={!webNotificationsEnabled}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        !webNotificationsEnabled
                          ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                          : notifications[item.key]
                          ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <div className="text-left">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          notifications[item.key] && webNotificationsEnabled
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {notifications[item.key] && webNotificationsEnabled && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Rss className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {settingsLabels.subscriptionSettings}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {settingsLabels.subscriptionSettingsDesc}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/${locale}/subscriptions`);
                    }}
                    className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    {settingsLabels.manageSubscriptions}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer with Save Button */}
            <div className="px-5 pb-5 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {settingsLabels.save}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
