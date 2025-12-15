'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Image from 'next/image';
import { MessageCircle, Share2, Bookmark, Flag, Edit, Trash2, HelpCircle, CheckCircle, ThumbsUp, AlertTriangle, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';

function getJustNowLabel(locale: string) {
  if (locale === 'vi') return 'Vừa xong';
  if (locale === 'en') return 'Just now';
  return '방금 전';
}

function formatDateTime(dateString: string, locale: string = 'ko'): string {
  if (!dateString || dateString === getJustNowLabel(locale)) return dateString;
  
  const date = dayjs(dateString);
  if (!date.isValid()) return dateString;
  
  return date.format('YYYY.MM.DD HH:mm');
}
import Avatar from '@/components/atoms/Avatar';
import UserChip from '@/components/molecules/UserChip';
import Button from '@/components/atoms/Button';
import Tooltip from '@/components/atoms/Tooltip';
import Modal from '@/components/atoms/Modal';
import RichTextEditor from '@/components/molecules/RichTextEditor';
import Header from '@/components/organisms/Header';
import TrustBadge from '@/components/atoms/TrustBadge';
import FollowButton from '@/components/atoms/FollowButton';
import LoginPrompt from '@/components/organisms/LoginPrompt';
import { useSession } from 'next-auth/react';
import { createSafeUgcMarkup } from '@/utils/sanitizeUgcContent';
import { normalizePostImageSrc } from '@/utils/normalizePostImageSrc';
import { UGC_LIMITS, getPlainTextLength, validateUgcText, UgcValidationErrorCode, UgcValidationResult } from '@/lib/validation/ugc';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';
import { useTogglePostLike, useTogglePostBookmark, useDeletePost, useUpdatePost, useIncrementPostView } from '@/repo/posts/mutation';
import { useCreateAnswer, useUpdateAnswer, useDeleteAnswer, useToggleAnswerLike, useAdoptAnswer, useCreateAnswerComment } from '@/repo/answers/mutation';
import { useCreatePostComment, useUpdateComment, useDeleteComment, useToggleCommentLike } from '@/repo/comments/mutation';
import { useReportPost, useReportComment, useReportAnswer } from '@/repo/reports/mutation';
import { useFollowStatus } from '@/repo/users/query';
import { useCategories } from '@/repo/categories/query';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/repo/keys';
import type { ReportType } from '@/repo/reports/types';
import { ApiError, isAccountRestrictedError } from '@/lib/api/errors';
import { toast } from 'sonner';

interface PaginatedListResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function mergeById<T extends { id: string }>(current: T[] | undefined, incoming: T[]): T[] {
  const existing = current ?? [];
  if (incoming.length === 0) return existing;
  const existingMap = new Map(existing.map((item) => [item.id, item] as const));
  const seen = new Set<string>();
  const merged = incoming.map((item) => {
    seen.add(item.id);
    return existingMap.get(item.id) ?? item;
  });

  const extras = existing.filter((item) => !seen.has(item.id));
  if (extras.length === 0 && merged.length === existing.length) {
    const unchanged = merged.every((item, index) => item === existing[index]);
    if (unchanged) return existing;
  }

  return [...merged, ...extras];
}

interface Comment {
  id: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
    isExpert?: boolean;
  };
  content: string;
  publishedAt: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface AnswerReply {
  id: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
    isExpert?: boolean;
  };
  content: string;
  publishedAt: string;
  likes: number;
  isLiked: boolean;
}

interface Answer {
  id: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
    isExpert?: boolean;
  };
  content: string; // HTML content
  publishedAt: string;
  helpful: number;
  isHelpful: boolean;
  isAdopted: boolean;
  replies?: AnswerReply[];
}

export interface PostDetail {
  id: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    followers: number;
    isFollowing: boolean;
    isVerified?: boolean;
    isExpert?: boolean;
    badgeType?: string | null;
  };
  trustBadge?: 'verified' | 'community' | 'expert' | 'outdated';
  trustWeight?: number;
  title: string;
  content: string;
  tags: string[];
  category: string;
  subcategory?: string;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  thumbnail?: string;
  publishedAt: string;
  isLiked: boolean;
  isBookmarked: boolean;
  comments: Comment[];
  answers?: Answer[];
  isQuestion?: boolean;
  isAdopted?: boolean;
}

interface PostDetailClientProps {
  initialPost: PostDetail;
  locale: string;
  translations?: Record<string, unknown>;
}

const bannedPatterns = [
  /씨발/i,
  /시발/i,
  /ㅅㅂ/i,
  /\bsex\b/i,
  /fuck/i,
  /shit/i,
  /đụ\s?m[aá]/i,
  /duma/i,
  /\bđm\b/i,
  /dm\s/gi,
  /đụm/i,
  /địt/i,
];

const spamPatterns = [
  /https?:\/\//i,
  /www\./i,
  /\S+@\S+\.\S+/i,
  /\b\d{2,3}-\d{3,4}-\d{4}\b/,
  /\b\d{9,}\b/,
  /(무료\s?상담|할인|대행|브로커|알선|유학원|visa\s?agency)/i,
];

const ALLOWED_CATEGORY_SLUGS = new Set<string>([
  ...Object.keys(CATEGORY_GROUPS),
  ...Object.values(CATEGORY_GROUPS).flatMap((group) => group.slugs),
]);

