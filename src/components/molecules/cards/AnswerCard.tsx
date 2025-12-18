'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { useSession } from 'next-auth/react';
import { ThumbsUp, CheckCircle, ExternalLink } from 'lucide-react';
import UserChip from '@/components/molecules/user/UserChip';
import TrustBadge from '@/components/atoms/TrustBadge';
import Tooltip from '@/components/atoms/Tooltip';
import { createSafeUgcMarkup } from '@/utils/sanitizeUgcContent';
import { useToggleAnswerLike } from '@/repo/answers/mutation';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';

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
  
  const toggleLikeMutation = useToggleAnswerLike();
  
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
      await toggleLikeMutation.mutateAsync({ answerId: id, postId: post?.id });
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
              {isAdopted && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full border border-green-200 dark:border-green-700">
                  <CheckCircle className="w-3 h-3" />
                  {tCommon.adopted || '채택됨'}
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
              <span className="text-sm font-medium">{tCommon.helpful || '도움됨'} {localLikes}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
