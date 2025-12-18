'use client';

import { useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { X, FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import Modal from '@/components/atoms/Modal';
import PostCard from '@/components/molecules/PostCard';
import { useInfiniteUserPosts } from '@/repo/users/query';

interface MyPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations?: Record<string, string>;
}

export default function MyPostsModal({ isOpen, onClose, translations = {} }: MyPostsModalProps) {
  const params = useParams();
  const locale = params.lang as string || 'ko';
  const { data: session } = useSession();
  const user = session?.user;
  const observerRef = useRef<HTMLDivElement>(null);

  const t = translations;

  const { 
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading 
  } = useInfiniteUserPosts(user?.id || '', {
    enabled: !!user?.id && isOpen,
  });


  const posts = data?.pages?.flatMap(page => page.data) || [];


  // 무한 스크롤 Intersection Observer
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isOpen]);

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY.MM.DD HH:mm');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="relative max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t.myPosts || '내 게시글'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t.noPosts || 'No posts yet'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post: any) => {
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
                        (locale === 'vi' ? 'Không rõ' : locale === 'en' ? 'Unknown' : '알 수 없음'),
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
                      comments: post.commentsCount ?? post.stats?.comments ?? 0,
                      shares: 0,
                    }}
                    category={post.category}
                    subcategory={post.subcategory}
                    thumbnail={resolvedThumbnail}
                    thumbnails={thumbnails}
                    imageCount={post.imageCount}
                    certifiedResponderCount={(post as any).certifiedResponderCount}
                    otherResponderCount={(post as any).otherResponderCount}
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

              {/* Loading indicator */}
              {hasNextPage && (
                <div ref={observerRef} className="py-4 text-center">
                  {isFetchingNextPage && (
                    <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">{t.loading || '로딩 중...'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
