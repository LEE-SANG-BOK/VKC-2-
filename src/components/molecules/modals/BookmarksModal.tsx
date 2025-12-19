'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { X, Mailbox } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/atoms/Modal';
import PostCard from '@/components/molecules/cards/PostCard';
import { useInfiniteUserBookmarks } from '@/repo/users/query';
import useProgressiveList from '@/lib/hooks/useProgressiveList';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations?: Record<string, string>;
}

type FilterType = 'all' | 'question' | 'answer' | 'post';

export default function BookmarksModal({ isOpen, onClose, translations = {} }: BookmarksModalProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const params = useParams();
  const locale = params.lang as string || 'ko';

  const t = translations;
  const modalFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        bookmarks: 'Bookmarks',
        bookmarksDesc: 'Manage your saved questions and posts in one place.',
        all: 'All',
        question: 'Questions',
        answer: 'Answers',
        post: 'Posts',
        noBookmarksTitle: 'No bookmarks for this type',
        noBookmarksDesc: 'Save questions or posts to revisit them anytime.',
        loading: 'Loading...',
      };
    }
    if (locale === 'vi') {
      return {
        bookmarks: 'Đánh dấu',
        bookmarksDesc: 'Quản lý câu hỏi và bài viết đã lưu tại đây.',
        all: 'Tất cả',
        question: 'Câu hỏi',
        answer: 'Câu trả lời',
        post: 'Bài viết',
        noBookmarksTitle: 'Không có đánh dấu cho loại đã chọn',
        noBookmarksDesc: 'Lưu câu hỏi hoặc bài viết để xem lại bất cứ lúc nào.',
        loading: 'Đang tải...',
      };
    }
    return {
      bookmarks: '북마크',
      bookmarksDesc: '저장한 질문과 게시글을 한 번에 관리하세요.',
      all: '전체',
      question: '질문',
      answer: '답변',
      post: '게시글',
      noBookmarksTitle: '선택한 유형의 북마크가 없습니다',
      noBookmarksDesc: '관심 있는 질문이나 게시글을 저장해 두면 언제든지 다시 확인할 수 있어요.',
      loading: '로딩 중...',
    };
  }, [locale]);
  const modalLabels = {
    bookmarks: t.bookmarks || modalFallbacks.bookmarks,
    bookmarksDesc: t.bookmarksDesc || modalFallbacks.bookmarksDesc,
    all: t.all || modalFallbacks.all,
    question: t.question || modalFallbacks.question,
    answer: t.answer || modalFallbacks.answer,
    post: t.post || modalFallbacks.post,
    noBookmarksTitle: t.noBookmarksTitle || modalFallbacks.noBookmarksTitle,
    noBookmarksDesc: t.noBookmarksDesc || modalFallbacks.noBookmarksDesc,
    loading: t.loading || modalFallbacks.loading,
  };
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveFilter('all');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (modalBodyRef.current?.parentElement) {
      modalBodyRef.current.parentElement.scrollTop = 0;
    }
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [activeFilter, isOpen]);

  const {
    data: bookmarksData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUserBookmarks(
    user?.id || '',
    {
      enabled: !!user?.id && isOpen,
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const bookmarks = useMemo(() => bookmarksData?.pages.flatMap(page => page.data) || [], [bookmarksData]);

  const filterCounts = useMemo(() => {
    const counts: Record<FilterType, number> = {
      all: bookmarks.length,
      question: 0,
      answer: 0,
      post: 0,
    };

    for (const bookmark of bookmarks) {
      if (bookmark.isQuestion) {
        counts.question += 1;
      } else if (bookmark.type === 'answer') {
        counts.answer += 1;
      } else {
        counts.post += 1;
      }
    }

    return counts;
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    if (activeFilter === 'all') return bookmarks;
    return bookmarks.filter((bookmark) => {
      if (activeFilter === 'question') return bookmark.isQuestion;
      if (activeFilter === 'answer') return !bookmark.isQuestion && bookmark.type === 'answer';
      if (activeFilter === 'post') return !bookmark.isQuestion && bookmark.type !== 'answer';
      return true;
    });
  }, [activeFilter, bookmarks]);

  const visibleCount = useProgressiveList({
    enabled: isOpen && !isLoading,
    total: filteredBookmarks.length,
    initial: 6,
    step: 6,
    resetKey: activeFilter,
  });

  const visibleBookmarks = useMemo(() => filteredBookmarks.slice(0, visibleCount), [filteredBookmarks, visibleCount]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !isOpen) return;
    if (visibleCount < filteredBookmarks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage && hasNextPage && visibleCount >= filteredBookmarks.length) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, filteredBookmarks.length, hasNextPage, isFetchingNextPage, isOpen, visibleCount]);

  const formatDate = (dateString: string) => {
    const justNowValues = new Set(['방금 전', 'Just now', 'Vừa xong']);
    if (!dateString || justNowValues.has(dateString)) return dateString;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const dateLocale = locale === 'vi' ? 'vi-VN' : locale === 'en' ? 'en-US' : 'ko-KR';
    return new Intl.DateTimeFormat(dateLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date).replace(/\. /g, '.').replace(/\.$/, '');
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: modalLabels.all },
    { key: 'question', label: modalLabels.question },
    { key: 'answer', label: modalLabels.answer },
    { key: 'post', label: modalLabels.post },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-[500px]">
      <div ref={modalBodyRef} className="relative">
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
            {modalLabels.bookmarks}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {modalLabels.bookmarksDesc}
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
                {filter.label} ({filterCounts[filter.key] || 0})
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
                {modalLabels.noBookmarksTitle}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {modalLabels.noBookmarksDesc}
              </p>
            </div>
          ) : (
            <div ref={scrollAreaRef} className="space-y-4 max-h-[500px] overflow-y-auto">
              {visibleBookmarks.map((bookmark) => (
                <PostCard
                  key={bookmark.id}
                  id={bookmark.id}
                  author={bookmark.author}
                  title={bookmark.title}
                  excerpt={bookmark.excerpt}
                  tags={bookmark.tags || []}
                  stats={{
                    ...bookmark.stats,
                    comments: bookmark.isQuestion
                      ? (bookmark.answersCount ?? bookmark.stats?.comments ?? 0)
                      : (bookmark.stats?.comments ?? 0),
                  }}
                  certifiedResponderCount={bookmark.certifiedResponderCount}
                  otherResponderCount={bookmark.otherResponderCount}
                  officialAnswerCount={bookmark.officialAnswerCount}
                  reviewedAnswerCount={bookmark.reviewedAnswerCount}
                  thumbnail={bookmark.thumbnail}
                  imageCount={bookmark.imageCount}
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

              {visibleCount < filteredBookmarks.length ? (
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

              {hasNextPage && visibleCount >= filteredBookmarks.length ? (
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
