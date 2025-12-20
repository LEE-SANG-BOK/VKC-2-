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
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const copy = useMemo(() => {
    const isVi = lang === 'vi';
    const isEn = lang === 'en';
    const selectLabel = t.genderSelect || (isVi ? 'Chọn' : isEn ? 'Select' : '선택');

    return {
      avatarChange: t.avatarChange || (isVi ? 'Thay đổi ảnh đại diện' : isEn ? 'Change profile photo' : '프로필 사진 변경'),
      avatarTooltip:
        t.avatarTooltip ||
        (isVi
          ? 'Bạn có thể dùng ảnh bất kỳ để dễ nhận diện.'
          : isEn
            ? 'Upload any image that helps others recognize you.'
            : '식별 가능한 이미지를 업로드해 주세요.'),
      nameTooltip:
        t.nameTooltip ||
        (isVi
          ? 'Tên này sẽ được hiển thị công khai trên hồ sơ và bài viết.'
          : isEn
            ? 'This name will be shown publicly on your profile and posts.'
            : '프로필과 게시글에 공개로 표시되는 이름입니다.'),
      bioTooltip:
        t.bioTooltip ||
        (isVi
          ? 'Giới thiệu ngắn giúp mọi người hiểu bạn tốt hơn.'
          : isEn
            ? 'A short intro helps others understand you.'
            : '간단한 소개를 적으면 신뢰도와 소통이 좋아져요.'),
      genderTooltip:
        t.genderTooltip ||
        (isVi
          ? 'Không bắt buộc. Dùng để cá nhân hóa gợi ý.'
          : isEn
            ? 'Optional. Used to personalize recommendations.'
            : '선택 사항입니다. 맞춤 추천에 활용됩니다.'),
      ageGroupTooltip:
        t.ageGroupTooltip ||
        (isVi
          ? 'Không bắt buộc. Dùng để cá nhân hóa gợi ý.'
          : isEn
            ? 'Optional. Used to personalize recommendations.'
            : '선택 사항입니다. 맞춤 추천에 활용됩니다.'),
      userTypeTooltip:
        t.userTypeTooltip ||
        t.statusTooltip ||
        (isVi
          ? 'Không bắt buộc. Chọn loại người dùng của bạn.'
          : isEn
            ? 'Optional. Choose your user type.'
            : '선택 사항입니다. 사용자 유형을 선택해 주세요.'),
      nameValidationError:
        t.nameValidationError ||
        (isVi
          ? `Biệt danh phải từ ${DISPLAY_NAME_MIN_LENGTH}–${DISPLAY_NAME_MAX_LENGTH} ký tự.`
          : isEn
            ? `Nickname must be ${DISPLAY_NAME_MIN_LENGTH}–${DISPLAY_NAME_MAX_LENGTH} characters.`
            : `닉네임은 ${DISPLAY_NAME_MIN_LENGTH}~${DISPLAY_NAME_MAX_LENGTH}자여야 합니다.`),
      updateSuccess: t.updateSuccess || (isVi ? 'Hồ sơ đã được cập nhật.' : isEn ? 'Profile updated.' : '프로필이 업데이트되었습니다.'),
      updateFailed: t.updateFailed || (isVi ? 'Không thể cập nhật hồ sơ.' : isEn ? 'Failed to update profile.' : '프로필 업데이트에 실패했습니다.'),
      avatarOnlyImages: t.avatarOnlyImages || (isVi ? 'Chỉ cho phép tệp ảnh.' : isEn ? 'Only image files are allowed.' : '이미지 파일만 업로드할 수 있습니다.'),
      avatarTooLarge: t.avatarTooLarge || (isVi ? 'Kích thước ảnh phải ≤ 20MB.' : isEn ? 'Image must be 20MB or less.' : '이미지 크기는 20MB 이하여야 합니다.'),
      avatarUploadFailed: t.avatarUploadFailed || (isVi ? 'Tải ảnh đại diện thất bại.' : isEn ? 'Failed to upload profile photo.' : '프로필 사진 업로드에 실패했습니다.'),
      avatarUploadSuccess: t.avatarUploadSuccess || (isVi ? 'Đã cập nhật ảnh đại diện.' : isEn ? 'Profile photo updated.' : '프로필 사진이 업데이트되었습니다.'),
      avatarDecodeFailed:
        t.avatarDecodeFailed ||
        (isVi
          ? 'Không thể xử lý ảnh. Vui lòng chọn ảnh JPG/PNG.'
          : isEn
            ? 'Failed to process image. Please choose a JPG/PNG.'
            : '이미지를 처리할 수 없습니다. JPG/PNG 이미지를 선택해주세요.'),
      avatarHeicUnsupported:
        t.avatarHeicUnsupported ||
        (isVi
          ? 'Ảnh HEIC/HEIF chưa được hỗ trợ. Vui lòng chọn JPG/PNG.'
          : isEn
            ? 'HEIC/HEIF is not supported. Please choose a JPG/PNG.'
            : 'HEIC/HEIF 형식은 아직 지원되지 않습니다. JPG/PNG 이미지를 선택해주세요.'),
      backButton: t.backButton || (isVi ? 'Quay lại' : isEn ? 'Go back' : '뒤로 가기'),
      pageTitle: t.pageTitle || (isVi ? 'Chỉnh sửa hồ sơ' : isEn ? 'Edit Profile' : '프로필 수정'),
      profileAlt: t.profileAlt || (isVi ? 'Hồ sơ' : isEn ? 'Profile' : '프로필'),
      nameLabel: t.nameLabel || (isVi ? 'Tên' : isEn ? 'Name' : '이름'),
      namePlaceholder: t.namePlaceholder || (isVi ? 'Nhập tên của bạn' : isEn ? 'Enter your name' : '이름을 입력하세요'),
      bioLabel: t.bioLabel || (isVi ? 'Giới thiệu' : isEn ? 'Bio' : '자기소개'),
      bioPlaceholder: t.bioPlaceholder || (isVi ? 'Nhập giới thiệu về bản thân' : isEn ? 'Enter your bio' : '자기소개를 입력하세요'),
      genderLabel: t.genderLabel || (isVi ? 'Giới tính' : isEn ? 'Gender' : '성별'),
      selectLabel,
      genderMale: t.genderMale || (isVi ? 'Nam' : isEn ? 'Male' : '남성'),
      genderFemale: t.genderFemale || (isVi ? 'Nữ' : isEn ? 'Female' : '여성'),
      genderOther: t.genderOther || (isVi ? 'Khác' : isEn ? 'Other' : '기타'),
      ageGroupLabel: t.ageGroupLabel || (isVi ? 'Độ tuổi' : isEn ? 'Age Group' : '연령대'),
      ageGroup10s: t.ageGroup10s || (isVi ? '10-19' : isEn ? '10s' : '10대'),
      ageGroup20s: t.ageGroup20s || (isVi ? '20-29' : isEn ? '20s' : '20대'),
      ageGroup30s: t.ageGroup30s || (isVi ? '30-39' : isEn ? '30s' : '30대'),
      ageGroup40s: t.ageGroup40s || (isVi ? '40-49' : isEn ? '40s' : '40대'),
      ageGroup50s: t.ageGroup50s || (isVi ? '50-59' : isEn ? '50s' : '50대'),
      ageGroup60plus: t.ageGroup60plus || (isVi ? '60+' : isEn ? '60+' : '60대+'),
      userTypeLabel: t.userTypeLabel || t.statusLabel || (isVi ? 'Trạng thái' : isEn ? 'Status' : '사용자 유형'),
      userTypeStudent: t.userTypeStudent || t.statusStudent || (isVi ? 'Sinh viên' : isEn ? 'Student' : '학생'),
      userTypeWorker: t.userTypeWorker || t.statusWorker || (isVi ? 'Nhân viên' : isEn ? 'Worker' : '근로자'),
      userTypeResident: t.userTypeResident || (isVi ? 'Cư dân' : isEn ? 'Resident' : '거주자'),
      notificationTitle: t.notificationTitle || (isVi ? 'Cài đặt thông báo' : isEn ? 'Notification Settings' : '알림 설정'),
      notifyAll: t.notifyAll || (isVi ? 'Tất cả thông báo' : isEn ? 'All notifications' : '전체 알림'),
      notifyAnswers: t.notifyAnswers || (isVi ? 'Thông báo câu trả lời' : isEn ? 'Answer notifications' : '답변 알림'),
      notifyComments: t.notifyComments || (isVi ? 'Thông báo bình luận' : isEn ? 'Comment notifications' : '댓글 알림'),
      notifyReplies: t.notifyReplies || (isVi ? 'Thông báo phản hồi' : isEn ? 'Reply notifications' : '대댓글 알림'),
      notifyAdoptions: t.notifyAdoptions || (isVi ? 'Thông báo chấp nhận' : isEn ? 'Adoption notifications' : '채택 알림'),
      notifyFollows: t.notifyFollows || (isVi ? 'Thông báo theo dõi' : isEn ? 'Follow notifications' : '팔로우 알림'),
      notifyAllDesc:
        t.notifyAllDesc ||
        (isVi
          ? 'Bật hoặc tắt tất cả thông báo cùng lúc'
          : isEn
            ? 'Turn on or off all notifications at once'
            : '모든 알림을 한 번에 켜거나 끕니다'),
      notifyAnswersDesc:
        t.notifyAnswersDesc ||
        (isVi
          ? 'Nhận thông báo khi có người trả lời câu hỏi của bạn'
          : isEn
            ? 'Get notified when someone answers your question'
            : '내 질문에 새 답변이 달릴 때 알림을 받습니다'),
      notifyCommentsDesc:
        t.notifyCommentsDesc ||
        (isVi
          ? 'Nhận thông báo khi có người bình luận bài viết của bạn'
          : isEn
            ? 'Get notified when someone comments on your post'
            : '내 게시글에 새 댓글이 달릴 때 알림을 받습니다'),
      notifyRepliesDesc:
        t.notifyRepliesDesc ||
        (isVi
          ? 'Nhận thông báo khi có người phản hồi bình luận của bạn'
          : isEn
            ? 'Get notified when someone replies to your comment'
            : '내 댓글에 답글이 달릴 때 알림을 받습니다'),
      notifyAdoptionsDesc:
        t.notifyAdoptionsDesc ||
        (isVi
          ? 'Nhận thông báo khi câu trả lời của bạn được chấp nhận'
          : isEn
            ? 'Get notified when your answer is adopted'
            : '내 답변이 채택되었을 때 알림을 받습니다'),
      notifyFollowsDesc:
        t.notifyFollowsDesc ||
        (isVi
          ? 'Nhận thông báo khi có người theo dõi mới'
          : isEn
            ? 'Get notified when you have a new follower'
            : '새로운 팔로워가 생길 때 알림을 받습니다'),
      saveButton: t.saveButton || (isVi ? 'Lưu' : isEn ? 'Save' : '저장하기'),
      cancelButton: t.cancelButton || tCommon.cancel || (isVi ? 'Huỷ' : isEn ? 'Cancel' : '취소'),
    };
  }, [lang, t, tCommon]);

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
        throw new Error(result?.error || copy.avatarUploadFailed);
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
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                {copy.backButton}
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.pageTitle}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="relative group">
                  <Image
                    src={avatarPreview}
                    alt={formData.name || copy.profileAlt}
                    width={128}
                    height={128}
                    unoptimized={avatarUnoptimized}
                    sizes="128px"
                    className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-gray-700 object-cover"
                    placeholder="blur"
                    blurDataURL={DEFAULT_BLUR_DATA_URL}
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
