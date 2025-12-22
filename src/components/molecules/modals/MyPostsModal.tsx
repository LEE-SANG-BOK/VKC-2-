'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { X, FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/atoms/Modal';
import PostCard from '@/components/molecules/cards/PostCard';
import { useInfiniteUserPosts } from '@/repo/users/query';
import useProgressiveList from '@/lib/hooks/useProgressiveList';

interface MyPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations?: Record<string, unknown>;
}

export default function MyPostsModal({ isOpen, onClose, translations = {} }: MyPostsModalProps) {
  const params = useParams();
  const locale = params.lang as string || 'ko';
  const { data: session } = useSession();
  const user = session?.user;
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tUserMenu = (translations?.userMenu || {}) as Record<string, string>;
  const tProfile = (translations?.profile || {}) as Record<string, string>;
  const modalLabels = {
    myPosts: tUserMenu.myPostsTitle || tUserMenu.myPosts || '',
    noPosts: tUserMenu.noPostsTitle || tUserMenu.noPostsYet || '',
    loading: tProfile.loading || '',
  };
  const anonymousLabel = tCommon.anonymous || '';

  const { 
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading 
  } = useInfiniteUserPosts(user?.id || '', {
    enabled: !!user?.id && isOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });


  const posts = useMemo(() => data?.pages?.flatMap(page => page.data) || [], [data]);

  const visibleCount = useProgressiveList({
    enabled: isOpen && !isLoading,
    total: posts.length,
    initial: 6,
    step: 6,
  });

  const visiblePosts = posts.slice(0, visibleCount);

  useEffect(() => {
    if (!isOpen) return;
    if (modalBodyRef.current?.parentElement) {
      modalBodyRef.current.parentElement.scrollTop = 0;
    }
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [isOpen]);


  // 무한 스크롤 Intersection Observer
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !isOpen) return;
    if (visibleCount < posts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage && hasNextPage && visibleCount >= posts.length) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isOpen, posts.length, visibleCount]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div ref={modalBodyRef} className="relative max-h-[80dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {modalLabels.myPosts}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{modalLabels.noPosts}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visiblePosts.map((post: any) => {
                const thumbnails = Array.isArray(post.thumbnails) && post.thumbnails.length ? post.thumbnails : undefined;
                const resolvedThumbnail = post.thumbnail || post.thumbnails?.[0];
                return (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    author={{
                      id: post.author?.id,
                      name:
                        post.author?.displayName ||
                        post.author?.name ||
                        post.author?.email ||
                        anonymousLabel,
                      avatar: post.author?.avatar || post.author?.image || '/default-avatar.jpg',
                      followers: post.author?.followers ?? 0,
                      isFollowing: post.author?.isFollowing ?? false,
                      isVerified: post.author?.isVerified || false,
                      isExpert: post.author?.isExpert || false,
                      badgeType: post.author?.badgeType || null,
                    }}
                    title={post.title}
                    excerpt={post.excerpt || ''}
                    tags={post.tags || []}
                    stats={{
                      likes: post.likesCount ?? post.stats?.likes ?? post.likes ?? 0,
                      comments: (post.type === 'question' || post.isQuestion)
                        ? (post.answersCount ?? post.commentsCount ?? post.stats?.comments ?? 0)
                        : (post.commentsCount ?? post.stats?.comments ?? 0),
                      shares: 0,
                    }}
                    category={post.category}
                    subcategory={post.subcategory}
                    thumbnail={resolvedThumbnail}
                    thumbnails={thumbnails}
                    imageCount={post.imageCount}
                    certifiedResponderCount={(post as any).certifiedResponderCount}
                    otherResponderCount={(post as any).otherResponderCount}
                    officialAnswerCount={(post as any).officialAnswerCount}
                    reviewedAnswerCount={(post as any).reviewedAnswerCount}
                    publishedAt={formatDate(post.publishedAt || post.createdAt)}
                    isQuestion={post.type === 'question' || post.isQuestion}
                    isAdopted={post.isResolved || post.isAdopted}
                    isLiked={post.isLiked}
                    isBookmarked={post.isBookmarked}
                    trustBadge={(post as any).trustBadge}
                    trustWeight={(post as any).trustWeight}
                    translations={translations}
                  />
                );
              })}

              {visibleCount < posts.length ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 animate-pulse"
                    >
                      <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="mt-3 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="mt-2 h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Loading indicator */}
              {hasNextPage && visibleCount >= posts.length ? (
                <div ref={observerRef} className="py-4 text-center">
                  {isFetchingNextPage && (
                    <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">{modalLabels.loading}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
