'use client';

import { useState, useEffect } from 'react';
import { X, Bell, MessageCircle, Lightbulb, MessageSquare, Award, Users, Save } from 'lucide-react';
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
      toast.success(t.saveSuccess || '알림 설정이 저장되었습니다.');
      onClose();
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      setNotifications(originalNotifications);
      toast.error('알림 설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const notificationItems = [
    {
      key: 'answers' as const,
      icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
      title: t.newAnswer || '새 답변 등록',
      description: t.newAnswerDesc || '내 질문에 새로운 답변이 달리면 바로 알려드려요.',
    },
    {
      key: 'comments' as const,
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      title: t.questionComment || '질문 댓글',
      description: t.questionCommentDesc || '질문에 달린 댓글을 빠르게 확인할 수 있어요.',
    },
    {
      key: 'replies' as const,
      icon: <MessageSquare className="w-5 h-5 text-purple-500" />,
      title: t.answerComment || '답변 댓글',
      description: t.answerCommentDesc || '내 답변에 달린 피드백을 놓치지 않게 도와줘요.',
    },
    {
      key: 'adoptions' as const,
      icon: <Award className="w-5 h-5 text-green-500" />,
      title: t.adoption || '답변 채택',
      description: t.adoptionDesc || '내 답변이 채택되면 바로 알려드려요.',
    },
    {
      key: 'follows' as const,
      icon: <Users className="w-5 h-5 text-pink-500" />,
      title: t.newFollower || '새 팔로워',
      description: t.newFollowerDesc || '누군가 나를 팔로우하면 알려드려요.',
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
            {t.notificationSettings || '알림 설정'}
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
                      {t.webNotifications || '웹 알림'}
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
                    {t.notificationCategories || '알림 받을 항목'}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t.selectFew || '필요한 것만 선택'}
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
                    {t.save || '저장하기'}
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
