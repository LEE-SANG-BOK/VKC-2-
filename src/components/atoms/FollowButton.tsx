'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToggleFollow } from '@/repo/users/mutation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FollowButtonProps {
  userId?: string;
  userName?: string;
  isFollowing?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  onToggle?: (next: boolean) => void;
  translations?: Record<string, unknown>;
}

export default function FollowButton({
  userId,
  userName,
  isFollowing = false,
  size = 'md',
  className = '',
  onToggle,
  translations,
}: FollowButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'ko';
  const toggleFollowMutation = useToggleFollow();
  const tCommon = (translations?.common || {}) as Record<string, string>;

  const [following, setFollowing] = useState<boolean>(!!isFollowing);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setFollowing(!!isFollowing);
  }, [isFollowing]);

  if (!userId) return null;
  const isSelf = session?.user?.id === userId;
  if (isSelf) return null;

  const followLabel = tCommon.follow || '';
  const unfollowLabel = tCommon.unfollow || '';
  const followingLabel = tCommon.following || '';
  const processingLabel = tCommon.processing || '';

  const targetName = userName || tCommon.thisUser || '';
  const confirmTitle = tCommon.confirm || '';
  const confirmTemplate = following ? tCommon.unfollowConfirm : tCommon.followConfirm;
  const confirmDescription = (confirmTemplate || '').replace('{name}', targetName);
  const cancelLabel = tCommon.cancel || '';
  const confirmActionLabel = following ? unfollowLabel : followLabel;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user) {
      router.push(`/${lang}/login`);
      return;
    }
    if (loading) return;

    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (loading) return;
    setConfirmOpen(false);

    const next = !following;
    setFollowing(next);
    onToggle?.(next);
    setLoading(true);
    try {
      await toggleFollowMutation.mutateAsync(userId);
    } catch (error) {
      setFollowing(!next);
      onToggle?.(!next);
      console.error('Failed to toggle follow:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses =
    size === 'xs'
      ? 'px-3 py-2 text-xs min-h-[44px] sm:px-2 sm:py-0.5 sm:text-[9px] sm:leading-none sm:min-h-[20px]'
      : size === 'sm'
        ? 'px-3 py-2 text-sm min-h-[44px] sm:px-3 sm:py-1.5 sm:text-xs sm:min-h-[36px]'
        : 'px-4 py-2 text-sm min-h-[44px] sm:min-h-[40px]';
  const activeClasses = following
    ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-pressed={following}
        className={`inline-flex items-center justify-center rounded-full border font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ${sizeClasses} ${activeClasses} ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      >
        {loading ? processingLabel : following ? followingLabel : followLabel}
      </button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>{confirmActionLabel}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
