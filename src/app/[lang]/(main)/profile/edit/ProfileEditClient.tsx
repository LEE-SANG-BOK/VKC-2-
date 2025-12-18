'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Image from 'next/image';
import { Camera, Save, Bell, ArrowLeft, Info } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateMyProfile } from '@/repo/users/mutation';
import { useMyProfile } from '@/repo/users/query';
import { queryKeys } from '@/repo/keys';
import { toast } from 'sonner';
import Tooltip from '@/components/atoms/Tooltip';
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MIN_LENGTH, generateDisplayNameFromEmail, normalizeDisplayName } from '@/lib/utils/profile';

type AvatarSource = ImageBitmap | HTMLImageElement;

function isHeicImage(file: File) {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif');
}

async function loadAvatarSource(file: File): Promise<AvatarSource> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = document.createElement('img');
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image'));
    };
    img.src = url;
  });
}

function getAvatarSourceSize(source: AvatarSource) {
  if (source instanceof ImageBitmap) {
    return { width: source.width, height: source.height };
  }
  return { width: source.naturalWidth || source.width, height: source.naturalHeight || source.height };
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Failed to encode image'));
        else resolve(blob);
      },
      type,
      quality
    );
  });
}

async function normalizeAvatarImage(file: File) {
  const source = await loadAvatarSource(file);
  const { width, height } = getAvatarSourceSize(source);
  const cropSize = Math.max(1, Math.min(width, height));
  const sx = Math.max(0, (width - cropSize) / 2);
  const sy = Math.max(0, (height - cropSize) / 2);

  const target = 512;
  const canvas = document.createElement('canvas');
  canvas.width = target;
  canvas.height = target;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source as any, sx, sy, cropSize, cropSize, 0, 0, target, target);

  if (source instanceof ImageBitmap) {
    source.close();
  }

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9);
  const baseName = (file.name || 'avatar').replace(/\.[^/.]+$/, '') || 'avatar';
  return new File([blob], `${baseName}.jpg`, { type: blob.type });
}