export default function PostDetailClient({ initialPost, locale, translations }: PostDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tPost = (translations?.post || {}) as Record<string, string>;
  const tPostDetail = (translations?.postDetail || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;
  const tErrors = (translations?.errors || {}) as Record<string, string>;
  const guidelineTooltip =
    tCommon.guidelineTooltip ||
    '예의·혐오 표현 금지, 광고/연락처 제한, 위반 시 게시 제한 또는 계정 제재가 있을 수 있습니다.';
  const justNowLabel = getJustNowLabel(locale);
  const safeName = (author?: { name?: string }) => {
    const nm = author?.name?.trim();
    const fallback = tCommon.anonymous || '익명 사용자';
    if (!nm) return fallback;
    const uuidLike = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const hexishId = /^[0-9a-fA-F-]{20,}$/;
    const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (uuidLike.test(nm) || hexishId.test(nm)) return fallback;
    if (emailLike.test(nm)) {
      const local = nm.split('@')[0];
      if (!local || local.length > 20) return fallback;
      return local;
    }
    return nm;
  };
  const safeLabel = (raw?: string) => {
    const val = raw?.trim();
    if (!val) return '';
    const uuidLike = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const hexishId = /^[0-9a-fA-F-]{20,}$/;
    if (uuidLike.test(val) || hexishId.test(val) || val.length > 40) return '';
    return val;
  };
  const tRules = (translations?.newPost || {}) as Record<string, string>;
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const openLoginPrompt = () => setIsLoginPromptOpen(true);

  const resolveErrorMessage = (error: unknown, fallback: string) => {
    if (isAccountRestrictedError(error)) return error.message;
    if (error instanceof ApiError && error.code && tErrors[error.code]) return tErrors[error.code];
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const toggleLike = useTogglePostLike();
  const toggleBookmark = useTogglePostBookmark();
  const deletePostMutation = useDeletePost();
  const updatePostMutation = useUpdatePost();
  const createAnswer = useCreateAnswer();
  const updateAnswerMutation = useUpdateAnswer();
  const deleteAnswerMutation = useDeleteAnswer();
  const toggleAnswerLike = useToggleAnswerLike();
  const adoptAnswer = useAdoptAnswer();
  const createAnswerComment = useCreateAnswerComment();
  const createCommentMutation = useCreatePostComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const toggleCommentLike = useToggleCommentLike();
  const reportPostMutation = useReportPost();
  const reportCommentMutation = useReportComment();
  const reportAnswerMutation = useReportAnswer();
  const incrementView = useIncrementPostView();
  
  const { data: postQuery } = useQuery({
    queryKey: queryKeys.posts.detail(initialPost.id),
    queryFn: () => fetch(`/api/posts/${initialPost.id}`, { credentials: 'include' }).then(r => r.json()),
  });

  const [post, setPost] = useState<PostDetail>(initialPost);
  const contentThumbnail = useMemo(() => {
    const matches = Array.from(post.content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) as RegExpMatchArray[];
    for (const match of matches) {
      const normalized = normalizePostImageSrc(match[1]);
      if (normalized) return normalized;
    }
    return null;
  }, [post.content]);
  const normalizedThumbnail = useMemo(
    () => normalizePostImageSrc(post.thumbnail) || contentThumbnail,
    [contentThumbnail, post.thumbnail]
  );
  const [renderThumbnailSrc, setRenderThumbnailSrc] = useState<string | null>(normalizedThumbnail);

  useEffect(() => {
    setRenderThumbnailSrc(normalizedThumbnail);
  }, [normalizedThumbnail]);

  const answersInfiniteQuery = useInfiniteQuery<PaginatedListResponse<Answer>>({
    queryKey: queryKeys.answers.infinite(initialPost.id),
    queryFn: ({ pageParam }) =>
      fetch(`/api/posts/${initialPost.id}/answers?page=${pageParam}&limit=10`, { credentials: 'include' }).then((r) =>
        r.json()
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: Boolean(initialPost.id && post.isQuestion),
  });

  const commentsInfiniteQuery = useInfiniteQuery<PaginatedListResponse<Comment>>({
    queryKey: queryKeys.comments.infinite(initialPost.id),
    queryFn: ({ pageParam }) =>
      fetch(`/api/posts/${initialPost.id}/comments?page=${pageParam}&limit=20`, { credentials: 'include' }).then((r) =>
        r.json()
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: Boolean(initialPost.id && !post.isQuestion),
  });

  const pagedAnswers = useMemo(
    () => answersInfiniteQuery.data?.pages.flatMap((page) => page.data) || [],
    [answersInfiniteQuery.data]
  );
  const pagedComments = useMemo(
    () => commentsInfiniteQuery.data?.pages.flatMap((page) => page.data) || [],
    [commentsInfiniteQuery.data]
  );

  const trustBadgePresentation = getTrustBadgePresentation({
    locale,
    trustBadge: post.trustBadge,
    author: post.author,
    translations: tTrust,
  });

  const normalizeKey = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

  useEffect(() => {
    if (postQuery?.data) {
      setPost((prev) => ({
        ...prev,
        ...postQuery.data,
        answers: prev.answers,
        comments: prev.comments,
      }));
    }
  }, [postQuery]);

  useEffect(() => {
    if (!post.isQuestion) return;
    if (!pagedAnswers.length) return;
    setPost((prev) => {
      const merged = mergeById(prev.answers || [], pagedAnswers);
      if (merged === prev.answers) return prev;
      return {
        ...prev,
        answers: merged,
      };
    });
  }, [pagedAnswers, post.isQuestion]);

  useEffect(() => {
    if (post.isQuestion) return;
    if (!pagedComments.length) return;
    setPost((prev) => {
      const merged = mergeById(prev.comments || [], pagedComments);
      if (merged === prev.comments) return prev;
      return {
        ...prev,
        comments: merged,
      };
    });
  }, [pagedComments, post.isQuestion]);

  useEffect(() => {
    if (!post.isQuestion) return;
    if (!answersInfiniteQuery.hasNextPage) return;
    const target = answersLoadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (answersInfiniteQuery.isFetchingNextPage) return;
        answersInfiniteQuery.fetchNextPage();
      },
      { rootMargin: '240px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [answersInfiniteQuery.fetchNextPage, answersInfiniteQuery.hasNextPage, answersInfiniteQuery.isFetchingNextPage, post.isQuestion]);

  useEffect(() => {
    if (post.isQuestion) return;
    if (!commentsInfiniteQuery.hasNextPage) return;
    const target = commentsLoadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (commentsInfiniteQuery.isFetchingNextPage) return;
        commentsInfiniteQuery.fetchNextPage();
      },
      { rootMargin: '240px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [commentsInfiniteQuery.fetchNextPage, commentsInfiniteQuery.hasNextPage, commentsInfiniteQuery.isFetchingNextPage, post.isQuestion]);

  const viewIncrementedRef = useRef(false);
  useEffect(() => {
    if (initialPost.id && !viewIncrementedRef.current) {
      viewIncrementedRef.current = true;
      incrementView.mutate(initialPost.id);
    }
  }, [initialPost.id, incrementView]);
  
  const isOwnPost = user && post.author?.id ? post.author.id === user.id : false;
  const [newComment, setNewComment] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyToAnswer, setReplyToAnswer] = useState<string | null>(null);
  const [answerReplyContent, setAnswerReplyContent] = useState('');

  const [commentWarnings, setCommentWarnings] = useState({ banned: false, spam: false });
  const [replyWarnings, setReplyWarnings] = useState({ banned: false, spam: false });
  const [answerWarnings, setAnswerWarnings] = useState({ banned: false, spam: false });
  const [answerReplyWarnings, setAnswerReplyWarnings] = useState({ banned: false, spam: false });
  const commentValidation = useMemo(
    () => validateUgcText(newComment, UGC_LIMITS.commentContent.min, UGC_LIMITS.commentContent.max),
    [newComment]
  );
  const commentTooShort = commentValidation.ok === false && commentValidation.code === 'UGC_TOO_SHORT';
  const replyValidation = useMemo(
    () => validateUgcText(replyContent, UGC_LIMITS.commentContent.min, UGC_LIMITS.commentContent.max),
    [replyContent]
  );
  const answerValidation = useMemo(
    () => validateUgcText(newAnswer, UGC_LIMITS.answerContent.min, UGC_LIMITS.answerContent.max),
    [newAnswer]
  );
  const answerReplyValidation = useMemo(
    () => validateUgcText(answerReplyContent, UGC_LIMITS.commentContent.min, UGC_LIMITS.commentContent.max),
    [answerReplyContent]
  );
  const commentValidationMessage = commentValidation.ok ? '' : getUgcErrorMessage(commentValidation, 'commentContent');
  const replyValidationMessage = replyValidation.ok ? '' : getUgcErrorMessage(replyValidation, 'commentContent');
  const answerValidationMessage = answerValidation.ok ? '' : getUgcErrorMessage(answerValidation, 'answerContent');
  const answerReplyValidationMessage = answerReplyValidation.ok ? '' : getUgcErrorMessage(answerReplyValidation, 'commentContent');
  const commentHasValidationError = !commentValidation.ok;
  const replyHasValidationError = !replyValidation.ok;
  const answerHasValidationError = !answerValidation.ok;
  const answerReplyHasValidationError = !answerReplyValidation.ok;
  const showCommentValidationError = commentWarnings.banned || commentWarnings.spam || commentHasValidationError;
  const showReplyValidationError = replyWarnings.banned || replyWarnings.spam || replyHasValidationError;
  const showAnswerValidationError = answerWarnings.banned || answerWarnings.spam || answerHasValidationError;
  const showAnswerReplyValidationError = answerReplyWarnings.banned || answerReplyWarnings.spam || answerReplyHasValidationError;

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment' | 'answer'; id: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const answersRef = useRef<HTMLDivElement | null>(null);
  const answersLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const commentsLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const answersHashHandledRef = useRef(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerContent, setEditAnswerContent] = useState('');
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [showAnswerEditor, setShowAnswerEditor] = useState(true);
  const [helpfulLoadingId, setHelpfulLoadingId] = useState<string | null>(null);

  const { data: fetchedCategories } = useCategories();
  const flatCategories = useMemo(() => {
    if (!fetchedCategories) return [];
    const children = fetchedCategories.flatMap((cat) => cat.children || []);
    return [...fetchedCategories, ...children];
  }, [fetchedCategories]);

  const resolveCategorySlug = useCallback(
    (value?: string | null) => {
      const raw = value?.trim();
      if (!raw) return '';
      if (ALLOWED_CATEGORY_SLUGS.has(raw)) return raw;
      const match = flatCategories.find((cat) => cat.id === raw || cat.slug === raw);
      return match?.slug || '';
    },
    [flatCategories]
  );

  const categorySlug = useMemo(() => resolveCategorySlug(post.category), [post.category, resolveCategorySlug]);
  const subcategorySlug = useMemo(() => resolveCategorySlug(post.subcategory), [post.subcategory, resolveCategorySlug]);
  function mapSlugToLabel(slug?: string) {
    if (!slug) return '';
    if (!ALLOWED_CATEGORY_SLUGS.has(slug)) return '';
    const legacy = LEGACY_CATEGORIES.find((c) => c.slug === slug);
    if (legacy) {
      return getCategoryName(legacy, locale);
    }
    return slug;
  }

  const categoryLabel = useMemo(() => mapSlugToLabel(categorySlug), [categorySlug, locale]);
  const subcategoryLabel = useMemo(() => mapSlugToLabel(subcategorySlug), [subcategorySlug, locale]);

  const getUgcErrorKeyMap: Record<'answerContent' | 'commentContent', Record<UgcValidationErrorCode, string>> = {
    answerContent: {
      UGC_REQUIRED: 'ANSWER_REQUIRED',
      UGC_TOO_SHORT: 'ANSWER_TOO_SHORT',
      UGC_TOO_LONG: 'ANSWER_TOO_LONG',
      UGC_LOW_QUALITY: 'ANSWER_LOW_QUALITY',
    },
    commentContent: {
      UGC_REQUIRED: 'COMMENT_REQUIRED',
      UGC_TOO_SHORT: 'COMMENT_TOO_SHORT',
      UGC_TOO_LONG: 'COMMENT_TOO_LONG',
      UGC_LOW_QUALITY: 'COMMENT_LOW_QUALITY',
    },
  };

  function getUgcErrorMessage(
    result: UgcValidationResult,
    field: 'answerContent' | 'commentContent'
  ) {
    if (result.ok) return '';
    const key = getUgcErrorKeyMap[field][result.code];
    if (key && tErrors[key]) return tErrors[key];
    return tErrors.CONTENT_PROHIBITED || '금칙어/저품질 콘텐츠로 작성할 수 없습니다.';
  }

  const uniqueTags = useMemo(() => {
    if (!post?.tags) return [];
    const reserved = new Set(
      [
        tTrust.verifiedLabel,
        tTrust.verifiedStudentLabel,
        tTrust.verifiedWorkerLabel,
        tTrust.verifiedUserLabel,
        tTrust.trustedAnswererLabel,
        tTrust.expertLabel,
        tTrust.expertVisaLabel,
        tTrust.expertEmploymentLabel,
        tTrust.communityLabel,
        tTrust.outdatedLabel,
        'verified',
        'expert',
        'community',
        'outdated',
        'đã xác minh',
        'chuyên gia',
        'cộng đồng',
        'hết hạn',
        '검증됨',
        '전문가',
        '커뮤니티',
        '오래된 정보',
      ]
        .map((v) => v?.toString().trim())
        .filter(Boolean)
        .map((v) => normalizeKey(v))
    );
    const catLabels = [categoryLabel, subcategoryLabel]
      .filter(Boolean)
      .map((v) => normalizeKey(v as string));
    const seen = new Set<string>();
    const cleaned: string[] = [];
    post.tags.forEach((tag) => {
      const raw = tag?.replace(/^#/, '').trim();
      if (!raw) return;
      const key = normalizeKey(raw);
      if (catLabels.includes(key)) return;
      if (reserved.has(key)) return;
      if (!seen.has(key)) {
        seen.add(key);
        cleaned.push(raw);
      }
    });
    return cleaned;
  }, [post.tags, categoryLabel, subcategoryLabel, tTrust.communityLabel, tTrust.expertEmploymentLabel, tTrust.expertLabel, tTrust.expertVisaLabel, tTrust.outdatedLabel, tTrust.trustedAnswererLabel, tTrust.verifiedLabel, tTrust.verifiedStudentLabel, tTrust.verifiedUserLabel, tTrust.verifiedWorkerLabel]);

  const categoryChips = useMemo(() => {
    const base = [categoryLabel || tCommon.uncategorized || '미지정', subcategoryLabel]
      .map((v) => v?.trim())
      .filter(Boolean) as string[];
    const seen = new Set<string>();
    return base.filter((value) => {
      const key = normalizeKey(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categoryLabel, subcategoryLabel, tCommon.uncategorized]);

  const tagChips = useMemo(() => uniqueTags.slice(0, 3), [uniqueTags]);
  const sortedAnswers = useMemo(() => {
    if (!post?.answers) return [];
    const byDate = (value: string) => dayjs(value).valueOf() || 0;
    return [...post.answers].sort((a, b) => {
      if (a.isAdopted && !b.isAdopted) return -1;
      if (!a.isAdopted && b.isAdopted) return 1;
      const expertA = !!a.author?.isExpert;
      const expertB = !!b.author?.isExpert;
      if (expertA !== expertB) return expertB ? 1 : -1;
      if (b.helpful !== a.helpful) return b.helpful - a.helpful;
      return byDate(b.publishedAt) - byDate(a.publishedAt);
    });
  }, [post?.answers]);

  const isUserPost = user && post.author?.id ? post.author.id === user.id : false;
  const checkText = (text: string) => {
    const sanitized = text
      // remove image tags (src가 이미지인 경우 링크 검사 제외)
      .replace(/<img[^>]*>/gi, ' ')
      // 허용 도메인(예: supabase 저장소) 제거
      .replace(/https?:\/\/[^\s"']*supabase\.co[^\s"']*/gi, ' ')
      // 이미지 확장자 링크 제거
      .replace(/https?:\/\/[^\s"']+\.(png|jpe?g|gif|webp)/gi, ' ');
    return {
      banned: bannedPatterns.some((pattern) => pattern.test(text)),
      spam: spamPatterns.some((pattern) => pattern.test(sanitized)),
    };
  };

  useEffect(() => {
    setCommentWarnings(checkText(newComment));
  }, [newComment]);

  useEffect(() => {
    setReplyWarnings(checkText(replyContent));
  }, [replyContent]);

  useEffect(() => {
    setAnswerWarnings(checkText(newAnswer));
  }, [newAnswer]);

  useEffect(() => {
    setAnswerReplyWarnings(checkText(answerReplyContent));
  }, [answerReplyContent]);

  const handleLike = async () => {
    if (!user) {
      openLoginPrompt();
      return;
    }
    const prevPost = { ...post };
    const newIsLiked = !post.isLiked;
    setPost({
      ...post,
      isLiked: newIsLiked,
      stats: {
        ...post.stats,
        likes: newIsLiked ? (post.stats?.likes ?? 0) + 1 : Math.max(0, (post.stats?.likes ?? 0) - 1),
      },
    });
    try {
      await toggleLike.mutateAsync(post.id);
    } catch (error) {
      setPost(prevPost);
      console.error('Failed to toggle like:', error);
    }
  };
  const scrollToAnswers = () => {
    if (answersRef.current) {
      answersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (answersHashHandledRef.current) return;
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    const section = new URLSearchParams(window.location.search).get('section');
    if (hash === '#answers' || hash === '#comments' || section === 'answers' || section === 'comments') {
      answersHashHandledRef.current = true;
      setTimeout(() => scrollToAnswers(), 50);
    }
  }, []);

  const handleBookmark = async () => {
    if (!user) {
      openLoginPrompt();
      return;
    }
    const prevPost = { ...post };
    const newIsBookmarked = !post.isBookmarked;
    setPost({
      ...post,
      isBookmarked: newIsBookmarked,
    });
    try {
      await toggleBookmark.mutateAsync(post.id);
    } catch (error) {
      setPost(prevPost);
      console.error('Failed to toggle bookmark:', error);
    }
  };
  const handleFollowChange = (next: boolean) => {
    if (!post.author) return;
    setPost({
      ...post,
      author: {
        ...post.author,
        isFollowing: next,
        followers: next
          ? (post.author.followers ?? 0) + 1
          : Math.max(0, (post.author.followers ?? 0) - 1),
      },
    });
  };

  const handleDeletePost = async () => {
    if (!confirm(tPostDetail.confirmDeletePost || '정말 이 게시글을 삭제하시겠습니까?')) return;

    try {
      await deletePostMutation.mutateAsync(post.id);
      toast.success(tPostDetail.postDeleted || '게시글이 삭제되었습니다.');
      router.push(`/${locale}`);
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.postDeleteFailed || '게시글 삭제에 실패했습니다.'));
    }
  };

  const handleEditPost = () => {
    setEditPostTitle(post.title);
    setEditPostContent(post.content);
    setIsEditingPost(true);
  };

  const handleCancelEditPost = () => {
    setIsEditingPost(false);
    setEditPostTitle('');
    setEditPostContent('');
  };

  const handleSaveEditPost = async () => {
    if (!editPostTitle.trim() || !editPostContent.trim()) {
      toast.error(tPostDetail.titleContentRequired || '제목과 내용을 입력해주세요.');
      return;
    }

    try {
      const result = await updatePostMutation.mutateAsync({
        id: post.id,
        data: {
          title: editPostTitle.trim(),
          content: editPostContent.trim(),
        },
      });

      if (result.success) {
        setPost({
          ...post,
          title: editPostTitle.trim(),
          content: editPostContent.trim(),
        });
        setIsEditingPost(false);
        setEditPostTitle('');
        setEditPostContent('');
      }
    } catch (error) {
      console.error('Failed to update post:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.postUpdateFailed || '게시글 수정에 실패했습니다.'));
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) {
      openLoginPrompt();
      return;
    }

    const prevPost = { ...post, comments: post.comments.map(c => ({ ...c, replies: c.replies ? [...c.replies] : [] })) };
    
    const updateCommentLike = (comments: Comment[]): Comment[] => {
      return comments.map((comment) => {
        if (comment.id === commentId) {
          const newIsLiked = !comment.isLiked;
          return {
            ...comment,
            isLiked: newIsLiked,
            likes: newIsLiked ? comment.likes + 1 : Math.max(0, comment.likes - 1),
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (reply.id === commentId) {
                const newIsLiked = !reply.isLiked;
                return {
                  ...reply,
                  isLiked: newIsLiked,
                  likes: newIsLiked ? reply.likes + 1 : Math.max(0, reply.likes - 1),
                };
              }
              return reply;
            }),
          };
        }
        return comment;
      });
    };

    setPost({
      ...post,
      comments: updateCommentLike(post.comments),
    });

    try {
      await toggleCommentLike.mutateAsync({ commentId, postId: post.id });
    } catch (error) {
      setPost(prevPost);
      console.error('Failed to toggle comment like:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (commentWarnings.banned || commentWarnings.spam) {
      toast.error(commentWarnings.banned ? (tPostDetail.bannedWarning || '금칙어가 포함되어 있습니다. 내용을 순화해주세요.') : (tPostDetail.spamWarning || '외부 링크/연락처가 감지되었습니다. 정보성 글만 허용됩니다.'));
      return;
    }
    if (!commentValidation.ok) {
      toast.error(getUgcErrorMessage(commentValidation, 'commentContent'));
      return;
    }

    if (!user) {
      openLoginPrompt();
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      author: {
        id: user.id,
        name: user.name || '사용자',
        avatar: user.image || '/avatar-default.jpg',
        isVerified: false,
      },
      content: newComment.trim(),
      publishedAt: justNowLabel,
      likes: 0,
      isLiked: false,
      replies: [],
    };

    const prevPost = { ...post, comments: [...post.comments] };
    setPost({
      ...post,
      comments: [...post.comments, optimisticComment],
      stats: {
        ...post.stats,
        comments: (post.stats?.comments ?? 0) + 1,
      },
    });
    setNewComment('');

    try {
      const result = await createCommentMutation.mutateAsync({
        postId: post.id,
        data: { content: newComment.trim() },
      });

      if (result.success && result.data) {
        const actualComment: Comment = {
          id: result.data.id,
          author: {
            id: result.data.author?.id || user.id,
            name: result.data.author?.displayName || result.data.author?.name || user.name || '사용자',
            avatar: result.data.author?.image || user.image || '/avatar-default.jpg',
            isVerified: result.data.author?.isVerified || false,
          },
          content: result.data.content,
          publishedAt: justNowLabel,
          likes: 0,
          isLiked: false,
          replies: [],
        };

        setPost(prev => ({
          ...prev,
          comments: prev.comments.map(c => c.id === tempId ? actualComment : c),
        }));
      }
    } catch (error) {
      setPost(prevPost);
      setNewComment(newComment);
      console.error('Failed to create comment:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.commentCreateFailed || '댓글 작성에 실패했습니다.'));
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openLoginPrompt();
      return;
    }
    if (!newAnswer.trim() || !post) return;
    if (answerWarnings.banned || answerWarnings.spam) {
      toast.error(answerWarnings.banned ? (tPostDetail.bannedWarning || '금칙어가 포함되어 있습니다. 내용을 순화해주세요.') : (tPostDetail.spamWarning || '외부 링크/연락처가 감지되었습니다. 정보성 글만 허용됩니다.'));
      return;
    }
    if (!answerValidation.ok) {
      toast.error(getUgcErrorMessage(answerValidation, 'answerContent'));
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticAnswer: Answer = {
      id: tempId,
      author: {
        id: user.id,
        name: user.name || '사용자',
        avatar: user.image || '/avatar-default.jpg',
        isVerified: !!(user as any).isVerified,
        isExpert: !!(user as any).isExpert,
      },
      content: newAnswer.trim(),
      publishedAt: justNowLabel,
      helpful: 0,
      isHelpful: false,
      isAdopted: false,
      replies: [],
    };

    const prevPost = { ...post, answers: post.answers ? [...post.answers] : [] };
    setPost({
      ...post,
      answers: [optimisticAnswer, ...(post.answers || [])],
      stats: {
        ...post.stats,
        comments: (post.stats?.comments ?? 0) + 1,
      },
    });
    setNewAnswer('');

    try {
      const result = await createAnswer.mutateAsync({
        postId: post.id,
        data: { content: newAnswer.trim() },
      });

      if (result.success && result.data) {
        const actualAnswer: Answer = {
          id: result.data.id,
          author: {
            id: result.data.author?.id,
            name: result.data.author?.displayName || result.data.author?.name || user.name || '사용자',
            avatar: result.data.author?.image || user.image || '/avatar-default.jpg',
            isVerified: result.data.author?.isVerified,
            isExpert: result.data.author?.isExpert,
          },
          content: result.data.content,
          publishedAt: justNowLabel,
          helpful: 0,
          isHelpful: false,
          isAdopted: false,
          replies: [],
        };

        setPost(prev => ({
          ...prev,
          answers: (prev.answers || []).map(a => a.id === tempId ? actualAnswer : a),
        }));
      }
    } catch (error) {
      setPost(prevPost);
      setNewAnswer(newAnswer);
      console.error('Failed to create answer:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.answerCreateFailed || '답변 작성에 실패했습니다.'));
    }
  };

  const handleToggleHelpful = async (answerId: string) => {
    if (!post || !post.answers || !user || helpfulLoadingId === answerId) return;

    const prevPost = { ...post, answers: [...post.answers] };
    const answer = post.answers.find(a => a.id === answerId);
    if (!answer) return;
    
    const newIsHelpful = !answer.isHelpful;
    setHelpfulLoadingId(answerId);
    setPost({
      ...post,
      answers: post.answers.map((a) => {
        if (a.id === answerId) {
          return {
            ...a,
            isHelpful: newIsHelpful,
            helpful: newIsHelpful ? a.helpful + 1 : Math.max(0, a.helpful - 1),
          };
        }
        return a;
      }),
    });
    
    try {
      await toggleAnswerLike.mutateAsync({ answerId, postId: post.id });
      toast.success(newIsHelpful ? (tCommon.helpfulPrompt || '도움됨을 눌렀습니다.') : (tCommon.helpfulCancel || '도움됨을 취소했습니다.'));
    } catch (error) {
      setPost(prevPost);
      console.error('Failed to toggle helpful:', error);
      toast.error(tPostDetail.answerCreateFailed || '도움됨 처리에 실패했습니다.');
    } finally {
      setHelpfulLoadingId(null);
    }
  };

  const handleEditAnswer = (answerId: string, content: string) => {
    setEditingAnswerId(answerId);
    setEditAnswerContent(content);
  };

  const handleCancelEditAnswer = () => {
    setEditingAnswerId(null);
    setEditAnswerContent('');
  };

  const handleSaveAnswerEdit = async (answerId: string) => {
    if (!editAnswerContent.trim()) return;

    try {
      await updateAnswerMutation.mutateAsync({
        id: answerId,
        data: { content: editAnswerContent.trim() },
        postId: post.id,
      });

      setPost({
        ...post,
        answers: post.answers?.map((answer) => {
          if (answer.id === answerId) {
            return { ...answer, content: editAnswerContent.trim() };
          }
          return answer;
        }),
      });

      setEditingAnswerId(null);
      setEditAnswerContent('');
    } catch (error) {
      console.error('Failed to update answer:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.answerUpdateFailed || '답변 수정에 실패했습니다.'));
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!confirm(tPostDetail.confirmDeleteAnswer || '답변을 삭제하시겠습니까?')) return;

    try {
      await deleteAnswerMutation.mutateAsync({ id: answerId, postId: post.id });

      setPost({
        ...post,
        answers: post.answers?.filter((answer) => answer.id !== answerId),
        stats: {
          ...post.stats,
          comments: (post.stats?.comments ?? 0) - 1,
        },
      });
    } catch (error) {
      console.error('Failed to delete answer:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.answerDeleteFailed || '답변 삭제에 실패했습니다.'));
    }
  };

  const handleAdoptAnswer = async (answerId: string) => {
    if (!post || !post.answers) return;
    if (!isUserPost) {
      toast.error(tPostDetail.onlyAuthorCanAdopt || '질문 작성자만 답변을 채택할 수 있습니다.');
      return;
    }

    const alreadyAdopted = post.answers.some((a) => a.isAdopted);
    const prevPost = { ...post, answers: [...post.answers] };
    setPost({
      ...post,
      answers: post.answers.map((answer) => {
        if (answer.id === answerId) {
          return { ...answer, isAdopted: true };
        }
        return answer;
      }),
      isAdopted: true,
    });
    
    try {
      await adoptAnswer.mutateAsync({ answerId, postId: post.id });
      toast.success(tCommon.adopt || '채택되었습니다.');
    } catch (error) {
      setPost(prevPost);
      console.error('Failed to adopt answer:', error);
      toast.error(tPostDetail.adoptFailed || '답변 채택에 실패했습니다.');
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (replyWarnings.banned || replyWarnings.spam) {
      toast.error(replyWarnings.banned ? (tPostDetail.bannedWarning || '금칙어가 포함되어 있습니다. 내용을 순화해주세요.') : (tPostDetail.spamWarning || '외부 링크/연락처가 감지되었습니다. 정보성 글만 허용됩니다.'));
      return;
    }
    if (!replyValidation.ok) {
      toast.error(getUgcErrorMessage(replyValidation, 'commentContent'));
      return;
    }

    if (!user) {
      openLoginPrompt();
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticReply: Comment = {
      id: tempId,
      author: {
        id: user.id,
        name: user.name || '사용자',
        avatar: user.image || '/avatar-default.jpg',
        isVerified: false,
      },
      content: replyContent.trim(),
      publishedAt: justNowLabel,
      likes: 0,
      isLiked: false,
    };

    const prevPost = { ...post, comments: post.comments.map(c => ({ ...c, replies: c.replies ? [...c.replies] : [] })) };
    setPost({
      ...post,
      comments: post.comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), optimisticReply],
          };
        }
        return comment;
      }),
      stats: {
        ...post.stats,
        comments: (post.stats?.comments ?? 0) + 1,
      },
    });
    setReplyContent('');
    setReplyTo(null);

    try {
      const result = await createCommentMutation.mutateAsync({
        postId: post.id,
        data: { content: replyContent.trim(), parentId: commentId },
      });

      if (result.success && result.data) {
        const actualReply: Comment = {
          id: result.data.id,
          author: {
            id: result.data.author?.id || user.id,
            name: result.data.author?.displayName || result.data.author?.name || user.name || '사용자',
            avatar: result.data.author?.image || user.image || '/avatar-default.jpg',
            isVerified: result.data.author?.isVerified || false,
          },
          content: result.data.content,
          publishedAt: justNowLabel,
          likes: 0,
          isLiked: false,
        };

        setPost(prev => ({
          ...prev,
          comments: prev.comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: (comment.replies || []).map(r => r.id === tempId ? actualReply : r),
              };
            }
            return comment;
          }),
        }));
      }
    } catch (error) {
      setPost(prevPost);
      setReplyContent(replyContent);
      setReplyTo(commentId);
      console.error('Failed to create reply:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.replyCreateFailed || '대댓글 작성에 실패했습니다.'));
    }
  };

  const handleShare = () => {
    setShareMenuOpen(true);
  };

  const openReportDialog = (type: 'post' | 'comment' | 'answer', id: string) => {
    if (!user) {
      openLoginPrompt();
      return;
    }
    setReportTarget({ type, id });
    setReportReason('');
    setSelectedReportType('spam');
    setShowReportDialog(true);
  };

  const handleReportAnswerReply = (replyId: string) => {
    openReportDialog('comment', replyId);
  };

  const handleReport = async (type: ReportType) => {
    if (!reportTarget) return;
    if (type === 'other' && reportReason.length < 10) {
      toast.error(tPostDetail.reportReasonRequired || '신고 사유를 10자 이상 입력해주세요.');
      return;
    }

    const reason = type === 'other' ? reportReason : type;

    try {
      if (reportTarget.type === 'post') {
        await reportPostMutation.mutateAsync({
          postId: reportTarget.id,
          data: { type, reason },
        });
      } else if (reportTarget.type === 'comment') {
        await reportCommentMutation.mutateAsync({
          commentId: reportTarget.id,
          data: { type, reason },
        });
      } else if (reportTarget.type === 'answer') {
        await reportAnswerMutation.mutateAsync({
          answerId: reportTarget.id,
          data: { type, reason },
        });
      }
      toast.success(tPostDetail.reportSubmitted || '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      setShowReportDialog(false);
      setReportTarget(null);
      setReportReason('');
      setSelectedReportType(null);
    } catch (error) {
      toast.error(resolveErrorMessage(error, tPostDetail.reportFailed || '신고 처리 중 오류가 발생했습니다.'));
    }
  };

  const handleDeleteComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!confirm(tPostDetail.confirmDeleteComment || '댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteCommentMutation.mutateAsync({ id: commentId, postId: post.id });

      let deletedCount = 1;
      if (!isReply) {
        const commentToDelete = post.comments.find((c) => c.id === commentId);
        if (commentToDelete && commentToDelete.replies) {
          deletedCount += commentToDelete.replies.length;
        }
      }

      setPost({
        ...post,
        comments: post.comments
          .filter((comment) => comment.id !== commentId)
          .map((comment) => {
            if (comment.id === parentId && comment.replies) {
              return {
                ...comment,
                replies: comment.replies.filter((reply) => reply.id !== commentId),
              };
            }
            return comment;
          }),
        stats: {
          ...post.stats,
          comments: (post.stats?.comments ?? 0) - deletedCount,
        },
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.commentDeleteFailed || '댓글 삭제에 실패했습니다.'));
    }
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = async (commentId: string, _isReply: boolean = false, parentId?: string) => {
    if (!editContent.trim()) return;

    try {
      await updateCommentMutation.mutateAsync({
        id: commentId,
        data: { content: editContent.trim() },
        postId: post.id,
      });

      setPost({
        ...post,
        comments: post.comments.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, content: editContent };
          }
          if (comment.id === parentId && comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === commentId ? { ...reply, content: editContent } : reply
              ),
            };
          }
          return comment;
        }),
      });

      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.commentUpdateFailed || '댓글 수정에 실패했습니다.'));
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleSubmitAnswerReply = async (e: React.FormEvent, answerId: string) => {
    e.preventDefault();
    if (!user) {
      openLoginPrompt();
      return;
    }
    if (!answerReplyContent.trim() || !post || !post.answers) return;
    if (answerReplyWarnings.banned || answerReplyWarnings.spam) {
      toast.error(answerReplyWarnings.banned ? (tPostDetail.bannedWarning || '금칙어가 포함되어 있습니다. 내용을 순화해주세요.') : (tPostDetail.spamWarning || '외부 링크/연락처가 감지되었습니다. 정보성 글만 허용됩니다.'));
      return;
    }
    if (!answerReplyValidation.ok) {
      toast.error(getUgcErrorMessage(answerReplyValidation, 'commentContent'));
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticReply: AnswerReply = {
      id: tempId,
      author: {
        id: user.id,
        name: user.name || '사용자',
        avatar: user.image || '/avatar-default.jpg',
        isVerified: false,
      },
      content: answerReplyContent.trim(),
      publishedAt: justNowLabel,
      likes: 0,
      isLiked: false,
    };

    const prevPost = { ...post, answers: post.answers.map(a => ({ ...a, replies: a.replies ? [...a.replies] : [] })) };
    setPost({
      ...post,
      answers: post.answers.map((answer) => {
        if (answer.id === answerId) {
          return {
            ...answer,
            replies: [...(answer.replies || []), optimisticReply],
          };
        }
        return answer;
      }),
      stats: {
        ...post.stats,
        comments: (post.stats?.comments ?? 0) + 1,
      },
    });
    setAnswerReplyContent('');
    setReplyToAnswer(null);

    try {
      const result = await createAnswerComment.mutateAsync({
        answerId,
        data: { content: answerReplyContent.trim() },
        postId: post.id,
      });

      if (result.success && result.data) {
        const actualReply: AnswerReply = {
          id: result.data.id,
          author: {
            id: result.data.author?.id,
            name: result.data.author?.displayName || result.data.author?.name || user.name || '사용자',
            avatar: result.data.author?.image || user.image || '/avatar-default.jpg',
            isVerified: result.data.author?.isVerified,
          },
          content: result.data.content,
          publishedAt: justNowLabel,
          likes: 0,
          isLiked: false,
        };

        setPost(prev => ({
          ...prev,
          answers: (prev.answers || []).map((answer) => {
            if (answer.id === answerId) {
              return {
                ...answer,
                replies: (answer.replies || []).map(r => r.id === tempId ? actualReply : r),
              };
            }
            return answer;
          }),
        }));
      }
    } catch (error) {
      setPost(prevPost);
      setAnswerReplyContent(answerReplyContent);
      setReplyToAnswer(answerId);
      console.error('Failed to create answer reply:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.answerCommentCreateFailed || '답변 댓글 작성에 실패했습니다.'));
    }
  };

  const handleAnswerReplyLike = async (answerId: string, replyId: string) => {
    if (!user) {
      openLoginPrompt();
      return;
    }
    if (!post || !post.answers) return;

    const prevPost = { ...post, answers: post.answers.map(a => ({ ...a, replies: a.replies ? [...a.replies] : [] })) };
    
    setPost({
      ...post,
      answers: post.answers.map((answer) => {
        if (answer.id === answerId && answer.replies) {
          return {
            ...answer,
            replies: answer.replies.map((reply) => {
              if (reply.id === replyId) {
                const newIsLiked = !reply.isLiked;
                return {
                  ...reply,
                  isLiked: newIsLiked,
                  likes: newIsLiked ? reply.likes + 1 : Math.max(0, reply.likes - 1),
                };
              }
              return reply;
            }),
          };
        }
        return answer;
      }),
    });

    try {
      await toggleCommentLike.mutateAsync({ commentId: replyId, postId: post.id });
    } catch (error) {
      setPost(prevPost);
      console.error('Failed to toggle answer reply like:', error);
    }
  };

  const handleDeleteAnswerReply = async (answerId: string, replyId: string) => {
    if (!confirm(tPostDetail.confirmDeleteReply || '답글을 삭제하시겠습니까?')) return;

    try {
      await deleteCommentMutation.mutateAsync({ id: replyId, postId: post.id });

      setPost({
        ...post,
        answers: post.answers?.map((answer) => {
          if (answer.id === answerId && answer.replies) {
            return {
              ...answer,
              replies: answer.replies.filter((reply) => reply.id !== replyId),
            };
          }
          return answer;
        }),
        stats: {
          ...post.stats,
          comments: (post.stats?.comments ?? 0) - 1,
        },
      });
    } catch (error) {
      console.error('Failed to delete reply:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.replyDeleteFailed || '답글 삭제에 실패했습니다.'));
    }
  };

  const handleEditAnswerReply = (replyId: string, content: string) => {
    setEditingCommentId(replyId);
    setEditContent(content);
  };

  const handleSaveAnswerReplyEdit = async (answerId: string, replyId: string) => {
    if (!editContent.trim() || !post || !post.answers) return;

    try {
      await updateCommentMutation.mutateAsync({
        id: replyId,
        data: { content: editContent.trim() },
        postId: post.id,
      });

      setPost({
        ...post,
        answers: post.answers.map((answer) => {
          if (answer.id === answerId && answer.replies) {
            return {
              ...answer,
              replies: answer.replies.map((reply) =>
                reply.id === replyId ? { ...reply, content: editContent } : reply
              ),
            };
          }
          return answer;
        }),
      });

      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update reply:', error);
      toast.error(resolveErrorMessage(error, tPostDetail.replyUpdateFailed || '답글 수정에 실패했습니다.'));
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const answerLimits = UGC_LIMITS.answerContent;
  const answerTextLength = getPlainTextLength(newAnswer || '');
  const answerRemaining = Math.max(0, answerLimits.min - answerTextLength);
  const answerTotalCount = Math.max(
    sortedAnswers.length,
    answersInfiniteQuery.data?.pages?.[0]?.pagination?.total || 0
  );
  const answerEmptyLabel = tPostDetail.answerEmpty || (locale === 'vi' ? 'Chưa có câu trả lời.' : locale === 'en' ? 'No answers yet.' : '아직 답변이 없습니다.');
  const answerCountLabel = tPostDetail.answerCountLabel
    ? (tPostDetail.answerCountLabel.includes('{count}')
      ? tPostDetail.answerCountLabel.replace('{count}', String(answerTotalCount))
      : `${answerTotalCount}${tPostDetail.answerCountLabel}`)
    : (locale === 'vi'
      ? `${answerTotalCount} câu trả lời`
      : locale === 'en'
        ? `${answerTotalCount} answers`
        : `${answerTotalCount}개의 답변이 있어요!`);
  const answerMinHintLabel = locale === 'vi'
    ? `Vui lòng viết ít nhất ${answerLimits.min} ký tự.`
    : locale === 'en'
      ? `Please write at least ${answerLimits.min} characters.`
      : `${answerLimits.min}자 이상 작성해주세요.`;
  const answerMinCharsLabel = answerRemaining > 0
    ? (() => {
      const template = tPostDetail.answerCharsLeft;
      const hasRemaining = template?.includes('{remaining}');
      const hasMin = template?.includes('{min}');
      if (template && (hasRemaining || hasMin)) {
        return template
          .replace('{remaining}', String(answerRemaining))
          .replace('{min}', String(answerLimits.min));
      }
      return locale === 'vi'
        ? `Cần thêm ${answerRemaining} ký tự (tối thiểu ${answerLimits.min})`
        : locale === 'en'
          ? `Need ${answerRemaining} more characters (min ${answerLimits.min})`
          : `${answerRemaining}자 더 입력해주세요 (최소 ${answerLimits.min}자)`;
    })()
    : '';
  const answerReadyLabel = tPostDetail.answerReady || (locale === 'vi' ? 'Đủ độ dài' : locale === 'en' ? 'Ready to post' : '충분히 작성됨');
  const answersTitle = post?.isQuestion
    ? (tCommon.answer || (locale === 'vi' ? 'Câu trả lời' : locale === 'en' ? 'Answers' : '답변'))
    : (tCommon.comment || (locale === 'vi' ? 'Bình luận' : locale === 'en' ? 'Comments' : '댓글'));
  const writeAnswerLabel = tPostDetail.writeAnswer || (locale === 'vi' ? 'Viết câu trả lời' : locale === 'en' ? 'Write an answer' : '답변 작성');
  const answerPlaceholderLabel = tPostDetail.answerPlaceholder || (locale === 'vi' ? 'Hãy viết câu trả lời...' : locale === 'en' ? 'Write your answer...' : '답변을 작성해주세요...');

  const handleShareFacebook = () => {
    if (!shareUrl) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=600');
    setShareMenuOpen(false);
  };

  const handleShareX = () => {
    if (!shareUrl) return;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`, '_blank', 'width=600,height=600');
    setShareMenuOpen(false);
  };

  const handleShareTelegram = () => {
    if (!shareUrl) return;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`, '_blank', 'width=600,height=600');
    setShareMenuOpen(false);
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(tPostDetail.linkCopied || '링크가 복사되었습니다!');
    } catch (error) {
      console.error('Failed to copy link', error);
    } finally {
      setShareMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Unified Header */}
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        showBackButton={true}
        hideSearch={true}
        translations={translations || {}}
        rightActions={
          <>
            {isUserPost && (
              <>
                <Tooltip content={tCommon.edit || "수정"}>
                  <button
                    onClick={handleEditPost}
                    className="p-1.5 sm:p-2 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </Tooltip>
                <Tooltip content={tCommon.delete || "삭제"}>
                  <button
                    onClick={handleDeletePost}
                    className="p-1.5 sm:p-2 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </Tooltip>
              </>
            )}
            <Tooltip content={"북마크"}>
              <button
                onClick={handleBookmark}
                className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                  post.isBookmarked
                    ? 'text-red-600 bg-red-50 dark:bg-red-900/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </Tooltip>
            
          </>
        }
      />

      {/* Main Content */}
          <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Article */}
        <article className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4 sm:mb-6">
          {/* Thumbnail */}
          {renderThumbnailSrc && (
            <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px]">
              <Image
                src={renderThumbnailSrc}
                alt={post.title}
                fill
                className="object-cover"
                priority
                onError={() => setRenderThumbnailSrc('/brand-logo.png')}
              />
            </div>
          )}

          <div className="p-4 sm:p-6 md:p-8">
            {/* Edit Mode */}
            {isEditingPost ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    제목
                  </label>
                  <input
                    type="text"
                    value={editPostTitle}
                    onChange={(e) => setEditPostTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    내용
                  </label>
                  <RichTextEditor
                    content={editPostContent}
                    onChange={setEditPostContent}
                    placeholder={tPostDetail.editPlaceholder || "내용을 입력하세요..."}
                    translations={translations || {}}
                    tooltipPosition="below"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" size="sm" onClick={handleCancelEditPost}>
                    취소
                  </Button>
                  <Button size="sm" onClick={handleSaveEditPost}>
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {categoryChips.length > 0 ? (
                  <div className="mb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                    {categoryChips.map((tag) => (
                      <span
                        key={tag}
                        className="shrink-0 px-2 py-0.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700/60 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 flex-wrap">
                  <span className="text-gray-500 dark:text-gray-400">{formatDateTime(post.publishedAt, locale)}</span>
                  {post.isQuestion ? (
                    <>
                      <span className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] sm:text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-700 whitespace-nowrap">
                        <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {tCommon.question || "질문"}
                      </span>
                      {post.isAdopted ? (
                        <span className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[11px] sm:text-xs font-semibold rounded-full border border-green-200 dark:border-green-700 whitespace-nowrap">
                          <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {tPostDetail.adoptCompleted || "채택완료"}
                        </span>
                      ) : (
                        <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-700 whitespace-nowrap">
                          {tPostDetail.notAdopted || "미채택"}
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 leading-tight">
                  {post.title}
                </h1>
              </>
            )}

            {/* Author Info */}
            {!isEditingPost && (
	            <div className="mb-4 sm:mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
	              <div className="flex items-center gap-1 min-w-0">
                <button
                  type="button"
                  className="shrink-0"
                  onClick={() => post.author?.id && router.push(`/${locale}/profile/${post.author.id}`)}
                  aria-label={safeName(post.author)}
                >
                  <Avatar
                    name={safeName(post.author)}
                    imageUrl={post.author?.avatar}
                    size="lg"
                    hoverHighlight
                  />
                </button>

                {trustBadgePresentation.show ? (
                  <Tooltip content={trustBadgePresentation.tooltip} position="top">
                    <span className="shrink-0 inline-flex">
                      <TrustBadge level={trustBadgePresentation.level} label={trustBadgePresentation.label} />
                    </span>
                  </Tooltip>
                ) : null}

                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => post.author?.id && router.push(`/${locale}/profile/${post.author.id}`)}
                >
                  <span className="block truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                    {safeName(post.author)}
                  </span>
                </button>

                {!isUserPost && post.author?.id ? (
                  <FollowButton
                    userId={post.author.id}
                    userName={safeName(post.author)}
                    isFollowing={post.author.isFollowing}
                    size="xs"
                    className="shrink-0"
                    onToggle={handleFollowChange}
                  />
                ) : null}
              </div>
            </div>
            )}

            {/* Content */}
            {!isEditingPost && (
            <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none mb-6 sm:mb-4 leading-relaxed text-gray-800 dark:text-gray-200">
              <div
                className="leading-relaxed"
                dangerouslySetInnerHTML={createSafeUgcMarkup(post.content, {
                  targetBlank: true,
                })}
              />
            </div>
            )}

            {!isEditingPost && tagChips.length > 0 ? (
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {tagChips.map((tag) => (
                  <span
                    key={tag}
                    className="shrink-0 px-2 py-0.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700/60 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

	            {/* Action Buttons */}
	            {!isEditingPost && (
	          <div className="flex items-center gap-2 sm:gap-4 pt-4 sm:pt-6">
	            <Tooltip content={"좋아요"} position="top">
	              <button
	                onClick={handleLike}
	                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all ${
	                  post.isLiked
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ThumbsUp className={`h-4 w-4 sm:h-5 sm:w-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium text-sm sm:text-base">{post.stats?.likes ?? 0}</span>
              </button>
            </Tooltip>

            <Tooltip content={"링크 복사"} position="top">
              <button
                onClick={handleShare}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </Tooltip>

            <Tooltip content={tCommon.report || "신고"} position="top">
              <button
                onClick={() => openReportDialog('post', post.id)}
                className="ml-auto flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-800/50 transition-colors"
              >
                <Flag className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-semibold text-sm sm:text-base">{tCommon.report || "신고"}</span>
              </button>
            </Tooltip>
          </div>
            )}
         </div>
        </article>

        {/* Comments/Answers Section */}
        <section
          ref={answersRef}
          className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden p-4 sm:p-6 space-y-4 sm:space-y-5"
        >
          <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100" id={post.isQuestion ? 'answers' : 'comments'}>
              {answersTitle}
            </h2>
          </div>

          {post.isQuestion && (
            <div
              role="button"
              tabIndex={0}
              onClick={scrollToAnswers}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  scrollToAnswers();
                }
              }}
              className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition"
            >
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-300" />
              <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                {answersInfiniteQuery.isLoading
                  ? (tPost.loading || '로딩 중...')
                  : sortedAnswers.length > 0
                    ? answerCountLabel
                    : answerEmptyLabel}
              </span>
            </div>
          )}

          {post.isQuestion && (
            <div className="mb-2 sm:mb-3">
              <form onSubmit={handleSubmitAnswer} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {writeAnswerLabel}
                  </span>
                </div>
                <div className="min-h-[180px] sm:min-h-[200px] relative">
                  {!user && (
                    <button
                      type="button"
                      onClick={openLoginPrompt}
                      className="absolute inset-0 z-10 cursor-pointer"
                      aria-label="login-required"
                    />
                  )}
                  <div className={!user ? 'pointer-events-none opacity-60' : ''}>
                    <RichTextEditor
                      content={newAnswer}
                      onChange={setNewAnswer}
                      placeholder={answerPlaceholderLabel}
                      translations={translations || {}}
                      variant="basic"
                      tooltipPosition="below"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Tooltip content={guidelineTooltip} position="right">
                    <Button
                      type="submit"
                      disabled={!newAnswer.trim() || showAnswerValidationError || answerRemaining > 0}
                      size="sm"
                      className="order-1"
                    >
                      {writeAnswerLabel}
                    </Button>
                  </Tooltip>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 order-2">
                    {answerTextLength === 0 ? (
                      <span className="text-gray-500 dark:text-gray-400">
                        {answerMinHintLabel}
                      </span>
                    ) : answerRemaining > 0 ? (
                      <span className="text-red-500">
                        {answerMinCharsLabel}
                      </span>
                    ) : (
                      answerReadyLabel
                    )}
                  </span>
                </div>
                {showAnswerValidationError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-800 dark:text-red-100">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      {answerWarnings.banned ? <p>{tPostDetail.bannedWarning || '금칙어가 포함되어 있습니다. 내용을 순화해주세요.'}</p> : null}
                      {answerWarnings.spam ? (
                        <p className="flex items-center gap-1">
                          <LinkIcon className="h-4 w-4" />
                          <span>{tPostDetail.spamWarning || '외부 링크/연락처가 감지되었습니다. 정보성 글만 허용됩니다.'}</span>
                        </p>
                      ) : null}
                      {answerValidationMessage ? (
                        <p className="text-red-600 dark:text-red-300">{answerValidationMessage}</p>
                      ) : null}
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {post.isQuestion ? (
            <>
              {answersInfiniteQuery.isLoading ? (
                <div className="flex justify-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                  {tPost.loading || '로딩 중...'}
                </div>
              ) : sortedAnswers.length > 0 ? (
                <div className="space-y-6">
                  {sortedAnswers.map((answer, index) => (
                    <div
                      key={answer.id}
                      className={`rounded-lg p-3 sm:p-4 ${
                        answer.isAdopted
                          ? 'border-2 border-green-400 dark:border-emerald-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-emerald-900/30 dark:to-green-900/20 shadow-lg ring-2 ring-green-200 dark:ring-emerald-600/50'
                          : index === 0
                            ? 'border-2 border-blue-300/70 dark:border-blue-500/70 bg-blue-50/80 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-200/70 dark:ring-blue-700/60'
                            : 'border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 flex-1">
                              <div
                                className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-all min-w-0"
                                onClick={() => answer.author.id && router.push(`/${locale}/profile/${answer.author.id}`)}
                              >
                                <UserChip
                                  name={safeName(answer.author)}
                                  avatar={answer.author.avatar}
                                  isVerified={false}
                                  size="md"
                                />
                                {(() => {
                                  const badge = getTrustBadgePresentation({
                                    locale,
                                    author: answer.author,
                                    translations: tTrust,
                                  });
                                  if (!badge.show) return null;
                                  const badgeClassName = badge.level === 'expert'
                                    ? '!px-2 !py-0.5 border-amber-200'
                                    : '!px-2 !py-0.5';
                                  return (
                                    <Tooltip content={badge.tooltip} position="top">
                                      <span className="inline-flex">
                                        <TrustBadge
                                          level={badge.level}
                                          showLabel={false}
                                          label={badge.label}
                                          className={badgeClassName}
                                        />
                                      </span>
                                    </Tooltip>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {formatDateTime(answer.publishedAt, locale)}
                                </span>
                                {answer.isAdopted && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full border border-green-200 dark:border-green-700 whitespace-nowrap">
                                    <CheckCircle className="w-3 h-3" />
                                    {tCommon.adopted || "채택됨"}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {user && answer.author.id === user.id && !answer.isAdopted && (
                                <>
                                  {answer.id.startsWith('temp-') ? (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{tCommon.saving || '저장 중...'}</span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleEditAnswer(answer.id, answer.content)}
                                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
                                      >
                                        {tCommon.edit || "수정"}
                                      </button>
                                      <span className="text-gray-300 dark:text-gray-600">|</span>
                                      <button
                                        onClick={() => handleDeleteAnswer(answer.id)}
                                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap"
                                      >
                                        {tCommon.delete || "삭제"}
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                              {user && answer.author.id !== user.id && !answer.id.startsWith('temp-') && (
                                <button
                                  onClick={() => openReportDialog('answer', answer.id)}
                                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap"
                                >
                                  {tCommon.report || "신고"}
                                </button>
                              )}
                            </div>
                          </div>

                          {editingAnswerId === answer.id ? (
                            <div className="mb-4">
                              <RichTextEditor
                                content={editAnswerContent}
                                onChange={setEditAnswerContent}
                                placeholder={tPostDetail.editAnswerPlaceholder || "답변을 수정해주세요..."}
                                translations={translations || {}}
                                tooltipPosition="below"
                              />
                              <div className="flex justify-end gap-2 mt-3">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={handleCancelEditAnswer}
                                >
                                  취소
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSaveAnswerEdit(answer.id)}
                                  disabled={!editAnswerContent.trim()}
                                >
                                  저장
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="prose prose-sm sm:prose-base dark:prose-invert max-w-none mb-4 text-gray-800 dark:text-gray-200 leading-relaxed"
                              dangerouslySetInnerHTML={createSafeUgcMarkup(answer.content, {
                                targetBlank: true,
                              })}
                            />
                          )}

                          <div className="flex items-center flex-wrap gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
              <Tooltip content={tCommon.helpful || "도움됨"} position="top">
                <button
                  onClick={() => handleToggleHelpful(answer.id)}
                  disabled={helpfulLoadingId === answer.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                    answer.isHelpful
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } ${helpfulLoadingId === answer.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <ThumbsUp className={`h-4 w-4 ${answer.isHelpful ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{tCommon.helpful || "도움됨"} {answer.helpful}</span>
                  </button>
                </Tooltip>

                            <button
                              onClick={() => {
                                if (!user) {
                                  openLoginPrompt();
                                  return;
                                }
                                setReplyToAnswer(answer.id);
                              }}
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              {tCommon.reply || "답글"}
                            </button>

                            {!answer.isAdopted && isUserPost && !post.isAdopted && (
                              <div className="ml-auto">
                                <Button
                                  onClick={() => handleAdoptAnswer(answer.id)}
                                  variant="primary"
                                  size="sm"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  {tCommon.adopt || "채택하기"}
                                </Button>
                              </div>
                            )}
                          </div>

                          {replyToAnswer === answer.id && (
                            <form onSubmit={(e) => handleSubmitAnswerReply(e, answer.id)} className="mt-4">
                              <textarea
                                value={answerReplyContent}
                                onChange={(e) => setAnswerReplyContent(e.target.value)}
                                placeholder={tPostDetail.replyPlaceholder || "답글을 작성해주세요..."}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                rows={2}
                                autoFocus
                              />
                              {showAnswerReplyValidationError && (
                                <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-3 text-xs sm:text-sm text-red-800 dark:text-red-100">
                                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <div className="space-y-1">
                                    {answerReplyWarnings.banned ? <p>{tPostDetail.bannedWarning || '금칙어가 포함되어 있습니다. 내용을 순화해주세요.'}</p> : null}
                                    {answerReplyWarnings.spam ? (
                                      <p className="flex items-center gap-1">
                                        <LinkIcon className="h-4 w-4" />
                                        <span>{tPostDetail.spamWarning || '외부 링크/연락처가 감지되었습니다. 정보성 글만 허용됩니다.'}</span>
                                      </p>
                                    ) : null}
                                    {answerReplyValidationMessage ? <p className="text-red-600 dark:text-red-300">{answerReplyValidationMessage}</p> : null}
                                  </div>
                                </div>
                              )}
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setReplyToAnswer(null);
                                    setAnswerReplyContent('');
                                  }}
                                >
                                  취소
                                </Button>
                                <Tooltip content={guidelineTooltip} position="below">
                                  <Button type="submit" size="sm" disabled={!answerReplyContent.trim() || showAnswerReplyValidationError}>
                                    {tCommon.writeReply || "답글 작성"}
                                  </Button>
                                </Tooltip>
                              </div>
                            </form>
                          )}

                          {answer.replies && answer.replies.length > 0 && (
                            <div className="mt-4 space-y-4 pl-4 sm:pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                              {answer.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-3 sm:gap-4">
                                  <div
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => reply.author.id && router.push(`/${locale}/profile/${reply.author.id}`)}
                                  >
                                  <Avatar name={safeName(reply.author)} size="md" imageUrl={reply.author.avatar} />
                                  </div>
                                  <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => reply.author.id && router.push(`/${locale}/profile/${reply.author.id}`)}
                                >
                                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                    {safeName(reply.author)}
                                  </span>
                                  {(() => {
                                    const badge = getTrustBadgePresentation({
                                      locale,
                                      author: reply.author,
                                      translations: tTrust,
                                    });
                                    if (!badge.show) return null;
                                    const badgeClassName = badge.level === 'expert'
                                      ? '!px-2 !py-0.5 border-amber-200'
                                      : '!px-2 !py-0.5';
                                    return (
                                      <Tooltip content={badge.tooltip} position="top">
                                        <span className="inline-flex">
                                          <TrustBadge
                                            level={badge.level}
                                            showLabel={false}
                                            label={badge.label}
                                            className={badgeClassName}
                                          />
                                        </span>
                                      </Tooltip>
                                    );
                                  })()}
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDateTime(reply.publishedAt, locale)}
                                </span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        {user && reply.author.id === user.id ? (
                                          <>
                                            {reply.id.startsWith('temp-') ? (
                                              <span className="text-xs text-gray-400 dark:text-gray-500">{tCommon.saving || '저장 중...'}</span>
                                            ) : (
                                              <>
                                                <button
                                                  onClick={() => handleEditAnswerReply(reply.id, reply.content)}
                                                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                  {tCommon.edit || "수정"}
                                                </button>
                                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                                <button
                                                  onClick={() => handleDeleteAnswerReply(answer.id, reply.id)}
                                                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                >
                                                  {tCommon.delete || "삭제"}
                                                </button>
                                              </>
                                            )}
                                          </>
                                        ) : (
                                          user && (
                                            <button
                                              onClick={() => handleReportAnswerReply(reply.id)}
                                              className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                                            >
                                              <Flag className="w-3 h-3" />
                                              {tCommon.report || "신고"}
                                            </button>
                                          )
                                        )}
                                      </div>
                                    </div>

                                    {editingCommentId === reply.id ? (
                                      <div className="mb-2">
                                        <textarea
                                          value={editContent}
                                          onChange={(e) => setEditContent(e.target.value)}
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                          rows={2}
                                          autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                          <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                          >
                                            취소
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleSaveAnswerReplyEdit(answer.id, reply.id)}
                                            disabled={!editContent.trim()}
                                          >
                                            저장
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                    className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 mb-2 leading-relaxed"
                                    dangerouslySetInnerHTML={createSafeUgcMarkup(reply.content, { targetBlank: true })}
                                  />
                                    )}

                                    {!editingCommentId && (
                                      <Tooltip content={"좋아요"} position="top">
                                        <button
                                          onClick={() => handleAnswerReplyLike(answer.id, reply.id)}
                                          className={`flex items-center gap-1 text-xs ${
                                            reply.isLiked
                                              ? 'text-blue-600 dark:text-blue-400'
                                              : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                                          } transition-colors`}
                                        >
                                          <ThumbsUp className={`h-3.5 w-3.5 ${reply.isLiked ? 'fill-current' : ''}`} />
                                          <span>{reply.likes}</span>
                                        </button>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  {tPostDetail.firstAnswer || "첫 답변을 작성해보세요!"}
                </div>
              )}

              {answersInfiniteQuery.hasNextPage ? (
                <div ref={answersLoadMoreRef} className="flex justify-center py-4">
                  {answersInfiniteQuery.isFetchingNextPage ? (
                    <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">{tPost.loading || '로딩 중...'}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              {commentsInfiniteQuery.isLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                  {tPost.loading || '로딩 중...'}
                </div>
              ) : post.comments && post.comments.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-4">
                      <div className="flex gap-3 sm:gap-4">
                        <div
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => comment.author.id && router.push(`/${locale}/profile/${comment.author.id}`)}
                        >
                        <Avatar name={safeName(comment.author)} size="lg" imageUrl={comment.author.avatar} />
                        </div>
                        <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => comment.author.id && router.push(`/${locale}/profile/${comment.author.id}`)}
                            >
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                                {safeName(comment.author)}
                              </span>
                            {(() => {
                              const badge = getTrustBadgePresentation({
                                locale,
                                author: comment.author,
                                translations: tTrust,
                              });
                              if (!badge.show) return null;
                              const badgeClassName = badge.level === 'expert'
                                ? '!px-2 !py-0.5 border-amber-200'
                                : '!px-2 !py-0.5';
                              return (
                                <Tooltip content={badge.tooltip} position="top">
                                  <span className="inline-flex">
                                    <TrustBadge
                                      level={badge.level}
                                      showLabel={false}
                                      label={badge.label}
                                      className={badgeClassName}
                                    />
                                  </span>
                                </Tooltip>
                              );
                            })()}
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {formatDateTime(comment.publishedAt, locale)}
                            </span>
                          </div>
                            <div className="flex items-center gap-2">
                              {user && comment.author.id === user.id && (
                                <>
                                  {comment.id.startsWith('temp-') ? (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">{tCommon.saving || '저장 중...'}</span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleEditComment(comment.id, comment.content)}
                                        className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                      >
                                        {tCommon.edit || "수정"}
                                      </button>
                                      <span className="text-gray-300 dark:text-gray-600">|</span>
                                      <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                      >
                                        {tCommon.delete || "삭제"}
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                              {user && comment.author.id !== user.id && !comment.id.startsWith('temp-') && (
                                <button
                                  onClick={() => openReportDialog('comment', comment.id)}
                                  className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                  {tCommon.report || "신고"}
                                </button>
                              )}
                            </div>
                          </div>

                          {editingCommentId === comment.id ? (
                            <div className="mb-3">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                >
                                  취소
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSaveEdit(comment.id)}
                                  disabled={!editContent.trim()}
                                >
                                  저장
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 mb-3 leading-relaxed"
                              dangerouslySetInnerHTML={createSafeUgcMarkup(comment.content, { targetBlank: true })}
                            />
                          )}

                          {!editingCommentId && (
                            <div className="flex items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <Tooltip content={"좋아요"} position="top">
                                <button
                                  onClick={() => handleCommentLike(comment.id)}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                                    comment.isLiked
                                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  } transition-colors`}
                                >
                                  <ThumbsUp className={`h-4 w-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                                  <span>{comment.likes}</span>
                                </button>
                              </Tooltip>
                              <button
                                onClick={() => {
                                  if (!user) {
                                    openLoginPrompt();
                                    return;
                                  }
                                  setReplyTo(comment.id);
                                }}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              >
                                {tCommon.reply || "답글"}
                              </button>
                            </div>
                          )}

                          {replyTo === comment.id && (
                            <>
                              <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-4">
                                <textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder={tPostDetail.replyPlaceholder || "답글을 작성해주세요..."}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      setReplyTo(null);
                                      setReplyContent('');
                                    }}
                                  >
                                    취소
                                  </Button>
                                  <Tooltip content={guidelineTooltip} position="below">
                                    <Button type="submit" size="sm" disabled={!replyContent.trim()}>
                                      {tCommon.writeReply || "답글 작성"}
                                    </Button>
                                  </Tooltip>
                                </div>
                              </form>
                              {showReplyValidationError && replyValidationMessage ? (
                                <p className="text-sm text-red-600 dark:text-red-300 mt-2">
                                  {replyValidationMessage}
                                </p>
                              ) : null}
                            </>
                          )}

                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-4 space-y-4 pl-4 sm:pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-3 sm:gap-4">
                                  <div
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => reply.author.id && router.push(`/${locale}/profile/${reply.author.id}`)}
                                  >
                                  <Avatar name={safeName(reply.author)} size="md" imageUrl={reply.author.avatar} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => reply.author.id && router.push(`/${locale}/profile/${reply.author.id}`)}
                                        >
                                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                            {safeName(reply.author)}
                                          </span>
                                        {(() => {
                                          const badge = getTrustBadgePresentation({
                                            locale,
                                            author: reply.author,
                                            translations: tTrust,
                                          });
                                          if (!badge.show) return null;
                                          const badgeClassName = badge.level === 'expert'
                                            ? '!px-2 !py-0.5 border-amber-200'
                                            : '!px-2 !py-0.5';
                                          return (
                                            <Tooltip content={badge.tooltip} position="top">
                                              <span className="inline-flex">
                                                <TrustBadge
                                                  level={badge.level}
                                                  showLabel={false}
                                                  label={badge.label}
                                                  className={badgeClassName}
                                                />
                                              </span>
                                            </Tooltip>
                                          );
                                        })()}
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {formatDateTime(reply.publishedAt, locale)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {user && reply.author.id === user.id ? (
                                          <>
                                            {reply.id.startsWith('temp-') ? (
                                              <span className="text-xs text-gray-400 dark:text-gray-500">{tCommon.saving || '저장 중...'}</span>
                                            ) : (
                                              <>
                                                <button
                                                  onClick={() => handleEditComment(reply.id, reply.content)}
                                                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                  {tCommon.edit || "수정"}
                                                </button>
                                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                                <button
                                                  onClick={() => handleDeleteComment(reply.id, true, comment.id)}
                                                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                >
                                                  {tCommon.delete || "삭제"}
                                                </button>
                                              </>
                                            )}
                                          </>
                                        ) : (
                                          user && (
                                            <button
                                              onClick={() => openReportDialog('comment', reply.id)}
                                              className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                                            >
                                              <Flag className="w-3 h-3" />
                                              {tCommon.report || "신고"}
                                            </button>
                                          )
                                        )}
                                      </div>
                                    </div>

                                    {editingCommentId === reply.id ? (
                                      <div className="mb-2">
                                        <textarea
                                          value={editContent}
                                          onChange={(e) => setEditContent(e.target.value)}
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                          rows={2}
                                          autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                          <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                          >
                                            취소
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleSaveEdit(reply.id, true, comment.id)}
                                            disabled={!editContent.trim()}
                                          >
                                            저장
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                    className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 mb-2 leading-relaxed"
                                    dangerouslySetInnerHTML={createSafeUgcMarkup(reply.content, { targetBlank: true })}
                                  />
                                    )}

                                    {!editingCommentId && (
                                      <Tooltip content={"좋아요"} position="top">
                                        <button
                                          onClick={() => handleCommentLike(reply.id)}
                                          className={`flex items-center gap-1 text-xs ${
                                            reply.isLiked
                                              ? 'text-blue-600 dark:text-blue-400'
                                              : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                                          } transition-colors`}
                                        >
                                          <ThumbsUp className={`h-3.5 w-3.5 ${reply.isLiked ? 'fill-current' : ''}`} />
                                          <span>{reply.likes}</span>
                                        </button>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                  {tPostDetail.firstComment || "첫 댓글을 작성해보세요!"}
                </div>
              )}

              {commentsInfiniteQuery.hasNextPage ? (
                <div ref={commentsLoadMoreRef} className="flex justify-center py-4">
                  {commentsInfiniteQuery.isFetchingNextPage ? (
                    <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">{tPost.loading || '로딩 중...'}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <form onSubmit={handleSubmitComment} className="mt-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={tPostDetail.commentPlaceholder || "댓글을 작성해주세요..."}
                  readOnly={!user}
                  onFocus={() => {
                    if (!user) openLoginPrompt();
                  }}
                  onClick={() => {
                    if (!user) openLoginPrompt();
                  }}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500 resize-none ${!user ? 'opacity-70 cursor-pointer' : ''}`}
                  rows={3}
                />
                  {showCommentValidationError && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-800 dark:text-red-100">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        {commentWarnings.banned ? <p>{tPostDetail.bannedWarning || '금칙어가 포함되어 있습니다. 내용을 순화해주세요.'}</p> : null}
                        {commentWarnings.spam ? (
                          <p className="flex items-center gap-1">
                            <LinkIcon className="h-4 w-4" />
                            <span>{tPostDetail.spamWarning || '외부 링크/연락처가 감지되었습니다. 정보성 글만 허용됩니다.'}</span>
                          </p>
                        ) : null}
                        {commentValidationMessage ? <p className="text-red-600 dark:text-red-300">{commentValidationMessage}</p> : null}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end mt-3">
                    <Tooltip content={guidelineTooltip} position="top-left">
                    <Button type="submit" disabled={!newComment.trim() || showCommentValidationError} size="sm">
                        {tPostDetail.writeComment || "댓글 작성"}
                      </Button>
                    </Tooltip>
                  </div>
              </form>
            </>
          )}
        </section>
      </main>

      {shareMenuOpen && typeof document !== 'undefined'
        ? createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShareMenuOpen(false)}>
            <div
              className="w-full max-w-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{tCommon.share || '공유'}</span>
                <button
                  onClick={() => setShareMenuOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  aria-label={tCommon.close || '닫기'}
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
                <button onClick={handleShareFacebook} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  Facebook
                </button>
                <button onClick={handleShareX} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  X (Twitter)
                </button>
                <button onClick={handleShareTelegram} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  Telegram
                </button>
                <button onClick={handleCopyLink} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  {tCommon.copyLink || '링크 복사'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
        : null}

      {/* Report Dialog */}
      {showReportDialog && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={() => {
            setShowReportDialog(false);
            setReportTarget(null);
            setReportReason('');
            setSelectedReportType(null);
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 w-full sm:max-w-sm sm:rounded-xl rounded-t-xl shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {reportTarget?.type === 'post' ? (tCommon.post || '게시글') : reportTarget?.type === 'answer' ? (tCommon.reply || '답글') : (tCommon.comment || '댓글')} {tCommon.report || '신고'}
              </h3>
              <button
                onClick={() => {
                  setShowReportDialog(false);
                  setReportTarget(null);
                  setReportReason('');
                  setSelectedReportType(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-2 max-h-[60vh] overflow-y-auto">
              {[
                { type: 'spam' as ReportType, label: tCommon.reportSpam || '스팸 또는 광고', featured: true },
                { type: 'harassment' as ReportType, label: tCommon.reportHarassment || '욕설 또는 혐오 발언' },
                { type: 'misinformation' as ReportType, label: tCommon.reportMisinformation || '허위 정보' },
                { type: 'inappropriate' as ReportType, label: tCommon.reportInappropriate || '부적절한 콘텐츠' },
                { type: 'other' as ReportType, label: tCommon.reportOther || '기타' },
              ].map(({ type, label, featured }) => (
                <button
                  key={type}
                  onClick={() => setSelectedReportType(type)}
                  className={`w-full px-4 py-3 text-left rounded-lg text-sm transition-colors border ${
                    selectedReportType === type
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold border-red-200 dark:border-red-800'
                      : featured
                      ? 'bg-red-50/60 dark:bg-red-900/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800 hover:bg-red-50'
                      : 'text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}

              {selectedReportType === 'other' && (
                <div className="pt-2">
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder={tPostDetail.reportPlaceholder || "신고 사유를 입력해주세요"}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    rows={3}
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowReportDialog(false);
                  setReportTarget(null);
                  setReportReason('');
                  setSelectedReportType(null);
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={() => selectedReportType && handleReport(selectedReportType)}
                disabled={!selectedReportType || (selectedReportType === 'other' && !reportReason.trim()) || reportPostMutation.isPending || reportCommentMutation.isPending || reportAnswerMutation.isPending}
                className="flex-1 px-4 py-3 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(reportPostMutation.isPending || reportCommentMutation.isPending || reportAnswerMutation.isPending) ? (tCommon.processing || '처리중...') : (tCommon.reportSubmit || '신고하기')}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)}>
        <LoginPrompt onClose={() => setIsLoginPromptOpen(false)} variant="modal" translations={translations} />
      </Modal>
    </div>
  );
}
