'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { useSession } from 'next-auth/react';
import { ThumbsUp, ExternalLink } from 'lucide-react';
import UserChip from '@/components/molecules/user/UserChip';
import TrustBadge from '@/components/atoms/TrustBadge';
import Tooltip from '@/components/atoms/Tooltip';
import { createSafeUgcMarkup } from '@/utils/sanitizeUgcContent';
import { useToggleCommentLike } from '@/repo/comments/mutation';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';

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
  const postUrl = post?.id ? `/${locale}/posts/${post.id}` : '#';
  
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;

  const trustBadgePresentation = getTrustBadgePresentation({
    locale,
    author,
    translations: tTrust,
  });

  const trustBadgeGuideHref = `/${locale}/guide/trust-badges`;
  const learnMoreLabel = tCommon.learnMore || (locale === 'vi' ? 'Xem thêm' : locale === 'en' ? 'Learn more' : '자세히');
  
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localLikes, setLocalLikes] = useState(likes);
  
  const toggleLikeMutation = useToggleCommentLike();
  
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!session?.user) {
      router.push(`/${locale}/login`);
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

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {post?.id ? (
        <Link
          href={postUrl}
          className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 group"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">{tCommon.originalPost || '원글'}:</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-500 truncate flex-1">
            {post.title || tCommon.noTitle || '제목 없음'}
          </span>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 shrink-0" />
        </Link>
      ) : (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">{tCommon.originalPost || '원글'}:</span>
          <span className="text-sm text-gray-400 dark:text-gray-500 italic">{tCommon.deletedPost || '삭제된 게시글'}</span>
        </div>
      )}

      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <UserChip
                name={author.name}
                avatar={author.avatar}
                isVerified={false}
                size="md"
                onClick={() => author.id && router.push(`/${locale}/profile/${author.id}`)}
                className="hover:opacity-90 transition-all"
              />
              {trustBadgePresentation.show ? (
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <div>{trustBadgePresentation.tooltip}</div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(trustBadgeGuideHref);
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {learnMoreLabel}
                      </button>
                    </div>
                  }
                  position="top"
                  touchBehavior="longPress"
                >
                  <span className="inline-flex">
                    <TrustBadge level={trustBadgePresentation.level} label={trustBadgePresentation.label} />
                  </span>
                </Tooltip>
              ) : null}
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
          </div>
        </div>
      </div>
    </div>
  );
}