interface FormData {
  name: string;
  bio: string;
  gender: string;
  ageGroup: string;
  userType: string;
  status: string;
  visaType: string;
  koreanLevel: string;
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

const VISA_TYPES = ['D-2', 'D-10', 'E-7-1', 'E-7-2', 'E-7-3', 'F-2-7', 'F-6'];
const KOREAN_LEVELS = [
  { value: 'beginner', label: { ko: '기초', vi: 'Sơ cấp', en: 'Beginner' } },
  { value: 'intermediate', label: { ko: '중급', vi: 'Trung cấp', en: 'Intermediate' } },
  { value: 'advanced', label: { ko: '고급', vi: 'Cao cấp', en: 'Advanced' } },
];

export default function ProfileEditClient({ lang, translations }: ProfileEditClientProps) {
  const router = useRouter();
  const { data: session, status: authStatus, update: updateSession } = useSession();
  const user = session?.user;
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarBlobUrlRef = useRef<string | null>(null);

  const t = (translations?.profileEdit || {}) as Record<string, string>;

  const { data: profile, isLoading: profileLoading } = useMyProfile({
    enabled: !!user?.id,
  });

  const updateProfile = useUpdateMyProfile();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    bio: '',
    gender: '',
    ageGroup: '',
    userType: '',
    status: '',
    visaType: '',
    koreanLevel: '',
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
  const [avatarPreviewOverride, setAvatarPreviewOverride] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const fallbackDisplayName = useMemo(() => (
    user?.email ? generateDisplayNameFromEmail(user.email) : ''
  ), [user?.email]);

  useEffect(() => {
    if (profile) {
      const legacyType = profile.status;
      const resolvedUserType =
        profile.userType ||
        (legacyType && legacyType !== 'banned' && legacyType !== 'suspended'
          ? legacyType === '학생' || legacyType === 'student'
            ? 'student'
            : legacyType === '직장인' || legacyType === 'worker'
              ? 'worker'
              : legacyType === '거주자' || legacyType === 'resident'
                ? 'resident'
                : ''
          : '');

      setFormData({
        name: profile.displayName || profile.username || fallbackDisplayName,
        bio: profile.bio || '',
        gender: profile.gender || '',
        ageGroup: profile.ageGroup || '',
        userType: resolvedUserType,
        status: legacyType || '',
        visaType: profile.visaType || '',
        koreanLevel: profile.koreanLevel || '',
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
  }, [fallbackDisplayName, profile]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push(`/${lang}/login`);
    }
  }, [authStatus, router, lang]);

  useEffect(() => {
    return () => {
      if (avatarBlobUrlRef.current) {
        URL.revokeObjectURL(avatarBlobUrlRef.current);
        avatarBlobUrlRef.current = null;
      }
    };
  }, []);

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
      const normalizedName = normalizeDisplayName(formData.name);
      const invalidNameLabel =
        t.nameValidationError ||
        (lang === 'vi'
          ? `Biệt danh phải từ ${DISPLAY_NAME_MIN_LENGTH}–${DISPLAY_NAME_MAX_LENGTH} ký tự.`
          : lang === 'en'
            ? `Nickname must be ${DISPLAY_NAME_MIN_LENGTH}–${DISPLAY_NAME_MAX_LENGTH} characters.`
            : `닉네임은 ${DISPLAY_NAME_MIN_LENGTH}~${DISPLAY_NAME_MAX_LENGTH}자여야 합니다.`);

      if (normalizedName.length < DISPLAY_NAME_MIN_LENGTH) {
        toast.error(invalidNameLabel);
        return;
      }

      await updateProfile.mutateAsync({
        name: normalizedName,
        displayName: normalizedName,
        bio: formData.bio,
        gender: formData.gender,
        ageGroup: formData.ageGroup,
        userType: formData.userType || undefined,
        visaType: formData.visaType || null,
        koreanLevel: formData.koreanLevel || null,
        status: formData.status || undefined,
        notifyAnswers: notifications.answers,
        notifyComments: notifications.comments,
        notifyReplies: notifications.replies,
        notifyAdoptions: notifications.adoptions,
        notifyFollows: notifications.follows,
      });

      await updateSession({ name: normalizedName });

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

  const profileImage = (profile as { image?: string | null } | null)?.image;
  const avatarPreview = avatarPreviewOverride || profile?.avatar || profileImage || user?.image || '/avatar-default.jpg';
  const avatarUnoptimized = avatarPreview.startsWith('blob:') || avatarPreview.startsWith('data:');

  const handleAvatarPick = () => {
    if (!user?.id || isAvatarUploading) return;
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    const previousAvatar = avatarPreviewOverride || profile?.avatar || user?.image || null;

    const onlyImagesLabel =
      lang === 'vi' ? 'Chỉ cho phép tệp ảnh.' : lang === 'en' ? 'Only image files are allowed.' : '이미지 파일만 업로드할 수 있습니다.';
    const tooLargeLabel =
      lang === 'vi' ? 'Kích thước ảnh phải ≤ 20MB.' : lang === 'en' ? 'Image must be 20MB or less.' : '이미지 크기는 20MB 이하여야 합니다.';
    const uploadFailedLabel =
      lang === 'vi' ? 'Tải ảnh đại diện thất bại.' : lang === 'en' ? 'Failed to upload profile photo.' : '프로필 사진 업로드에 실패했습니다.';
    const uploadSuccessLabel =
      lang === 'vi' ? 'Đã cập nhật ảnh đại diện.' : lang === 'en' ? 'Profile photo updated.' : '프로필 사진이 업데이트되었습니다.';
    const decodeFailedLabel =
      lang === 'vi'
        ? 'Không thể xử lý ảnh. Vui lòng chọn ảnh JPG/PNG.'
        : lang === 'en'
          ? 'Failed to process image. Please choose a JPG/PNG.'
          : '이미지를 처리할 수 없습니다. JPG/PNG 이미지를 선택해주세요.';
    const heicUnsupportedLabel =
      lang === 'vi'
        ? 'Ảnh HEIC/HEIF chưa được hỗ trợ. Vui lòng chọn JPG/PNG.'
        : lang === 'en'
          ? 'HEIC/HEIF is not supported. Please choose a JPG/PNG.'
          : 'HEIC/HEIF 형식은 아직 지원되지 않습니다. JPG/PNG 이미지를 선택해주세요.';

    const isImageFile = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(file.name || '');
    if (!isImageFile) {
      toast.error(onlyImagesLabel);
      event.target.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error(tooLargeLabel);
      event.target.value = '';
      return;
    }

    if (avatarBlobUrlRef.current) {
      URL.revokeObjectURL(avatarBlobUrlRef.current);
      avatarBlobUrlRef.current = null;
    }

    setIsAvatarUploading(true);

    try {
      let normalizedFile: File;
      try {
        normalizedFile = await normalizeAvatarImage(file);
      } catch {
        toast.error(isHeicImage(file) ? heicUnsupportedLabel : decodeFailedLabel);
        setIsAvatarUploading(false);
        event.target.value = '';
        return;
      }

      const optimisticUrl = URL.createObjectURL(normalizedFile);
      avatarBlobUrlRef.current = optimisticUrl;
      setAvatarPreviewOverride(optimisticUrl);

      const uploadFormData = new FormData();
      uploadFormData.append('file', normalizedFile);

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: uploadFormData,
        credentials: 'include',
      });

      const result = await res.json();

      if (!res.ok || !result?.success || !result?.data?.url) {
        throw new Error(result?.error || uploadFailedLabel);
      }

      const uploadedUrl = String(result.data.url);

      if (avatarBlobUrlRef.current) {
        URL.revokeObjectURL(avatarBlobUrlRef.current);
        avatarBlobUrlRef.current = null;
      }

      setAvatarPreviewOverride(uploadedUrl);
      await updateSession({ image: uploadedUrl });

      queryClient.setQueryData(queryKeys.users.detail(user.id), (prev) => {
        if (!prev || typeof prev !== 'object') return prev;
        return { ...(prev as Record<string, unknown>), avatar: uploadedUrl };
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(user.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      toast.success(t.avatarUploadSuccess || uploadSuccessLabel);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      if (avatarBlobUrlRef.current) {
        URL.revokeObjectURL(avatarBlobUrlRef.current);
        avatarBlobUrlRef.current = null;
      }
      setAvatarPreviewOverride(previousAvatar);
      toast.error((error instanceof Error ? error.message : '') || t.avatarUploadFailed || uploadFailedLabel);
    } finally {
      setIsAvatarUploading(false);
      event.target.value = '';
    }
  };

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
                    unoptimized={avatarUnoptimized}
                    className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-gray-700 object-cover"
                  />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    onClick={handleAvatarPick}
                    disabled={!user?.id || isAvatarUploading}
                    aria-label={t.avatarChange || '프로필 사진 변경'}
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-red-600 to-amber-500 text-white rounded-full p-2.5 hover:from-red-700 hover:to-amber-600 transition-all duration-300 shadow-lg"
                  >
                    {isAvatarUploading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{t.avatarChange || '프로필 사진 변경'}</span>
                  <Tooltip
                    content={
                      t.avatarTooltip ||
                      (lang === 'vi'
                        ? 'Bạn có thể dùng ảnh bất kỳ để dễ nhận diện.'
                        : lang === 'en'
                          ? 'Upload any image that helps others recognize you.'
                          : '식별 가능한 이미지를 업로드해 주세요.')
                    }
                    position="top"
                  >
                    <button
                      type="button"
                      aria-label={t.avatarTooltip || '프로필 사진 도움말'}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t.nameLabel || '이름'}
                  </label>
                  <Tooltip
                    content={
                      t.nameTooltip ||
                      (lang === 'vi'
                        ? 'Tên này sẽ được hiển thị công khai trên hồ sơ và bài viết.'
                        : lang === 'en'
                          ? 'This name will be shown publicly on your profile and posts.'
                          : '프로필과 게시글에 공개로 표시되는 이름입니다.')
                    }
                    position="top"
                  >
                    <button
                      type="button"
                      aria-label={t.nameTooltip || '이름 도움말'}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={DISPLAY_NAME_MAX_LENGTH}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder={t.namePlaceholder || '이름을 입력하세요'}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t.bioLabel || '자기소개'}
                  </label>
                  <Tooltip
                    content={
                      t.bioTooltip ||
                      (lang === 'vi'
                        ? 'Giới thiệu ngắn giúp mọi người hiểu bạn tốt hơn.'
                        : lang === 'en'
                          ? 'A short intro helps others understand you.'
                          : '간단한 소개를 적으면 신뢰도와 소통이 좋아져요.')
                    }
                    position="top"
                  >
                    <button
                      type="button"
                      aria-label={t.bioTooltip || '자기소개 도움말'}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t.genderLabel || '성별'}
                    </label>
                    <Tooltip
                      content={
                        t.genderTooltip ||
                        (lang === 'vi'
                          ? 'Không bắt buộc. Dùng để cá nhân hóa gợi ý.'
                          : lang === 'en'
                            ? 'Optional. Used to personalize recommendations.'
                            : '선택 사항입니다. 맞춤 추천에 활용됩니다.')
                      }
                      position="top"
                    >
                      <button
                        type="button"
                        aria-label={t.genderTooltip || '성별 도움말'}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <label htmlFor="ageGroup" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t.ageGroupLabel || '연령대'}
                    </label>
                    <Tooltip
                      content={
                        t.ageGroupTooltip ||
                        (lang === 'vi'
                          ? 'Không bắt buộc. Dùng để cá nhân hóa gợi ý.'
                          : lang === 'en'
                            ? 'Optional. Used to personalize recommendations.'
                            : '선택 사항입니다. 맞춤 추천에 활용됩니다.')
                      }
                      position="top"
                    >
                      <button
                        type="button"
                        aria-label={t.ageGroupTooltip || '연령대 도움말'}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <label htmlFor="userType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t.userTypeLabel || t.statusLabel || (lang === 'vi' ? 'Loại người dùng' : lang === 'en' ? 'User type' : '사용자 유형')}
                    </label>
                    <Tooltip
                      content={
                        t.userTypeTooltip ||
                        t.statusTooltip ||
                        (lang === 'vi'
                          ? 'Không bắt buộc. Chọn loại người dùng của bạn.'
                          : lang === 'en'
                            ? 'Optional. Choose your user type.'
                            : '선택 사항입니다. 사용자 유형을 선택해 주세요.')
                      }
                      position="top"
                    >
                      <button
                        type="button"
                        aria-label={t.userTypeTooltip || t.statusTooltip || (lang === 'vi' ? 'Loại người dùng 도움말' : lang === 'en' ? 'User type help' : '사용자 유형 도움말')}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                  <select
                    id="userType"
                    value={formData.userType}
                    onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t.genderSelect || '선택'}</option>
                    <option value="student">{t.userTypeStudent || t.statusStudent || (lang === 'vi' ? 'Sinh viên' : lang === 'en' ? 'Student' : '학생')}</option>
                    <option value="worker">{t.userTypeWorker || t.statusWorker || (lang === 'vi' ? 'Người lao động' : lang === 'en' ? 'Worker' : '근로자')}</option>
                    <option value="resident">{t.userTypeResident || (lang === 'vi' ? 'Cư dân' : lang === 'en' ? 'Resident' : '거주자')}</option>
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
