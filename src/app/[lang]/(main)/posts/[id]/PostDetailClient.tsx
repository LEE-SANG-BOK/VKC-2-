'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { MessageCircle, Share2, Bookmark, Flag, Edit, Trash2, HelpCircle, CheckCircle, ThumbsUp, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Avatar from '@/components/atoms/Avatar';
import UserChip from '@/components/molecules/user/UserChip';
import UserTrustBadge from '@/components/molecules/user/UserTrustBadge';
import Button from '@/components/atoms/Button';
import Tooltip from '@/components/atoms/Tooltip';
import Modal from '@/components/atoms/Modal';
import PostCard from '@/components/molecules/cards/PostCard';
import Header from '@/components/organisms/Header';
import FollowButton from '@/components/atoms/FollowButton';
import LoginPrompt from '@/components/organisms/LoginPrompt';
import { useSession } from 'next-auth/react';
import { createSafeUgcMarkup } from '@/utils/sanitizeUgcContent';
import { formatDateTime, getJustNowLabel } from '@/utils/dateTime';
import { normalizeKey } from '@/utils/normalizeKey';
import { safeDisplayName, safeShortLabel } from '@/utils/safeText';
import { UGC_LIMITS, getPlainTextLength, validateUgcText, UgcValidationErrorCode, UgcValidationResult } from '@/lib/validation/ugc';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';
import { useTogglePostLike, useTogglePostBookmark, useDeletePost, useUpdatePost, useIncrementPostView } from '@/repo/posts/mutation';
import { useCreateAnswer, useUpdateAnswer, useDeleteAnswer, useToggleAnswerLike, useAdoptAnswer, useCreateAnswerComment } from '@/repo/answers/mutation';
import { useCreatePostComment, useUpdateComment, useDeleteComment, useToggleCommentLike } from '@/repo/comments/mutation';
import { useReportPost, useReportComment, useReportAnswer } from '@/repo/reports/mutation';
import { useHiddenTargets } from '@/repo/hides/query';
import { useUnhideTarget } from '@/repo/hides/mutation';
import { logEvent } from '@/repo/events/mutation';
import { usePosts } from '@/repo/posts/query';
import { useFollowStatus } from '@/repo/users/query';
import { useCategories } from '@/repo/categories/query';
import { ALLOWED_CATEGORY_SLUGS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';
import type { PostListItem } from '@/repo/posts/types';
import { useQuery, useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/repo/keys';
import type { ReportType } from '@/repo/reports/types';
import { ApiError, isAccountRestrictedError } from '@/lib/api/errors';
import { toast } from 'sonner';
import { buildCategoryPopularFilters, buildRelatedPostFilters } from '@/utils/postRecommendationFilters';

interface PaginatedListResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    nextCursor?: string | null;
    hasMore?: boolean;
    paginationMode?: 'offset' | 'cursor';
  };
}

const RichTextEditor = dynamic(() => import('@/components/molecules/editor/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[180px] w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" />
  ),
});

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
  isOfficial?: boolean;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
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

const UGC_ERROR_KEY_MAP: Record<'answerContent' | 'commentContent', Record<UgcValidationErrorCode, string>> = {
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
  field: 'answerContent' | 'commentContent',
  tErrors: Record<string, string>,
  fallbackMessage: string
) {
  if (result.ok) return '';
  const key = UGC_ERROR_KEY_MAP[field][result.code];
  if (key && tErrors[key]) return tErrors[key];
  return tErrors.CONTENT_PROHIBITED || fallbackMessage;
}

