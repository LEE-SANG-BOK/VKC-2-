'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { useSession } from 'next-auth/react';
import { ThumbsUp, CheckCircle, ExternalLink } from 'lucide-react';
import UserChip from '@/components/molecules/user/UserChip';
import { createSafeUgcMarkup } from '@/utils/sanitizeUgcContent';
import { useToggleAnswerLike } from '@/repo/answers/mutation';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';
import { useLoginPrompt } from '@/providers/LoginPromptProvider';
import { useHiddenTargets } from '@/repo/hides/query';
import { useHideTarget, useUnhideTarget } from '@/repo/hides/mutation';
import { toast } from 'sonner';

export interface AnswerCardProps {
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
  isAdopted?: boolean;
  isOfficial?: boolean;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  post?: {
    id?: string;
    title?: string;
  };
  locale?: string;
  translations?: Record<string, unknown>;
}

export default function AnswerCard({
  id,
  author,
  content,
  publishedAt,
  likes,
  isLiked = false,
  isAdopted = false,
  post,
  locale = 'ko',
  translations,
}: AnswerCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { openLoginPrompt } = useLoginPrompt();
  const { idSet: hiddenAnswerIds } = useHiddenTargets('answer', Boolean(session?.user));
  const hideTargetMutation = useHideTarget();
  const unhideTargetMutation = useUnhideTarget();
  const postUrl = post?.id ? `/${locale}/posts/${post.id}` : '#';
  
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;
  const originalPostLabel = tCommon.originalPost || (locale === 'vi' ? 'Bài viết gốc' : locale === 'en' ? 'Original post' : '원글');
  const deletedPostLabel = tCommon.deletedPost || (locale === 'vi' ? 'Bài viết đã bị xóa' : locale === 'en' ? 'Deleted post' : '삭제된 게시글');
  const noTitleLabel = tCommon.noTitle || (locale === 'vi' ? 'Không có tiêu đề' : locale === 'en' ? 'No title' : '제목 없음');
  const adoptedLabel = tCommon.adopted || (locale === 'vi' ? 'Đã chọn' : locale === 'en' ? 'Adopted' : '채택됨');
  const helpfulLabel = tCommon.helpful || (locale === 'vi' ? 'Hữu ích' : locale === 'en' ? 'Helpful' : '도움됨');
  const hideLabel = tCommon.hide || (locale === 'vi' ? 'Ẩn' : locale === 'en' ? 'Hide' : '안보기');
  const unhideLabel = tCommon.unhide || (locale === 'vi' ? 'Bỏ ẩn' : locale === 'en' ? 'Unhide' : '숨김 해제');
  const hiddenAnswerLabel = tCommon.hiddenAnswer || (locale === 'vi' ? 'Câu trả lời đã được ẩn.' : locale === 'en' ? 'This answer is hidden.' : '숨긴 답변입니다.');
  const hideFailedLabel = tCommon.hideFailed || (locale === 'vi' ? 'Không thể ẩn câu trả lời.' : locale === 'en' ? 'Failed to hide the answer.' : '답변을 숨길 수 없습니다.');
  const unhideFailedLabel = tCommon.unhideFailed || (locale === 'vi' ? 'Không thể bỏ ẩn.' : locale === 'en' ? 'Failed to unhide.' : '숨김 해제에 실패했습니다.');

  const trustBadgePresentation = getTrustBadgePresentation({
    locale,
    author,
    translations: tTrust,
  });

  const trustBadgeGuideHref = `/${locale}/guide/trust-badges`;
  const learnMoreLabel = tCommon.learnMore || '';
  
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localLikes, setLocalLikes] = useState(likes);
  const isHidden = hiddenAnswerIds.has(id);
  
  const toggleLikeMutation = useToggleAnswerLike();
  
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
      await toggleLikeMutation.mutateAsync({ answerId: id, postId: post?.id });
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
        await unhideTargetMutation.mutateAsync({ targetType: 'answer', targetId: id });
      } else {
        await hideTargetMutation.mutateAsync({ targetType: 'answer', targetId: id });
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
          <span className="text-sm text-gray-500 dark:text-gray-400">{hiddenAnswerLabel}</span>
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
              {isAdopted && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full border border-green-200 dark:border-green-700">
                  <CheckCircle className="w-3 h-3" />
                  {adoptedLabel}
                </span>
              )}
            </div>
          </div>

          <div
            className="prose prose-sm sm:prose-base max-w-none text-gray-700 dark:text-gray-300 line-clamp-3"
            dangerouslySetInnerHTML={createSafeUgcMarkup(content, {
              targetBlank: true,
            })}
          />

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={handleLikeClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer hover:scale-105 ${
                localIsLiked
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${localIsLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{helpfulLabel} {localLikes}</span>
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
