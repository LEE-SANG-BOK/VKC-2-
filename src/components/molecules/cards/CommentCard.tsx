'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { useSession } from 'next-auth/react';
import { ThumbsUp, ExternalLink } from 'lucide-react';
import UserChip from '@/components/molecules/user/UserChip';
import { createSafeUgcMarkup } from '@/utils/sanitizeUgcContent';
import { useToggleCommentLike } from '@/repo/comments/mutation';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';
import { useLoginPrompt } from '@/providers/LoginPromptProvider';
import { useHiddenTargets } from '@/repo/hides/query';
import { useHideTarget, useUnhideTarget } from '@/repo/hides/mutation';
import { toast } from 'sonner';

export interface CommentCardProps {
  id: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
    isExpert?: boolean;
    badgeType?: string | null;
  };
  content: string;
  publishedAt: string;
  likes: number;
  isLiked?: boolean;
  post?: {
    id?: string;
    title?: string;
  };
  locale?: string;
  translations?: Record<string, unknown>;
}

export default function CommentCard({
  id,
  author,
  content,
  publishedAt,
  likes,
  isLiked = false,
  post,
  locale = 'ko',
  translations,
}: CommentCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { openLoginPrompt } = useLoginPrompt();
  const { idSet: hiddenCommentIds } = useHiddenTargets('comment', Boolean(session?.user));
  const hideTargetMutation = useHideTarget();
  const unhideTargetMutation = useUnhideTarget();
  const postUrl = post?.id ? `/${locale}/posts/${post.id}` : '#';
  
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;
  const originalPostLabel = tCommon.originalPost || '';
  const deletedPostLabel = tCommon.deletedPost || '';
  const noTitleLabel = tCommon.noTitle || '';
  const hideLabel = tCommon.hide || '';
  const unhideLabel = tCommon.unhide || '';
  const hiddenCommentLabel = tCommon.hiddenComment || '';
  const hideFailedLabel = tCommon.hideFailed || '';
  const unhideFailedLabel = tCommon.unhideFailed || '';

  const trustBadgePresentation = getTrustBadgePresentation({
    locale,
    author,
    translations: tTrust,
  });

  const trustBadgeGuideHref = `/${locale}/guide/trust-badges`;
  const learnMoreLabel = tCommon.learnMore || '';
  
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localLikes, setLocalLikes] = useState(likes);
  const isHidden = hiddenCommentIds.has(id);
  
  const toggleLikeMutation = useToggleCommentLike();
  
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!session?.user) {
      openLoginPrompt();
      return;
    }

    const prevIsLiked = localIsLiked;
    const prevLikes = localLikes;
    
    setLocalIsLiked(!localIsLiked);
    setLocalLikes(prevLikes + (localIsLiked ? -1 : 1));
    
    try {
      await toggleLikeMutation.mutateAsync({ commentId: id, postId: post?.id });
    } catch (error) {
      setLocalIsLiked(prevIsLiked);
      setLocalLikes(prevLikes);
      console.error('Failed to toggle like:', error);
    }
  };

  const handleToggleHide = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!session?.user) {
      openLoginPrompt();
      return;
    }

    try {
      if (isHidden) {
        await unhideTargetMutation.mutateAsync({ targetType: 'comment', targetId: id });
      } else {
        await hideTargetMutation.mutateAsync({ targetType: 'comment', targetId: id });
      }
    } catch (error) {
      console.error('Failed to toggle hide:', error);
      toast.error(isHidden ? unhideFailedLabel : hideFailedLabel);
    }
  };

  if (isHidden) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{hiddenCommentLabel}</span>
          <button
            type="button"
            onClick={handleToggleHide}
            className="rounded-full px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {unhideLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {post?.id ? (
        <Link
          href={postUrl}
          className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 group"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">{originalPostLabel}:</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-500 truncate flex-1">
            {post.title || noTitleLabel}
          </span>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 shrink-0" />
        </Link>
      ) : (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">{originalPostLabel}:</span>
          <span className="text-sm text-gray-400 dark:text-gray-500 italic">{deletedPostLabel}</span>
        </div>
      )}

      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <UserChip
                name={author.name}
                avatar={author.avatar}
                size="md"
                onClick={() => author.id && router.push(`/${locale}/profile/${author.id}`)}
                className="hover:opacity-90 transition-all"
                trustBadgePresentation={trustBadgePresentation}
                learnMoreLabel={learnMoreLabel}
                onBadgeClick={() => router.push(trustBadgeGuideHref)}
                badgeLabelVariant="text"
                badgeClassName="!px-1.5 !py-0.5"
              />
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {publishedAt}
              </span>
            </div>
          </div>

          <div
            className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 line-clamp-3"
            dangerouslySetInnerHTML={createSafeUgcMarkup(content, { targetBlank: true })}
          />

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={handleLikeClick}
              className={`flex items-center gap-1 text-sm transition-colors cursor-pointer hover:scale-105 ${
                localIsLiked
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${localIsLiked ? 'fill-current' : ''}`} />
              <span>{localLikes}</span>
            </button>
            <button
              type="button"
              onClick={handleToggleHide}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {hideLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