export default function PostDetailClient({ initialPost, locale, translations }: PostDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const { idSet: hiddenAnswerIds } = useHiddenTargets('answer', Boolean(user));
  const { idSet: hiddenCommentIds } = useHiddenTargets('comment', Boolean(user));
  const unhideTargetMutation = useUnhideTarget();
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tTooltips = (translations?.tooltips || {}) as Record<string, string>;
  const tPost = (translations?.post || {}) as Record<string, string>;
  const tPostDetail = (translations?.postDetail || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;
  const tErrors = (translations?.errors || {}) as Record<string, string>;
  const resolvedLocale = (locale === 'en' || locale === 'vi' ? locale : 'ko') as 'ko' | 'en' | 'vi';
  const likeTooltipLabel = tTooltips.like || (locale === 'vi' ? 'Thích' : locale === 'en' ? 'Like' : '좋아요');
  const copyLinkLabel = tTooltips.copyLink || (locale === 'vi' ? 'Sao chép liên kết' : locale === 'en' ? 'Copy link' : '링크 복사');
  const shareLabel = tCommon.share || (locale === 'vi' ? 'Chia sẻ' : locale === 'en' ? 'Share' : '공유');
  const bookmarkLabel = tTooltips.bookmark || (locale === 'vi' ? 'Lưu' : locale === 'en' ? 'Bookmark' : '북마크');
  const reportLabel = tCommon.report || (locale === 'vi' ? 'Báo cáo' : locale === 'en' ? 'Report' : '신고');
  const helpfulLabel = tCommon.helpful || (locale === 'vi' ? 'Hữu ích' : locale === 'en' ? 'Helpful' : '도움됨');
  const unhideLabel = tCommon.unhide || (locale === 'vi' ? 'Bỏ ẩn' : locale === 'en' ? 'Unhide' : '숨김 해제');
  const hiddenAnswerLabel = tCommon.hiddenAnswer || (locale === 'vi' ? 'Câu trả lời đã được ẩn.' : locale === 'en' ? 'This answer is hidden.' : '숨긴 답변입니다.');
  const hiddenCommentLabel = tCommon.hiddenComment || (locale === 'vi' ? 'Bình luận đã được ẩn.' : locale === 'en' ? 'This comment is hidden.' : '숨긴 댓글입니다.');
  const unhideFailedLabel = tCommon.unhideFailed || (locale === 'vi' ? 'Không thể bỏ ẩn.' : locale === 'en' ? 'Failed to unhide.' : '숨김 해제에 실패했습니다.');
  const editLabel = tCommon.edit || (locale === 'vi' ? 'Chỉnh sửa' : locale === 'en' ? 'Edit' : '수정');
  const deleteLabel = tCommon.delete || (locale === 'vi' ? 'Xóa' : locale === 'en' ? 'Delete' : '삭제');
  const adoptedLabel = tCommon.adopted || (locale === 'vi' ? 'Đã chọn' : locale === 'en' ? 'Adopted' : '채택됨');
  const savingLabel = tCommon.saving || (locale === 'vi' ? 'Đang lưu...' : locale === 'en' ? 'Saving...' : '저장 중...');
  const loadingLabel = tPost.loading || (locale === 'vi' ? 'Đang tải...' : locale === 'en' ? 'Loading...' : '로딩 중...');
  const uncategorizedLabel = tCommon.uncategorized || (locale === 'vi' ? 'Chưa phân loại' : locale === 'en' ? 'Uncategorized' : '미지정');
  const anonymousLabel = tCommon.anonymous || (locale === 'vi' ? 'Người dùng ẩn danh' : locale === 'en' ? 'Anonymous user' : '익명 사용자');
  const shareCtaTitle =
    tPostDetail.shareCtaTitle ||
    (locale === 'vi' ? 'Chia sẻ bài viết' : locale === 'en' ? 'Share this post' : '이 글을 공유해 주세요');
  const shareCtaDescription =
    tPostDetail.shareCtaDescription ||
    (locale === 'vi'
      ? 'Chia sẻ để giúp người khác tìm được thông tin.'
      : locale === 'en'
        ? 'Share it with someone who might need this.'
        : '필요한 사람에게 도움이 되도록 공유해 주세요.');

  const postDetailFallbacks = resolvedLocale === 'en'
    ? {
        contentProhibited: 'You cannot submit content containing banned or low-quality text.',
        confirmDeletePost: 'Are you sure you want to delete this post?',
        postDeleted: 'Post deleted.',
        postDeleteFailed: 'Failed to delete the post.',
        titleContentRequired: 'Please enter a title and content.',
        postUpdateFailed: 'Failed to update the post.',
        bannedWarning: 'Banned words detected. Please revise the content.',
        spamWarning: 'External links or contact info detected. Only informational posts are allowed.',
        commentCreateFailed: 'Failed to post the comment.',
        answerCreateFailed: 'Failed to post the answer.',
        replyCreateFailed: 'Failed to post the reply.',
        answerCommentCreateFailed: 'Failed to post the answer comment.',
        reportReasonRequired: 'Please enter at least 10 characters for the report reason.',
        reportSubmitted: 'Report submitted. We will review it shortly.',
        reportFailed: 'Failed to submit the report.',
        confirmDeleteComment: 'Delete this comment?',
        commentDeleteFailed: 'Failed to delete the comment.',
        commentUpdateFailed: 'Failed to update the comment.',
        confirmDeleteReply: 'Delete this reply?',
        replyDeleteFailed: 'Failed to delete the reply.',
        replyUpdateFailed: 'Failed to update the reply.',
        answerUpdateFailed: 'Failed to update the answer.',
        confirmDeleteAnswer: 'Delete this answer?',
        answerDeleteFailed: 'Failed to delete the answer.',
        onlyAuthorCanAdopt: 'Only the author can adopt an answer.',
        adoptSuccess: 'Answer adopted.',
        adoptFailed: 'Failed to adopt the answer.',
        linkCopied: 'Link copied!',
        close: 'Close',
        copyLink: 'Copy link',
        postLabel: 'Post',
        replyLabel: 'Reply',
        commentLabel: 'Comment',
        reportSpam: 'Spam or advertising',
        reportHarassment: 'Harassment or hate speech',
        reportMisinformation: 'Misinformation',
        reportInappropriate: 'Inappropriate content',
        reportOther: 'Other',
        processing: 'Processing...',
        reportSubmit: 'Report',
        helpfulToggleFailed: 'Failed to update helpful status.',
        reportPlaceholder: 'Please describe the reason for the report.',
        cancel: 'Cancel',
      }
    : resolvedLocale === 'vi'
      ? {
          contentProhibited: 'Không thể đăng nội dung có từ ngữ bị cấm hoặc chất lượng thấp.',
          confirmDeletePost: 'Bạn có chắc chắn muốn xóa bài viết này không?',
          postDeleted: 'Đã xóa bài viết.',
          postDeleteFailed: 'Không thể xóa bài viết.',
          titleContentRequired: 'Vui lòng nhập tiêu đề và nội dung.',
          postUpdateFailed: 'Không thể cập nhật bài viết.',
          bannedWarning: 'Có từ ngữ bị cấm. Vui lòng chỉnh sửa nội dung.',
          spamWarning: 'Phát hiện liên kết/địa chỉ liên hệ. Chỉ cho phép nội dung cung cấp thông tin.',
          commentCreateFailed: 'Không thể đăng bình luận.',
          answerCreateFailed: 'Không thể đăng câu trả lời.',
          replyCreateFailed: 'Không thể đăng phản hồi.',
          answerCommentCreateFailed: 'Không thể đăng bình luận cho câu trả lời.',
          reportReasonRequired: 'Vui lòng nhập ít nhất 10 ký tự cho lý do báo cáo.',
          reportSubmitted: 'Đã gửi báo cáo. Chúng tôi sẽ xem xét sớm.',
          reportFailed: 'Không thể gửi báo cáo.',
          confirmDeleteComment: 'Xóa bình luận này?',
          commentDeleteFailed: 'Không thể xóa bình luận.',
          commentUpdateFailed: 'Không thể cập nhật bình luận.',
          confirmDeleteReply: 'Xóa phản hồi này?',
          replyDeleteFailed: 'Không thể xóa phản hồi.',
        replyUpdateFailed: 'Không thể cập nhật phản hồi.',
        answerUpdateFailed: 'Không thể cập nhật câu trả lời.',
        confirmDeleteAnswer: 'Xóa câu trả lời này?',
        answerDeleteFailed: 'Không thể xóa câu trả lời.',
        onlyAuthorCanAdopt: 'Chỉ tác giả mới có thể chấp nhận câu trả lời.',
        adoptSuccess: 'Đã chấp nhận câu trả lời.',
        adoptFailed: 'Không thể chấp nhận câu trả lời.',
        linkCopied: 'Đã sao chép liên kết!',
          close: 'Đóng',
          copyLink: 'Sao chép liên kết',
          postLabel: 'Bài viết',
          replyLabel: 'Phản hồi',
          commentLabel: 'Bình luận',
          reportSpam: 'Spam hoặc quảng cáo',
          reportHarassment: 'Quấy rối hoặc ngôn từ thù ghét',
          reportMisinformation: 'Thông tin sai lệch',
          reportInappropriate: 'Nội dung không phù hợp',
          reportOther: 'Khác',
          processing: 'Đang xử lý...',
          reportSubmit: 'Báo cáo',
          helpfulToggleFailed: 'Không thể cập nhật trạng thái hữu ích.',
          reportPlaceholder: 'Vui lòng nhập lý do báo cáo.',
          cancel: 'Hủy',
        }
      : {
          contentProhibited: '금칙어/저품질 콘텐츠로 작성할 수 없습니다.',
          confirmDeletePost: '정말 이 게시글을 삭제하시겠습니까?',
          postDeleted: '게시글이 삭제되었습니다.',
          postDeleteFailed: '게시글 삭제에 실패했습니다.',
          titleContentRequired: '제목과 내용을 입력해주세요.',
          postUpdateFailed: '게시글 수정에 실패했습니다.',
          bannedWarning: '금칙어가 포함되어 있습니다. 내용을 순화해주세요.',
          spamWarning: '외부 링크/연락처가 감지되었습니다. 정보성 글만 허용됩니다.',
          commentCreateFailed: '댓글 작성에 실패했습니다.',
          answerCreateFailed: '답변 작성에 실패했습니다.',
          replyCreateFailed: '대댓글 작성에 실패했습니다.',
          answerCommentCreateFailed: '답변 댓글 작성에 실패했습니다.',
          reportReasonRequired: '신고 사유를 10자 이상 입력해주세요.',
          reportSubmitted: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
          reportFailed: '신고 처리 중 오류가 발생했습니다.',
          confirmDeleteComment: '댓글을 삭제하시겠습니까?',
          commentDeleteFailed: '댓글 삭제에 실패했습니다.',
          commentUpdateFailed: '댓글 수정에 실패했습니다.',
          confirmDeleteReply: '답글을 삭제하시겠습니까?',
          replyDeleteFailed: '답글 삭제에 실패했습니다.',
        replyUpdateFailed: '답글 수정에 실패했습니다.',
        answerUpdateFailed: '답변 수정에 실패했습니다.',
        confirmDeleteAnswer: '답변을 삭제하시겠습니까?',
        answerDeleteFailed: '답변 삭제에 실패했습니다.',
        onlyAuthorCanAdopt: '질문 작성자만 답변을 채택할 수 있습니다.',
        adoptSuccess: '채택되었습니다.',
        adoptFailed: '답변 채택에 실패했습니다.',
        linkCopied: '링크가 복사되었습니다!',
          close: '닫기',
          copyLink: '링크 복사',
          postLabel: '게시글',
          replyLabel: '답글',
          commentLabel: '댓글',
          reportSpam: '스팸 또는 광고',
          reportHarassment: '욕설 또는 혐오 발언',
          reportMisinformation: '허위 정보',
          reportInappropriate: '부적절한 콘텐츠',
          reportOther: '기타',
          processing: '처리중...',
          reportSubmit: '신고하기',
          helpfulToggleFailed: '도움됨 처리에 실패했습니다.',
          reportPlaceholder: '신고 사유를 입력해주세요',
          cancel: '취소',
        };

  const ugcProhibitedLabel = postDetailFallbacks.contentProhibited;
  const confirmDeletePostLabel = tPostDetail.confirmDeletePost || postDetailFallbacks.confirmDeletePost;
  const postDeletedLabel = tPostDetail.postDeleted || postDetailFallbacks.postDeleted;
  const postDeleteFailedLabel = tPostDetail.postDeleteFailed || postDetailFallbacks.postDeleteFailed;
  const titleContentRequiredLabel = tPostDetail.titleContentRequired || postDetailFallbacks.titleContentRequired;
  const postUpdateFailedLabel = tPostDetail.postUpdateFailed || postDetailFallbacks.postUpdateFailed;
  const bannedWarningLabel = tPostDetail.bannedWarning || postDetailFallbacks.bannedWarning;
  const spamWarningLabel = tPostDetail.spamWarning || postDetailFallbacks.spamWarning;
  const commentCreateFailedLabel = tPostDetail.commentCreateFailed || postDetailFallbacks.commentCreateFailed;
  const answerCreateFailedLabel = tPostDetail.answerCreateFailed || postDetailFallbacks.answerCreateFailed;
  const replyCreateFailedLabel = tPostDetail.replyCreateFailed || postDetailFallbacks.replyCreateFailed;
  const answerCommentCreateFailedLabel = tPostDetail.answerCommentCreateFailed || postDetailFallbacks.answerCommentCreateFailed;
  const reportReasonRequiredLabel = tPostDetail.reportReasonRequired || postDetailFallbacks.reportReasonRequired;
  const reportSubmittedLabel = tPostDetail.reportSubmitted || postDetailFallbacks.reportSubmitted;
  const reportFailedLabel = tPostDetail.reportFailed || postDetailFallbacks.reportFailed;
  const confirmDeleteCommentLabel = tPostDetail.confirmDeleteComment || postDetailFallbacks.confirmDeleteComment;
  const commentDeleteFailedLabel = tPostDetail.commentDeleteFailed || postDetailFallbacks.commentDeleteFailed;
  const commentUpdateFailedLabel = tPostDetail.commentUpdateFailed || postDetailFallbacks.commentUpdateFailed;
  const confirmDeleteReplyLabel = tPostDetail.confirmDeleteReply || postDetailFallbacks.confirmDeleteReply;
  const replyDeleteFailedLabel = tPostDetail.replyDeleteFailed || postDetailFallbacks.replyDeleteFailed;
  const replyUpdateFailedLabel = tPostDetail.replyUpdateFailed || postDetailFallbacks.replyUpdateFailed;
  const answerUpdateFailedLabel = tPostDetail.answerUpdateFailed || postDetailFallbacks.answerUpdateFailed;
  const confirmDeleteAnswerLabel = tPostDetail.confirmDeleteAnswer || postDetailFallbacks.confirmDeleteAnswer;
  const answerDeleteFailedLabel = tPostDetail.answerDeleteFailed || postDetailFallbacks.answerDeleteFailed;
  const onlyAuthorCanAdoptLabel = tPostDetail.onlyAuthorCanAdopt || postDetailFallbacks.onlyAuthorCanAdopt;
  const adoptSuccessLabel = tCommon.adopt || postDetailFallbacks.adoptSuccess;
  const adoptFailedLabel = tPostDetail.adoptFailed || postDetailFallbacks.adoptFailed;
  const linkCopiedLabel = tPostDetail.linkCopied || postDetailFallbacks.linkCopied;
  const reportTargetPostLabel = tCommon.post || postDetailFallbacks.postLabel;
  const reportTargetReplyLabel = tCommon.reply || postDetailFallbacks.replyLabel;
  const reportTargetCommentLabel = tCommon.comment || postDetailFallbacks.commentLabel;
  const reportSpamLabel = tCommon.reportSpam || postDetailFallbacks.reportSpam;
  const reportHarassmentLabel = tCommon.reportHarassment || postDetailFallbacks.reportHarassment;
  const reportMisinformationLabel = tCommon.reportMisinformation || postDetailFallbacks.reportMisinformation;
  const reportInappropriateLabel = tCommon.reportInappropriate || postDetailFallbacks.reportInappropriate;
  const reportOtherLabel = tCommon.reportOther || postDetailFallbacks.reportOther;
  const processingLabel = tCommon.processing || postDetailFallbacks.processing;
  const reportSubmitLabel = tCommon.reportSubmit || postDetailFallbacks.reportSubmit;
  const helpfulPromptLabel = tCommon.helpfulPrompt || (locale === 'vi' ? 'Đã đánh dấu hữu ích.' : locale === 'en' ? 'Marked as helpful.' : '도움됨을 눌렀습니다.');
  const helpfulCancelLabel = tCommon.helpfulCancel || (locale === 'vi' ? 'Đã hủy đánh dấu hữu ích.' : locale === 'en' ? 'Helpful mark removed.' : '도움됨을 취소했습니다.');
  const helpfulToggleFailedLabel = tPostDetail.helpfulToggleFailed || postDetailFallbacks.helpfulToggleFailed;
  const reportPlaceholderLabel = tPostDetail.reportPlaceholder || postDetailFallbacks.reportPlaceholder;
  const cancelLabel = tCommon.cancel || postDetailFallbacks.cancel;

  const postDetailUiFallbacks = resolvedLocale === 'en'
    ? {
        editTitle: 'Title',
        editContent: 'Content',
        editPlaceholder: 'Enter the content...',
        save: 'Save',
        question: 'Question',
        adoptCompleted: 'Adopted',
        notAdopted: 'Not adopted',
        editAnswerPlaceholder: 'Edit your answer...',
        reply: 'Reply',
        adopt: 'Adopt',
        replyPlaceholder: 'Write a reply...',
        writeReply: 'Write reply',
        firstAnswer: 'Be the first to answer!',
        firstComment: 'Be the first to comment!',
        commentPlaceholder: 'Write a comment...',
        writeComment: 'Write comment',
      }
    : resolvedLocale === 'vi'
      ? {
          editTitle: 'Tiêu đề',
          editContent: 'Nội dung',
          editPlaceholder: 'Nhập nội dung...',
          save: 'Lưu',
          question: 'Câu hỏi',
          adoptCompleted: 'Đã chọn',
          notAdopted: 'Chưa chọn',
          editAnswerPlaceholder: 'Chỉnh sửa câu trả lời...',
          reply: 'Phản hồi',
          adopt: 'Chấp nhận',
          replyPlaceholder: 'Viết phản hồi...',
          writeReply: 'Viết phản hồi',
          firstAnswer: 'Hãy là người đầu tiên trả lời!',
          firstComment: 'Hãy là người đầu tiên bình luận!',
          commentPlaceholder: 'Viết bình luận...',
          writeComment: 'Viết bình luận',
        }
      : {
          editTitle: '제목',
          editContent: '내용',
          editPlaceholder: '내용을 입력하세요...',
          save: '저장',
          question: '질문',
          adoptCompleted: '채택완료',
          notAdopted: '미채택',
          editAnswerPlaceholder: '답변을 수정해주세요...',
          reply: '답글',
          adopt: '채택하기',
          replyPlaceholder: '답글을 작성해주세요...',
          writeReply: '답글 작성',
          firstAnswer: '첫 답변을 작성해보세요!',
          firstComment: '첫 댓글을 작성해보세요!',
          commentPlaceholder: '댓글을 작성해주세요...',
          writeComment: '댓글 작성',
        };

  const editTitleLabel = tPostDetail.editTitle || postDetailUiFallbacks.editTitle;
  const editContentLabel = tPostDetail.editContent || postDetailUiFallbacks.editContent;
  const editPlaceholderLabel = tPostDetail.editPlaceholder || postDetailUiFallbacks.editPlaceholder;
  const saveLabel = tCommon.save || postDetailUiFallbacks.save;
  const questionLabel = tCommon.question || postDetailUiFallbacks.question;
  const adoptCompletedLabel = tPostDetail.adoptCompleted || postDetailUiFallbacks.adoptCompleted;
  const notAdoptedLabel = tPostDetail.notAdopted || postDetailUiFallbacks.notAdopted;
  const editAnswerPlaceholderLabel = tPostDetail.editAnswerPlaceholder || postDetailUiFallbacks.editAnswerPlaceholder;
  const replyLabel = tCommon.reply || postDetailUiFallbacks.reply;
  const adoptLabel = tCommon.adopt || postDetailUiFallbacks.adopt;
  const replyPlaceholderLabel = tPostDetail.replyPlaceholder || postDetailUiFallbacks.replyPlaceholder;
  const writeReplyLabel = tCommon.writeReply || tPostDetail.writeReply || postDetailUiFallbacks.writeReply;
  const firstAnswerLabel = tPostDetail.firstAnswer || postDetailUiFallbacks.firstAnswer;
  const firstCommentLabel = tPostDetail.firstComment || postDetailUiFallbacks.firstComment;
  const commentPlaceholderLabel = tPostDetail.commentPlaceholder || postDetailUiFallbacks.commentPlaceholder;
  const writeCommentLabel = tPostDetail.writeComment || postDetailUiFallbacks.writeComment;

  const guidelineTooltip =
    tCommon.guidelineTooltip ||
    (locale === 'vi'
      ? 'Không dùng ngôn từ thù ghét/xúc phạm, hạn chế quảng cáo/liên hệ. Vi phạm có thể bị hạn chế đăng hoặc khóa tài khoản.'
      : locale === 'en'
        ? 'No hate/abuse, no ads or contact info. Violations may restrict posts or accounts.'
        : '예의·혐오 표현 금지, 광고/연락처 제한, 위반 시 게시 제한 또는 계정 제재가 있을 수 있습니다.');
  const justNowLabel = getJustNowLabel(locale);
  const safeName = (author?: { name?: string }) => safeDisplayName(author?.name, anonymousLabel);
  const safeLabel = (raw?: string) => safeShortLabel(raw);
  const tRules = (translations?.newPost || {}) as Record<string, string>;
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const openLoginPrompt = () => setIsLoginPromptOpen(true);
  const handleUnhide = async (targetType: 'answer' | 'comment', targetId: string) => {
    if (!user) {
      openLoginPrompt();
      return;
    }

    try {
      await unhideTargetMutation.mutateAsync({ targetType, targetId });
    } catch (error) {
      console.error('Failed to unhide target:', error);
      toast.error(unhideFailedLabel);
    }
  };

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

  type InfinitePageParam = { page: number; cursor?: string | null };
  type AnswersInfiniteKey = ReturnType<typeof queryKeys.answers.infinite>;
  type CommentsInfiniteKey = ReturnType<typeof queryKeys.comments.infinite>;

  const answersInfiniteQuery = useInfiniteQuery<
    PaginatedListResponse<Answer>,
    Error,
    InfiniteData<PaginatedListResponse<Answer>, InfinitePageParam>,
    AnswersInfiniteKey,
    InfinitePageParam
  >({
    initialPageParam: { page: 1, cursor: null },
    queryKey: queryKeys.answers.infinite(initialPost.id),
    queryFn: ({ pageParam = { page: 1, cursor: null } }) => {
      const cursor = pageParam.cursor;
      const query = new URLSearchParams();
      query.set('page', String(pageParam.page));
      query.set('limit', '10');
      if (cursor) query.set('cursor', cursor);
      return fetch(`/api/posts/${initialPost.id}/answers?${query.toString()}`, { credentials: 'include' }).then((r) =>
        r.json()
      );
    },
    getNextPageParam: (lastPage) => {
      const nextCursor = lastPage.meta?.nextCursor;
      if (nextCursor) {
        return { page: lastPage.pagination.page + 1, cursor: nextCursor };
      }
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? { page: page + 1, cursor: null } : undefined;
    },
    enabled: Boolean(initialPost.id && post.isQuestion),
  });

  const commentsInfiniteQuery = useInfiniteQuery<
    PaginatedListResponse<Comment>,
    Error,
    InfiniteData<PaginatedListResponse<Comment>, InfinitePageParam>,
    CommentsInfiniteKey,
    InfinitePageParam
  >({
    initialPageParam: { page: 1, cursor: null },
    queryKey: queryKeys.comments.infinite(initialPost.id),
    queryFn: ({ pageParam = { page: 1, cursor: null } }) => {
      const cursor = pageParam.cursor;
      const query = new URLSearchParams();
      query.set('page', String(pageParam.page));
      query.set('limit', '20');
      if (cursor) query.set('cursor', cursor);
      return fetch(`/api/posts/${initialPost.id}/comments?${query.toString()}`, { credentials: 'include' }).then((r) =>
        r.json()
      );
    },
    getNextPageParam: (lastPage) => {
      const nextCursor = lastPage.meta?.nextCursor;
      if (nextCursor) {
        return { page: lastPage.pagination.page + 1, cursor: nextCursor };
      }
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? { page: page + 1, cursor: null } : undefined;
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
  const postType = post.isQuestion ? 'question' : 'share';
  const relatedFilters = useMemo(
    () =>
      buildRelatedPostFilters({
        title: post.title,
        tags: post.tags,
        category: post.category,
        type: postType,
        limit: 6,
      }),
    [post.category, post.tags, post.title, postType]
  );
  const categoryFilters = useMemo(
    () =>
      buildCategoryPopularFilters({
        category: post.category,
        type: postType,
        limit: 6,
      }),
    [post.category, postType]
  );

  const relatedPostsQuery = usePosts(relatedFilters || {}, {
    enabled: Boolean(relatedFilters),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const categoryPopularQuery = usePosts(categoryFilters || {}, {
    enabled: Boolean(categoryFilters),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const relatedPosts = useMemo(() => {
    const list = relatedPostsQuery.data?.data || [];
    const seen = new Set<string>();
    return list
      .filter((item) => String(item.id) !== String(post.id))
      .filter((item) => {
        const id = String(item.id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, 4);
  }, [post.id, relatedPostsQuery.data?.data]);

  const categoryPopularPosts = useMemo(() => {
    const list = categoryPopularQuery.data?.data || [];
    const seen = new Set<string>(relatedPosts.map((item) => String(item.id)));
    return list
      .filter((item) => String(item.id) !== String(post.id))
      .filter((item) => {
        const id = String(item.id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, 4);
  }, [categoryPopularQuery.data?.data, post.id, relatedPosts]);
  const relatedMinCount = 2;
  const showRelatedSection = Boolean(relatedFilters) && (relatedPostsQuery.isLoading || relatedPosts.length >= relatedMinCount);
  const showCategorySection = Boolean(categoryFilters) && !showRelatedSection;
  const showRecommendations = showRelatedSection || showCategorySection;

  const trustBadgePresentation = getTrustBadgePresentation({
    locale,
    trustBadge: post.trustBadge,
    author: post.author,
    translations: tTrust,
  });

  const trustBadgeGuideHref = `/${locale}/guide/trust-badges`;
  const learnMoreLabel = tCommon.learnMore || (locale === 'vi' ? 'Xem thêm' : locale === 'en' ? 'Learn more' : '자세히');
  const relatedTitleLabel = tPostDetail.relatedPostsTitle || (locale === 'vi' ? 'Bài viết liên quan' : locale === 'en' ? 'Related posts' : '관련 글');
  const categoryPopularTitleLabel = tPostDetail.categoryPopularTitle || (locale === 'vi' ? 'Bài viết phổ biến trong danh mục' : locale === 'en' ? 'Popular in this category' : '같은 카테고리 인기글');
  const relatedEmptyLabel = tPostDetail.relatedPostsEmpty || (locale === 'vi' ? 'Chưa có bài viết liên quan.' : locale === 'en' ? 'No related posts yet.' : '관련 글이 아직 없습니다.');
  const categoryPopularEmptyLabel = tPostDetail.categoryPopularEmpty || (locale === 'vi' ? 'Chưa có bài viết phổ biến trong danh mục này.' : locale === 'en' ? 'No popular posts in this category yet.' : '이 카테고리의 인기글이 아직 없습니다.');
  const mapPostToCardProps = (item: PostListItem) => ({
    id: item.id,
    author: {
      id: item.author?.id,
      name: item.author?.displayName || item.author?.name || anonymousLabel,
      avatar: item.author?.image || item.author?.avatar || '/default-avatar.jpg',
      followers: 0,
      isFollowing: item.author?.isFollowing ?? false,
      isVerified: item.author?.isVerified || false,
      isExpert: item.author?.isExpert || false,
      badgeType: item.author?.badgeType || null,
    },
    title: item.title,
    excerpt:
      item.excerpt ||
      (item.content || '')
        .replace(/<img[^>]*>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim()
        .substring(0, 200),
    tags: item.tags || [],
    stats: {
      likes: item.likesCount ?? item.likes ?? 0,
      comments:
        item.type === 'question'
          ? (item.answersCount ?? item.commentsCount ?? 0)
          : (item.commentsCount ?? 0),
      shares: 0,
    },
    category: item.category,
    subcategory: item.subcategory || undefined,
    thumbnail: item.thumbnail,
    thumbnails: item.thumbnails,
    publishedAt: formatDateTime(item.createdAt, locale),
    isQuestion: item.type === 'question',
    isAdopted: item.isResolved,
    isLiked: item.isLiked,
    isBookmarked: item.isBookmarked,
    imageCount: item.imageCount,
    certifiedResponderCount: item.certifiedResponderCount,
    otherResponderCount: item.otherResponderCount,
    trustBadge: item.trustBadge,
    trustWeight: item.trustWeight,
    translations: translations || {},
  });
  const resizeTextarea = useCallback((target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  }, []);

  const scrollComposerIntoView = useCallback((element: HTMLElement) => {
    element.style.scrollMarginBottom = 'calc(var(--vk-bottom-safe-offset, 72px) + env(safe-area-inset-bottom, 0px) + 24px)';
    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const handleTextareaInput = useCallback((event: React.FormEvent<HTMLTextAreaElement>) => {
    resizeTextarea(event.currentTarget);
  }, [resizeTextarea]);

  const handleTextareaFocus = useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
    resizeTextarea(event.currentTarget);
    scrollComposerIntoView(event.currentTarget);
  }, [resizeTextarea, scrollComposerIntoView]);

  const handleEditorFocus = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    scrollComposerIntoView(event.currentTarget);
  }, [scrollComposerIntoView]);

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
      logEvent({
        eventType: 'view',
        entityType: 'post',
        entityId: initialPost.id,
        locale,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      });
    }
  }, [initialPost.id, incrementView, locale]);
  
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
  const commentValidationMessage = commentValidation.ok
    ? ''
    : getUgcErrorMessage(commentValidation, 'commentContent', tErrors, ugcProhibitedLabel);
  const replyValidationMessage = replyValidation.ok
    ? ''
    : getUgcErrorMessage(replyValidation, 'commentContent', tErrors, ugcProhibitedLabel);
  const answerValidationMessage = answerValidation.ok
    ? ''
    : getUgcErrorMessage(answerValidation, 'answerContent', tErrors, ugcProhibitedLabel);
  const answerReplyValidationMessage = answerReplyValidation.ok
    ? ''
    : getUgcErrorMessage(answerReplyValidation, 'commentContent', tErrors, ugcProhibitedLabel);
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
  const shareCtaRef = useRef<HTMLDivElement | null>(null);
  const answersLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const commentsLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const answersHashHandledRef = useRef(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerContent, setEditAnswerContent] = useState('');
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
    const base = [categoryLabel || uncategorizedLabel, subcategoryLabel]
      .map((v) => v?.trim())
      .filter(Boolean) as string[];
    const seen = new Set<string>();
    return base.filter((value) => {
      const key = normalizeKey(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categoryLabel, subcategoryLabel, uncategorizedLabel]);

  const tagChips = useMemo(() => uniqueTags.slice(0, 3), [uniqueTags]);
  const displayChips = useMemo(() => [...categoryChips, ...tagChips], [categoryChips, tagChips]);
  const sortedAnswers = useMemo(() => {
    if (!post?.answers) return [];
    const byDate = (value: string) => Date.parse(value) || 0;
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
    if (!confirm(confirmDeletePostLabel)) return;

    try {
      await deletePostMutation.mutateAsync(post.id);
      toast.success(postDeletedLabel);
      router.push(`/${locale}`);
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error(resolveErrorMessage(error, postDeleteFailedLabel));
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
      toast.error(titleContentRequiredLabel);
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
      toast.error(resolveErrorMessage(error, postUpdateFailedLabel));
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
      toast.error(commentWarnings.banned ? bannedWarningLabel : spamWarningLabel);
      return;
    }
    if (!commentValidation.ok) {
      toast.error(getUgcErrorMessage(commentValidation, 'commentContent', tErrors, ugcProhibitedLabel));
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
        name: user.name || anonymousLabel,
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
            name: result.data.author?.displayName || result.data.author?.name || user.name || anonymousLabel,
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
      toast.error(resolveErrorMessage(error, commentCreateFailedLabel));
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
      toast.error(answerWarnings.banned ? bannedWarningLabel : spamWarningLabel);
      return;
    }
    if (!answerValidation.ok) {
      toast.error(getUgcErrorMessage(answerValidation, 'answerContent', tErrors, ugcProhibitedLabel));
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const isOfficialAnswer = Boolean((user as any).isExpert || (user as any).isAdmin);
    const optimisticAnswer: Answer = {
      id: tempId,
      author: {
        id: user.id,
        name: user.name || anonymousLabel,
        avatar: user.image || '/avatar-default.jpg',
        isVerified: !!(user as any).isVerified,
        isExpert: !!(user as any).isExpert,
      },
      content: newAnswer.trim(),
      publishedAt: justNowLabel,
      helpful: 0,
      isHelpful: false,
      isAdopted: false,
      isOfficial: isOfficialAnswer,
      reviewStatus: isOfficialAnswer ? 'approved' : 'pending',
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
            name: result.data.author?.displayName || result.data.author?.name || user.name || anonymousLabel,
            avatar: result.data.author?.image || user.image || '/avatar-default.jpg',
            isVerified: result.data.author?.isVerified,
            isExpert: result.data.author?.isExpert,
          },
          content: result.data.content,
          publishedAt: justNowLabel,
          helpful: 0,
          isHelpful: false,
          isAdopted: false,
          isOfficial: result.data.isOfficial || false,
          reviewStatus: result.data.reviewStatus,
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
      toast.error(resolveErrorMessage(error, answerCreateFailedLabel));
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
      toast.success(newIsHelpful ? helpfulPromptLabel : helpfulCancelLabel);
    } catch (error) {
      setPost(prevPost);
      console.error('Failed to toggle helpful:', error);
      toast.error(helpfulToggleFailedLabel);
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
      toast.error(resolveErrorMessage(error, answerUpdateFailedLabel));
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!confirm(confirmDeleteAnswerLabel)) return;

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
      toast.error(resolveErrorMessage(error, answerDeleteFailedLabel));
    }
  };

  const handleAdoptAnswer = async (answerId: string) => {
    if (!post || !post.answers) return;
    if (!isUserPost) {
      toast.error(onlyAuthorCanAdoptLabel);
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
      toast.success(adoptSuccessLabel);
    } catch (error) {
      setPost(prevPost);
      console.error('Failed to adopt answer:', error);
      toast.error(adoptFailedLabel);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (replyWarnings.banned || replyWarnings.spam) {
      toast.error(replyWarnings.banned ? bannedWarningLabel : spamWarningLabel);
      return;
    }
    if (!replyValidation.ok) {
      toast.error(getUgcErrorMessage(replyValidation, 'commentContent', tErrors, ugcProhibitedLabel));
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
        name: user.name || anonymousLabel,
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
            name: result.data.author?.displayName || result.data.author?.name || user.name || anonymousLabel,
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
      toast.error(resolveErrorMessage(error, replyCreateFailedLabel));
    }
  };

  const handleShare = () => {
    if (!shareCtaRef.current) return;
    shareCtaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    shareCtaRef.current.focus({ preventScroll: true });
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
      toast.error(reportReasonRequiredLabel);
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
      toast.success(reportSubmittedLabel);
      setShowReportDialog(false);
      setReportTarget(null);
      setReportReason('');
      setSelectedReportType(null);
    } catch (error) {
      toast.error(resolveErrorMessage(error, reportFailedLabel));
    }
  };

  const handleDeleteComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!confirm(confirmDeleteCommentLabel)) return;

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
      toast.error(resolveErrorMessage(error, commentDeleteFailedLabel));
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
      toast.error(resolveErrorMessage(error, commentUpdateFailedLabel));
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
      toast.error(answerReplyWarnings.banned ? bannedWarningLabel : spamWarningLabel);
      return;
    }
    if (!answerReplyValidation.ok) {
      toast.error(getUgcErrorMessage(answerReplyValidation, 'commentContent', tErrors, ugcProhibitedLabel));
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticReply: AnswerReply = {
      id: tempId,
      author: {
        id: user.id,
        name: user.name || anonymousLabel,
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
            name: result.data.author?.displayName || result.data.author?.name || user.name || anonymousLabel,
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
      toast.error(resolveErrorMessage(error, answerCommentCreateFailedLabel));
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
    if (!confirm(confirmDeleteReplyLabel)) return;

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
      toast.error(resolveErrorMessage(error, replyDeleteFailedLabel));
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
      toast.error(resolveErrorMessage(error, replyUpdateFailedLabel));
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
    logEvent({
      eventType: 'share',
      entityType: 'post',
      entityId: initialPost.id,
      locale,
      metadata: { channel: 'facebook' },
    });
  };

  const handleShareX = () => {
    if (!shareUrl) return;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`, '_blank', 'width=600,height=600');
    logEvent({
      eventType: 'share',
      entityType: 'post',
      entityId: initialPost.id,
      locale,
      metadata: { channel: 'x' },
    });
  };

  const handleShareTelegram = () => {
    if (!shareUrl) return;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`, '_blank', 'width=600,height=600');
    logEvent({
      eventType: 'share',
      entityType: 'post',
      entityId: initialPost.id,
      locale,
      metadata: { channel: 'telegram' },
    });
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(linkCopiedLabel);
      logEvent({
        eventType: 'share',
        entityType: 'post',
        entityId: initialPost.id,
        locale,
        metadata: { channel: 'copy' },
      });
    } catch (error) {
      console.error('Failed to copy link', error);
    } finally {
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
                <Tooltip content={editLabel}>
                  <button
                    onClick={handleEditPost}
                    className="p-1.5 sm:p-2 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </Tooltip>
                <Tooltip content={deleteLabel}>
                  <button
                    onClick={handleDeletePost}
                    className="p-1.5 sm:p-2 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </Tooltip>
              </>
            )}
          </>
        }
      />

      {/* Main Content */}
          <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Article */}
        <article className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4 sm:mb-6">
          <div className="p-4 sm:p-6 md:p-8">
            {/* Edit Mode */}
            {isEditingPost ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {editTitleLabel}
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
                    {editContentLabel}
                  </label>
                    <RichTextEditor
                      content={editPostContent}
                      onChange={setEditPostContent}
                      placeholder={editPlaceholderLabel}
                      translations={translations || {}}
                      tooltipPosition="below"
                      onFocus={handleEditorFocus}
                      locale={resolvedLocale}
                    />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" size="sm" onClick={handleCancelEditPost}>
                    {cancelLabel}
                  </Button>
                  <Button size="sm" onClick={handleSaveEditPost}>
                    {saveLabel}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 flex-wrap">
                  <span className="text-gray-500 dark:text-gray-400">{formatDateTime(post.publishedAt, locale)}</span>
                  {post.isQuestion ? (
                    <>
                      <span className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] sm:text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-700 whitespace-nowrap">
                        <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {questionLabel}
                      </span>
                      {post.isAdopted ? (
                        <span className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[11px] sm:text-xs font-semibold rounded-full border border-green-200 dark:border-green-700 whitespace-nowrap">
                          <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {adoptCompletedLabel}
                        </span>
                      ) : (
                        <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-700 whitespace-nowrap">
                          {notAdoptedLabel}
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
	              <div className="flex items-center gap-2 min-w-0">
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
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => post.author?.id && router.push(`/${locale}/profile/${post.author.id}`)}
                >
                  <span className="block truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                    {safeName(post.author)}
                  </span>
                </button>

                <UserTrustBadge
                  presentation={trustBadgePresentation}
                  learnMoreLabel={learnMoreLabel}
                  onClick={() => router.push(trustBadgeGuideHref)}
                  labelVariant="text"
                  badgeClassName="!px-1.5 !py-0.5"
                />

                {!isUserPost && post.author?.id ? (
                  <FollowButton
                    userId={post.author.id}
                    userName={safeName(post.author)}
                    isFollowing={post.author.isFollowing}
                    size="xs"
                    className="shrink-0"
                    onToggle={handleFollowChange}
                    translations={translations}
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

            {!isEditingPost && displayChips.length > 0 ? (
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {displayChips.map((tag) => (
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
	            <Tooltip content={likeTooltipLabel} position="top">
              <button
                onClick={handleLike}
                aria-label={likeTooltipLabel}
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

            <Tooltip content={shareLabel} position="top">
              <button
                onClick={handleShare}
                aria-label={shareLabel}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </Tooltip>

	            <Tooltip content={bookmarkLabel} position="top">
	              <button
	                onClick={handleBookmark}
                aria-label={bookmarkLabel}
	                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all ${
	                  post.isBookmarked
	                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
	                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
	                }`}
	              >
	                <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
	              </button>
	            </Tooltip>

            <Tooltip content={reportLabel} position="top">
              <button
                onClick={() => openReportDialog('post', post.id)}
                aria-label={reportLabel}
                className="ml-auto inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                <Flag className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </Tooltip>
          </div>
            )}
            {!isEditingPost && (
              <div
                ref={shareCtaRef}
                tabIndex={-1}
                className="mt-4 sm:mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{shareCtaTitle}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{shareCtaDescription}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleShareFacebook}
                      className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={handleShareX}
                      className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      X
                    </button>
                    <button
                      type="button"
                      onClick={handleShareTelegram}
                      className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Telegram
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {copyLinkLabel}
                    </button>
                  </div>
                </div>
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
                  ? loadingLabel
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
                      onFocus={handleEditorFocus}
                      locale={resolvedLocale}
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
                      {answerWarnings.banned ? <p>{bannedWarningLabel}</p> : null}
                      {answerWarnings.spam ? (
                        <p className="flex items-center gap-1">
                          <LinkIcon className="h-4 w-4" />
                          <span>{spamWarningLabel}</span>
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
                  {loadingLabel}
                </div>
              ) : sortedAnswers.length > 0 ? (
                <div className="space-y-6">
                  {sortedAnswers.map((answer, index) => {
                    if (hiddenAnswerIds.has(answer.id)) {
                      return (
                        <div
                          key={answer.id}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 sm:p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{hiddenAnswerLabel}</span>
                            <button
                              type="button"
                              onClick={() => handleUnhide('answer', answer.id)}
                              className="rounded-full px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              {unhideLabel}
                            </button>
                          </div>
                        </div>
                      );
                    }
                    const answerBadge = getTrustBadgePresentation({
                      locale,
                      author: answer.author,
                      translations: tTrust,
                    });
                    const badgeClassName = answerBadge.level === 'expert'
                      ? '!px-1.5 !py-0.5 border-amber-200'
                      : '!px-1.5 !py-0.5';
                    return (
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
                                  size="md"
                                  trustBadgePresentation={answerBadge}
                                  learnMoreLabel={learnMoreLabel}
                                  onBadgeClick={() => router.push(trustBadgeGuideHref)}
                                  badgeLabelVariant="text"
                                  badgeClassName={badgeClassName}
                                />
                              </div>
                              <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {formatDateTime(answer.publishedAt, locale)}
                                </span>
                                {answer.isAdopted && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full border border-green-200 dark:border-green-700 whitespace-nowrap">
                                    <CheckCircle className="w-3 h-3" />
                                    {adoptedLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {user && answer.author.id === user.id && !answer.isAdopted && (
                                <>
                                  {answer.id.startsWith('temp-') ? (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{savingLabel}</span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleEditAnswer(answer.id, answer.content)}
                                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
                                      >
                                        {editLabel}
                                      </button>
                                      <span className="text-gray-300 dark:text-gray-600">|</span>
                                      <button
                                        onClick={() => handleDeleteAnswer(answer.id)}
                                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap"
                                      >
                                        {deleteLabel}
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
									  {reportLabel}
                                </button>
                              )}
                            </div>
                          </div>

                          {editingAnswerId === answer.id ? (
                            <div className="mb-4">
                              <RichTextEditor
                                content={editAnswerContent}
                                onChange={setEditAnswerContent}
                                placeholder={editAnswerPlaceholderLabel}
                                translations={translations || {}}
                                tooltipPosition="below"
                                onFocus={handleEditorFocus}
                                locale={resolvedLocale}
                              />
                              <div className="flex justify-end gap-2 mt-3">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={handleCancelEditAnswer}
                                >
                                  {cancelLabel}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSaveAnswerEdit(answer.id)}
                                  disabled={!editAnswerContent.trim()}
                                >
                                  {saveLabel}
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
	              <Tooltip content={helpfulLabel} position="top">
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
	                  <span className="text-sm font-medium">{helpfulLabel} {answer.helpful}</span>
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
                              {replyLabel}
                            </button>

                            {!answer.isAdopted && isUserPost && !post.isAdopted && (
                              <div className="ml-auto">
                                <Button
                                  onClick={() => handleAdoptAnswer(answer.id)}
                                  variant="primary"
                                  size="sm"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  {adoptLabel}
                                </Button>
                              </div>
                            )}
                          </div>

                          {replyToAnswer === answer.id && (
                            <form onSubmit={(e) => handleSubmitAnswerReply(e, answer.id)} className="mt-4">
                              <textarea
                                value={answerReplyContent}
                                onChange={(e) => setAnswerReplyContent(e.target.value)}
                                onInput={handleTextareaInput}
                                onFocus={handleTextareaFocus}
                                placeholder={replyPlaceholderLabel}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none overflow-hidden"
                                rows={2}
                                autoFocus
                              />
                              {showAnswerReplyValidationError && (
                                <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-3 text-xs sm:text-sm text-red-800 dark:text-red-100">
                                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <div className="space-y-1">
                                    {answerReplyWarnings.banned ? <p>{bannedWarningLabel}</p> : null}
                                    {answerReplyWarnings.spam ? (
                                      <p className="flex items-center gap-1">
                                        <LinkIcon className="h-4 w-4" />
                                        <span>{spamWarningLabel}</span>
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
                                    {cancelLabel}
                                  </Button>
                                  <Tooltip content={guidelineTooltip} position="below">
                                    <Button type="submit" size="sm" disabled={!answerReplyContent.trim() || showAnswerReplyValidationError}>
                                    {writeReplyLabel}
                                    </Button>
                                  </Tooltip>
                                </div>
                              </form>
                          )}

                          {answer.replies && answer.replies.length > 0 && (
                            <div className="mt-4 space-y-4 pl-4 sm:pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                              {answer.replies.map((reply) => {
                                if (hiddenCommentIds.has(reply.id)) {
                                  return (
                                    <div
                                      key={reply.id}
                                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3"
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{hiddenCommentLabel}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleUnhide('comment', reply.id)}
                                          className="rounded-full px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                          {unhideLabel}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                                const replyBadge = getTrustBadgePresentation({
                                  locale,
                                  author: reply.author,
                                  translations: tTrust,
                                });
                                const replyBadgeClassName = replyBadge.level === 'expert'
                                  ? '!px-1.5 !py-0.5 border-amber-200'
                                  : '!px-1.5 !py-0.5';

                                return (
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
                                            <UserTrustBadge
                                              presentation={replyBadge}
                                              learnMoreLabel={learnMoreLabel}
                                              onClick={() => router.push(trustBadgeGuideHref)}
                                              labelVariant="text"
                                              badgeClassName={replyBadgeClassName}
                                            />
                                          </div>
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDateTime(reply.publishedAt, locale)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {user && reply.author.id === user.id ? (
                                            <>
                                              {reply.id.startsWith('temp-') ? (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                  {savingLabel}
                                                </span>
                                              ) : (
                                                <>
                                                  <button
                                                    onClick={() => handleEditAnswerReply(reply.id, reply.content)}
                                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                  >
                                                    {editLabel}
                                                  </button>
                                                  <span className="text-gray-300 dark:text-gray-600">|</span>
                                                  <button
                                                    onClick={() => handleDeleteAnswerReply(answer.id, reply.id)}
                                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                  >
                                                    {deleteLabel}
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
                                                {reportLabel}
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
                                            onInput={handleTextareaInput}
                                            onFocus={handleTextareaFocus}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none overflow-hidden"
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
                                              {cancelLabel}
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => handleSaveAnswerReplyEdit(answer.id, reply.id)}
                                              disabled={!editContent.trim()}
                                            >
                                              {saveLabel}
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
                                        <Tooltip content={likeTooltipLabel} position="top">
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
                                );
                              })}
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  {firstAnswerLabel}
                </div>
              )}

              {answersInfiniteQuery.hasNextPage ? (
                <div ref={answersLoadMoreRef} className="flex justify-center py-4">
                  {answersInfiniteQuery.isFetchingNextPage ? (
                    <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">{loadingLabel}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              {commentsInfiniteQuery.isLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                  {loadingLabel}
                </div>
              ) : post.comments && post.comments.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {post.comments.map((comment) => {
                    if (hiddenCommentIds.has(comment.id)) {
                      return (
                        <div
                          key={comment.id}
                          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 sm:p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{hiddenCommentLabel}</span>
                            <button
                              type="button"
                              onClick={() => handleUnhide('comment', comment.id)}
                              className="rounded-full px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              {unhideLabel}
                            </button>
                          </div>
                        </div>
                      );
                    }
                    const commentBadge = getTrustBadgePresentation({
                      locale,
                      author: comment.author,
                      translations: tTrust,
                    });
                    const commentBadgeClassName = commentBadge.level === 'expert'
                      ? '!px-1.5 !py-0.5 border-amber-200'
                      : '!px-1.5 !py-0.5';
                    return (
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
                              <UserTrustBadge
                                presentation={commentBadge}
                                learnMoreLabel={learnMoreLabel}
                                onClick={() => router.push(trustBadgeGuideHref)}
                                labelVariant="text"
                                badgeClassName={commentBadgeClassName}
                              />
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {formatDateTime(comment.publishedAt, locale)}
                            </span>
                          </div>
                            <div className="flex items-center gap-2">
                              {user && comment.author.id === user.id && (
                                <>
                                  {comment.id.startsWith('temp-') ? (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">{savingLabel}</span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleEditComment(comment.id, comment.content)}
                                        className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                      >
                                        {editLabel}
                                      </button>
                                      <span className="text-gray-300 dark:text-gray-600">|</span>
                                      <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                      >
                                        {deleteLabel}
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
	                              {reportLabel}
                                </button>
                              )}
                            </div>
                          </div>

                          {editingCommentId === comment.id ? (
                            <div className="mb-3">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onInput={handleTextareaInput}
                                onFocus={handleTextareaFocus}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500 resize-none overflow-hidden"
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
                                  {cancelLabel}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSaveEdit(comment.id)}
                                  disabled={!editContent.trim()}
                                >
                                  {saveLabel}
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
	                                <Tooltip content={likeTooltipLabel} position="top">
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
                                {replyLabel}
                              </button>
                            </div>
                          )}

                          {replyTo === comment.id && (
                            <>
                              <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-4">
                                <textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  onInput={handleTextareaInput}
                                  onFocus={handleTextareaFocus}
                                  placeholder={replyPlaceholderLabel}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500 resize-none overflow-hidden"
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
                                    {cancelLabel}
                                  </Button>
                                  <Tooltip content={guidelineTooltip} position="below">
                                    <Button type="submit" size="sm" disabled={!replyContent.trim()}>
                                      {writeReplyLabel}
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
                              {comment.replies.map((reply) => {
                                if (hiddenCommentIds.has(reply.id)) {
                                  return (
                                    <div
                                      key={reply.id}
                                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3"
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{hiddenCommentLabel}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleUnhide('comment', reply.id)}
                                          className="rounded-full px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                          {unhideLabel}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                                const replyBadge = getTrustBadgePresentation({
                                  locale,
                                  author: reply.author,
                                  translations: tTrust,
                                });
                                const replyBadgeClassName = replyBadge.level === 'expert'
                                  ? '!px-1.5 !py-0.5 border-amber-200'
                                  : '!px-1.5 !py-0.5';
                                return (
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
                                          <UserTrustBadge
                                            presentation={replyBadge}
                                            learnMoreLabel={learnMoreLabel}
                                            onClick={() => router.push(trustBadgeGuideHref)}
                                            labelVariant="text"
                                            badgeClassName={replyBadgeClassName}
                                          />
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {formatDateTime(reply.publishedAt, locale)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {user && reply.author.id === user.id ? (
                                          <>
                                            {reply.id.startsWith('temp-') ? (
                                              <span className="text-xs text-gray-400 dark:text-gray-500">{savingLabel}</span>
                                            ) : (
                                              <>
                                                <button
                                                  onClick={() => handleEditComment(reply.id, reply.content)}
                                                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                  {editLabel}
                                                </button>
                                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                                <button
                                                  onClick={() => handleDeleteComment(reply.id, true, comment.id)}
                                                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                >
                                                  {deleteLabel}
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
											  {reportLabel}
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
                                          onInput={handleTextareaInput}
                                          onFocus={handleTextareaFocus}
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none overflow-hidden"
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
                                            {cancelLabel}
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleSaveEdit(reply.id, true, comment.id)}
                                            disabled={!editContent.trim()}
                                          >
                                            {saveLabel}
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
	                                      <Tooltip content={likeTooltipLabel} position="top">
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
                              );
                            })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                  {firstCommentLabel}
                </div>
              )}

              {commentsInfiniteQuery.hasNextPage ? (
                <div ref={commentsLoadMoreRef} className="flex justify-center py-4">
                  {commentsInfiniteQuery.isFetchingNextPage ? (
                    <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">{loadingLabel}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <form onSubmit={handleSubmitComment} className="mt-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onInput={handleTextareaInput}
                  placeholder={commentPlaceholderLabel}
                  readOnly={!user}
                  onFocus={(event) => {
                    if (!user) {
                      openLoginPrompt();
                      return;
                    }
                    handleTextareaFocus(event);
                  }}
                  onClick={() => {
                    if (!user) openLoginPrompt();
                  }}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500 resize-none overflow-hidden ${!user ? 'opacity-70 cursor-pointer' : ''}`}
                  rows={3}
                />
                  {showCommentValidationError && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-800 dark:text-red-100">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        {commentWarnings.banned ? <p>{bannedWarningLabel}</p> : null}
                        {commentWarnings.spam ? (
                          <p className="flex items-center gap-1">
                            <LinkIcon className="h-4 w-4" />
                            <span>{spamWarningLabel}</span>
                          </p>
                        ) : null}
                        {commentValidationMessage ? <p className="text-red-600 dark:text-red-300">{commentValidationMessage}</p> : null}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end mt-3">
                    <Tooltip content={guidelineTooltip} position="top-left">
                    <Button type="submit" disabled={!newComment.trim() || showCommentValidationError} size="sm">
                        {writeCommentLabel}
                      </Button>
                    </Tooltip>
                  </div>
              </form>
            </>
          )}
        </section>
        {showRecommendations ? (
          <section className="mt-8 sm:mt-10 space-y-8 border-t border-gray-200 dark:border-gray-700 pt-8 sm:pt-10">
            {showRelatedSection ? (
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {relatedTitleLabel}
                </h3>
                {relatedPostsQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : relatedPosts.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {relatedPosts.map((item) => (
                      <PostCard key={item.id} {...mapPostToCardProps(item)} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm text-gray-500 dark:text-gray-400">
                    {relatedEmptyLabel}
                  </div>
                )}
              </div>
            ) : null}
            {showCategorySection ? (
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {categoryPopularTitleLabel}
                </h3>
                {categoryPopularQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : categoryPopularPosts.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {categoryPopularPosts.map((item) => (
                      <PostCard key={item.id} {...mapPostToCardProps(item)} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm text-gray-500 dark:text-gray-400">
                    {categoryPopularEmptyLabel}
                  </div>
                )}
              </div>
            ) : null}
          </section>
        ) : null}
      </main>

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
	                {reportTarget?.type === 'post' ? reportTargetPostLabel : reportTarget?.type === 'answer' ? reportTargetReplyLabel : reportTargetCommentLabel} {reportLabel}
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
                { type: 'spam' as ReportType, label: reportSpamLabel, featured: true },
                { type: 'harassment' as ReportType, label: reportHarassmentLabel },
                { type: 'misinformation' as ReportType, label: reportMisinformationLabel },
                { type: 'inappropriate' as ReportType, label: reportInappropriateLabel },
                { type: 'other' as ReportType, label: reportOtherLabel },
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
                    onInput={handleTextareaInput}
                    onFocus={handleTextareaFocus}
                    placeholder={reportPlaceholderLabel}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none overflow-hidden"
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
                {cancelLabel}
              </button>
              <button
                onClick={() => selectedReportType && handleReport(selectedReportType)}
                disabled={!selectedReportType || (selectedReportType === 'other' && !reportReason.trim()) || reportPostMutation.isPending || reportCommentMutation.isPending || reportAnswerMutation.isPending}
                className="flex-1 px-4 py-3 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(reportPostMutation.isPending || reportCommentMutation.isPending || reportAnswerMutation.isPending) ? processingLabel : reportSubmitLabel}
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
