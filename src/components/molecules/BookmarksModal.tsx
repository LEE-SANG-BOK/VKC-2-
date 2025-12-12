'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { X, Mailbox } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Modal from '../atoms/Modal';
import PostCard from './PostCard';
import { useInfiniteUserBookmarks } from '@/repo/users/query';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations?: Record<string, string>;
}

type FilterType = 'all' | 'question' | 'answer' | 'post';

export default function BookmarksModal({ isOpen, onClose, translations = {} }: BookmarksModalProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.lang as string || 'ko';
  const { data: session } = useSession();
  const user = session?.user;

  const t = translations;
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const observerRef = useRef<HTMLDivElement>(null);

  const {
    data: bookmarksData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUserBookmarks(
    user?.id || '',
    { enabled: !!user?.id && isOpen }
  );

  const bookmarks = bookmarksData?.pages.flatMap(page => page.data) || [];

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filteredBookmarks = activeFilter === 'all'
    ? bookmarks
    : bookmarks.filter((bookmark) => {
        if (activeFilter === 'question') return bookmark.isQuestion;
        if (activeFilter === 'answer') return !bookmark.isQuestion && bookmark.type === 'answer';
        if (activeFilter === 'post') return !bookmark.isQuestion && bookmark.type !== 'answer';
        return true;
      });

  const getFilterCount = (filter: FilterType) => {
    if (filter === 'all') return bookmarks.length;
    if (filter === 'question') return bookmarks.filter(b => b.isQuestion).length;
    if (filter === 'answer') return bookmarks.filter(b => !b.isQuestion && b.type === 'answer').length;
    if (filter === 'post') return bookmarks.filter(b => !b.isQuestion && b.type !== 'answer').length;
    return 0;
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '방금 전') return dateString;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date).replace(/\. /g, '.').replace(/\.$/, '');
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t.all || '전체' },
    { key: 'question', label: t.question || '질문' },
    { key: 'answer', label: t.answer || '답변' },
    { key: 'post', label: t.post || '게시글' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-[500px]">
      <div className="relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📬</span>
            {t.bookmarks || '북마크'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.bookmarksDesc || '저장한 질문과 게시글을 한 번에 관리하세요.'}
          </p>
        </div>

        {/* Filters */}
        <div className="px-5 mb-4">
          <div className="flex gap-2">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  activeFilter === filter.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {filter.label} ({getFilterCount(filter.key)})
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <Mailbox className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t.noBookmarksTitle || '선택한 유형의 북마크가 없습니다'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.noBookmarksDesc || '관심 있는 질문이나 게시글을 저장해 두면 언제든지 다시 확인할 수 있어요.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {filteredBookmarks.map((bookmark) => (
                <PostCard
                  key={bookmark.id}
                  id={bookmark.id}
                  author={bookmark.author}
                  title={bookmark.title}
                  excerpt={bookmark.excerpt}
                  tags={bookmark.tags || []}
                  stats={bookmark.stats}
                  thumbnail={bookmark.thumbnail}
                  publishedAt={formatDate(bookmark.publishedAt)}
                  isQuestion={bookmark.isQuestion}
                  isAdopted={bookmark.isAdopted}
                  isLiked={bookmark.isLiked}
                  isBookmarked={true}
                  trustBadge={(bookmark as any).trustBadge}
                  trustWeight={(bookmark as any).trustWeight}
                  translations={translations}
                />
              ))}

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
