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
import MainLayout from '@/components/templates/MainLayout';
import { DEFAULT_BLUR_DATA_URL } from '@/lib/constants/images';
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

export default function ProfileEditClient({ lang, translations }: ProfileEditClientProps) {
  const router = useRouter();
  const { data: session, status: authStatus, update: updateSession } = useSession();
  const user = session?.user;
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarBlobUrlRef = useRef<string | null>(null);

  const t = (translations?.profileEdit || {}) as Record<string, string>;
  const tErrors = (translations?.errors || {}) as Record<string, string>;
  const copy = useMemo(() => {
    return {
      avatarChange: t.avatarChange || '',
      avatarTooltip: t.avatarTooltip || '',
      nameTooltip: t.nameTooltip || '',
      bioTooltip: t.bioTooltip || '',
      genderTooltip: t.genderTooltip || '',
      ageGroupTooltip: t.ageGroupTooltip || '',
      userTypeTooltip: t.statusTooltip || '',
      nameValidationError: t.nameValidationError || '',
      updateSuccess: t.updateSuccess || '',
      updateFailed: t.updateFailed || '',
      avatarOnlyImages: t.avatarOnlyImages || '',
      avatarTooLarge: t.avatarTooLarge || '',
      avatarUploadFailed: t.avatarUploadFailed || '',
      avatarUploadSuccess: t.avatarUploadSuccess || '',
      avatarDecodeFailed: t.avatarDecodeFailed || '',
      avatarHeicUnsupported: t.avatarHeicUnsupported || '',
      backButton: t.backButton || '',
      pageTitle: t.pageTitle || '',
      profileAlt: t.profileAlt || '',
      nameLabel: t.nameLabel || '',
      namePlaceholder: t.namePlaceholder || '',
      bioLabel: t.bioLabel || '',
      bioPlaceholder: t.bioPlaceholder || '',
      genderLabel: t.genderLabel || '',
      selectLabel: t.genderSelect || '',
      genderMale: t.genderMale || '',
      genderFemale: t.genderFemale || '',
      genderOther: t.genderOther || '',
      ageGroupLabel: t.ageGroupLabel || '',
      ageGroup10s: t.ageGroup10s || '',
      ageGroup20s: t.ageGroup20s || '',
      ageGroup30s: t.ageGroup30s || '',
      ageGroup40s: t.ageGroup40s || '',
      ageGroup50s: t.ageGroup50s || '',
      ageGroup60plus: t.ageGroup60plus || '',
      userTypeLabel: t.statusLabel || '',
      userTypeStudent: t.statusStudent || '',
      userTypeWorker: t.statusWorker || '',
      userTypeResident: t.statusResident || '',
      notificationTitle: t.notificationTitle || '',
      notifyAll: t.notifyAll || '',
      notifyAnswers: t.notifyAnswers || '',
      notifyComments: t.notifyComments || '',
      notifyReplies: t.notifyReplies || '',
      notifyAdoptions: t.notifyAdoptions || '',
      notifyFollows: t.notifyFollows || '',
      notifyAllDesc: t.notifyAllDesc || '',
      notifyAnswersDesc: t.notifyAnswersDesc || '',
      notifyCommentsDesc: t.notifyCommentsDesc || '',
      notifyRepliesDesc: t.notifyRepliesDesc || '',
      notifyAdoptionsDesc: t.notifyAdoptionsDesc || '',
      notifyFollowsDesc: t.notifyFollowsDesc || '',
      saveButton: t.saveButton || '',
      cancelButton: t.cancelButton || '',
    };
  }, [t]);

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
      const invalidNameLabel = copy.nameValidationError;

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

      toast.success(copy.updateSuccess);
      router.push(`/${lang}/profile/${user?.id}`);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(copy.updateFailed);
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
  const rawAvatarPreview = avatarPreviewOverride || profile?.avatar || profileImage || user?.image || '/avatar-default.jpg';
  const normalizedAvatarPreview = (() => {
    if (typeof rawAvatarPreview !== 'string') return rawAvatarPreview;
    const trimmed = rawAvatarPreview.trim();
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (!trimmed.startsWith('http') && trimmed.includes('ui-avatars.com')) {
      const cleaned = trimmed.replace(/^\/+/, '');
      return `https://${cleaned}`;
    }
    return trimmed;
  })();
  const isUiAvatars = (() => {
    if (typeof normalizedAvatarPreview !== 'string') return false;
    if (!normalizedAvatarPreview.includes('ui-avatars.com')) return false;
    try {
      return new URL(normalizedAvatarPreview).hostname === 'ui-avatars.com';
    } catch {
      return true;
    }
  })();
  const avatarPreview = (() => {
    if (typeof normalizedAvatarPreview !== 'string') return normalizedAvatarPreview;
    if (!isUiAvatars) return normalizedAvatarPreview;
    try {
      const parsed = new URL(normalizedAvatarPreview);
      if (!parsed.searchParams.has('format')) parsed.searchParams.set('format', 'png');
      if (!parsed.searchParams.has('size')) parsed.searchParams.set('size', '256');
      return parsed.toString();
    } catch {
      return normalizedAvatarPreview;
    }
  })();
  const avatarUnoptimized = avatarPreview.startsWith('blob:') || avatarPreview.startsWith('data:') || isUiAvatars;

  const handleAvatarPick = () => {
    if (!user?.id || isAvatarUploading) return;
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    const previousAvatar = avatarPreviewOverride || profile?.avatar || user?.image || null;

    const isImageFile = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(file.name || '');
    if (!isImageFile) {
      toast.error(copy.avatarOnlyImages);
      event.target.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error(copy.avatarTooLarge);
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
        toast.error(isHeicImage(file) ? copy.avatarHeicUnsupported : copy.avatarDecodeFailed);
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
        const message = (result?.code && tErrors[result.code]) || result?.error || copy.avatarUploadFailed;
        throw new Error(message);
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
      toast.success(copy.avatarUploadSuccess);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      if (avatarBlobUrlRef.current) {
        URL.revokeObjectURL(avatarBlobUrlRef.current);
        avatarBlobUrlRef.current = null;
      }
      setAvatarPreviewOverride(previousAvatar);
      toast.error((error instanceof Error ? error.message : '') || copy.avatarUploadFailed);
    } finally {
      setIsAvatarUploading(false);
      event.target.value = '';
    }
  };

  return (
    <MainLayout hideSidebar centerVariant="canvas" translations={translations}>
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                <ArrowLeft className="w-5 h-5" />
                {copy.backButton}
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.pageTitle}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="relative group">
                  {avatarUnoptimized ? (
                    <img
                      src={avatarPreview}
                      alt={formData.name || copy.profileAlt}
                      width={128}
                      height={128}
                      className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-gray-700 object-cover"
                    />
                  ) : (
                    <Image
                      src={avatarPreview}
                      alt={formData.name || copy.profileAlt}
                      width={128}
                      height={128}
                      sizes="128px"
                      className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-gray-700 object-cover"
                      placeholder="blur"
                      blurDataURL={DEFAULT_BLUR_DATA_URL}
                    />
                  )}
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
                    aria-label={copy.avatarChange}
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
                  <span>{copy.avatarChange}</span>
                  <Tooltip
                    content={copy.avatarTooltip}
                    position="top"
                  >
                    <button
                      type="button"
                      aria-label={copy.avatarTooltip}
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
                    {copy.nameLabel}
                  </label>
                  <Tooltip
                    content={copy.nameTooltip}
                    position="top"
                  >
                    <button
                      type="button"
                      aria-label={copy.nameTooltip}
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
                  placeholder={copy.namePlaceholder}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {copy.bioLabel}
                  </label>
                  <Tooltip
                    content={copy.bioTooltip}
                    position="top"
                  >
                    <button
                      type="button"
                      aria-label={copy.bioTooltip}
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
                  placeholder={copy.bioPlaceholder}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {copy.genderLabel}
                    </label>
                    <Tooltip
                      content={copy.genderTooltip}
                      position="top"
                    >
                      <button
                        type="button"
                        aria-label={copy.genderTooltip}
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
                    <option value="">{copy.selectLabel}</option>
                    <option value="male">{copy.genderMale}</option>
                    <option value="female">{copy.genderFemale}</option>
                    <option value="other">{copy.genderOther}</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label htmlFor="ageGroup" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {copy.ageGroupLabel}
                    </label>
                    <Tooltip
                      content={copy.ageGroupTooltip}
                      position="top"
                    >
                      <button
                        type="button"
                        aria-label={copy.ageGroupTooltip}
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
                    <option value="">{copy.selectLabel}</option>
                    <option value="10s">{copy.ageGroup10s}</option>
                    <option value="20s">{copy.ageGroup20s}</option>
                    <option value="30s">{copy.ageGroup30s}</option>
                    <option value="40s">{copy.ageGroup40s}</option>
                    <option value="50s">{copy.ageGroup50s}</option>
                    <option value="60plus">{copy.ageGroup60plus}</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label htmlFor="userType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {copy.userTypeLabel}
                    </label>
                    <Tooltip
                      content={copy.userTypeTooltip}
                      position="top"
                    >
                      <button
                        type="button"
                        aria-label={copy.userTypeTooltip}
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
                    <option value="">{copy.selectLabel}</option>
                    <option value="student">{copy.userTypeStudent}</option>
                    <option value="worker">{copy.userTypeWorker}</option>
                    <option value="resident">{copy.userTypeResident}</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{copy.notificationTitle}</h2>
                </div>

                <div className="space-y-4">
                  {(['all', 'answers', 'comments', 'replies', 'adoptions', 'follows'] as const).map((key) => {
                    const labels = {
                      all: copy.notifyAll,
                      answers: copy.notifyAnswers,
                      comments: copy.notifyComments,
                      replies: copy.notifyReplies,
                      adoptions: copy.notifyAdoptions,
                      follows: copy.notifyFollows,
                    };
                    const descs = {
                      all: copy.notifyAllDesc,
                      answers: copy.notifyAnswersDesc,
                      comments: copy.notifyCommentsDesc,
                      replies: copy.notifyRepliesDesc,
                      adoptions: copy.notifyAdoptionsDesc,
                      follows: copy.notifyFollowsDesc,
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
                      {copy.saveButton}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50"
                >
                  {copy.cancelButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
