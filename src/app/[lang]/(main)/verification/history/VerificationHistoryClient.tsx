'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { Clock, CheckCircle, XCircle, FileText, Calendar } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useVerificationHistory } from '@/repo/verification/query';
import type { VerificationRequest } from '@/repo/verification/types';

interface VerificationHistoryClientProps {
  translations: Record<string, unknown>;
  lang: string;
}

export default function VerificationHistoryClient({ translations, lang }: VerificationHistoryClientProps) {
  const router = useRouter();
  const { status } = useSession();
  const t = (translations?.verification || {}) as Record<string, string>;
  const fallback = useMemo(() => {
    if (lang === 'en') {
      return {
        statusPending: 'Pending',
        statusApproved: 'Approved',
        statusRejected: 'Rejected',
        typeStudent: 'Student verification',
        typeWorker: 'Worker verification',
        typeExpert: 'Expert verification',
        typeBusiness: 'Business verification',
        typeOther: 'Other',
        goBack: 'Go back',
        historyPageTitle: 'Verification history',
        historyPageDescription: 'Review and manage your verification requests.',
        newRequest: 'New request',
        historyLoadErrorTitle: 'Unable to load history',
        historyLoadErrorDescription: 'Please try again later.',
        retry: 'Try again',
        noHistoryTitle: 'No requests yet',
        noHistoryDescription: 'Apply for verification to boost trust.',
        applyVerification: 'Apply for verification',
        applicationDate: 'Applied',
        reviewDate: 'Reviewed',
        rejectionReason: 'Rejection reason',
        pendingMessage: 'Under review. It takes 1–3 business days.',
        approvedMessage: 'Approved. A verified badge will appear on your profile.',
        loadingMore: 'Loading...',
        loadMore: 'Load more',
        benefitsTitle: '💡 Verification benefits',
        benefit1: 'A verified badge appears on your profile to increase trust.',
        benefit2: 'Get higher trust when answering in your field.',
        benefit3: 'Be recognized as an expert in the community.',
        benefit4: 'Access features for verified users only.',
      };
    }
    if (lang === 'vi') {
      return {
        statusPending: 'Đang xét duyệt',
        statusApproved: 'Đã duyệt',
        statusRejected: 'Từ chối',
        typeStudent: 'Xác minh sinh viên',
        typeWorker: 'Xác minh người đi làm',
        typeExpert: 'Xác minh chuyên gia',
        typeBusiness: 'Xác minh doanh nghiệp',
        typeOther: 'Khác',
        goBack: 'Quay lại',
        historyPageTitle: 'Lịch sử xác minh',
        historyPageDescription: 'Xem và quản lý yêu cầu xác minh.',
        newRequest: 'Yêu cầu mới',
        historyLoadErrorTitle: 'Không thể tải lịch sử',
        historyLoadErrorDescription: 'Vui lòng thử lại sau.',
        retry: 'Thử lại',
        noHistoryTitle: 'Chưa có yêu cầu',
        noHistoryDescription: 'Hãy xác minh để tăng độ tin cậy.',
        applyVerification: 'Gửi yêu cầu xác minh',
        applicationDate: 'Ngày gửi',
        reviewDate: 'Ngày duyệt',
        rejectionReason: 'Lý do từ chối',
        pendingMessage: 'Đang xét duyệt. Mất 1–3 ngày làm việc.',
        approvedMessage: 'Đã duyệt. Huy hiệu xác minh sẽ hiển thị trên hồ sơ.',
        loadingMore: 'Đang tải...',
        loadMore: 'Xem thêm',
        benefitsTitle: '💡 Lợi ích xác minh',
        benefit1: 'Huy hiệu xác minh hiển thị trên hồ sơ để tăng độ tin cậy.',
        benefit2: 'Nhận thêm niềm tin khi trả lời trong lĩnh vực chuyên môn.',
        benefit3: 'Được cộng đồng công nhận là chuyên gia.',
        benefit4: 'Truy cập các tính năng dành cho người đã xác minh.',
      };
    }
    return {
      statusPending: '심사중',
      statusApproved: '승인',
      statusRejected: '반려',
      typeStudent: '학생 인증',
      typeWorker: '직장인 인증',
      typeExpert: '전문가 인증',
      typeBusiness: '사업자 인증',
      typeOther: '기타',
      goBack: '뒤로 가기',
      historyPageTitle: '인증 신청 내역',
      historyPageDescription: '인증 신청 현황을 확인하고 관리하세요',
      newRequest: '새 인증 신청',
      historyLoadErrorTitle: '내역을 불러오지 못했습니다',
      historyLoadErrorDescription: '잠시 후 다시 시도해주세요.',
      retry: '다시 시도',
      noHistoryTitle: '신청 내역이 없습니다',
      noHistoryDescription: '전문가 인증을 신청하여 신뢰도를 높여보세요',
      applyVerification: '인증 신청하기',
      applicationDate: '신청일',
      reviewDate: '검토일',
      rejectionReason: '반려 사유',
      pendingMessage: '관리자가 검토 중입니다. 영업일 기준 1~3일 소요됩니다.',
      approvedMessage: '인증이 승인되었습니다. 프로필에 인증 배지가 표시됩니다.',
      loadingMore: '불러오는 중...',
      loadMore: '더 보기',
      benefitsTitle: '💡 인증의 장점',
      benefit1: '프로필에 인증 배지가 표시되어 신뢰도가 높아집니다',
      benefit2: '전문 분야의 질문에 답변 시 더 높은 신뢰를 받습니다',
      benefit3: '커뮤니티에서 전문가로 인정받을 수 있습니다',
      benefit4: '인증된 사용자만 이용할 수 있는 기능에 접근할 수 있습니다',
    };
  }, [lang]);
  const statusPendingLabel = t.statusPending || fallback.statusPending;
  const statusApprovedLabel = t.statusApproved || fallback.statusApproved;
  const statusRejectedLabel = t.statusRejected || fallback.statusRejected;
  const typeLabels: Record<string, string> = {
    student: t.typeStudent || fallback.typeStudent,
    worker: t.typeWorker || fallback.typeWorker,
    expert: t.typeExpert || fallback.typeExpert,
    business: t.typeBusiness || fallback.typeBusiness,
    other: t.typeOther || fallback.typeOther,
  };
  const goBackLabel = t.goBack || fallback.goBack;
  const historyPageTitle = t.historyPageTitle || fallback.historyPageTitle;
  const historyPageDescription = t.historyPageDescription || fallback.historyPageDescription;
  const newRequestLabel = t.newRequest || fallback.newRequest;
  const historyLoadErrorTitle = t.historyLoadErrorTitle || fallback.historyLoadErrorTitle;
  const historyLoadErrorDescription = t.historyLoadErrorDescription || fallback.historyLoadErrorDescription;
  const retryLabel = t.retry || fallback.retry;
  const noHistoryTitle = t.noHistoryTitle || fallback.noHistoryTitle;
  const noHistoryDescription = t.noHistoryDescription || fallback.noHistoryDescription;
  const applyVerificationLabel = t.applyVerification || fallback.applyVerification;
  const applicationDateLabel = t.applicationDate || fallback.applicationDate;
  const reviewDateLabel = t.reviewDate || fallback.reviewDate;
  const rejectionReasonLabel = t.rejectionReason || fallback.rejectionReason;
  const pendingMessageLabel = t.pendingMessage || fallback.pendingMessage;
  const approvedMessageLabel = t.approvedMessage || fallback.approvedMessage;
  const loadingMoreLabel = t.loadingMore || fallback.loadingMore;
  const benefitsTitleLabel = t.benefitsTitle || fallback.benefitsTitle;
  const benefit1Label = t.benefit1 || fallback.benefit1;
  const benefit2Label = t.benefit2 || fallback.benefit2;
  const benefit3Label = t.benefit3 || fallback.benefit3;
  const benefit4Label = t.benefit4 || fallback.benefit4;

  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const limit = 20;

  const {
    data: historyData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useVerificationHistory({ page, limit });

  const totalPages = historyData?.pagination.totalPages ?? 1;
  const [items, setItems] = useState<VerificationRequest[]>([]);

  useEffect(() => {
    if (!historyData) return;
    if (page === 1) {
      setItems(historyData.data);
      return;
    }

    setItems((prev) => {
      const seen = new Set(prev.map((request) => request.id));
      const merged = [...prev];
      historyData.data.forEach((request) => {
        if (seen.has(request.id)) return;
        seen.add(request.id);
        merged.push(request);
      });
      return merged;
    });
  }, [historyData, page]);

  const requests = useMemo(() => items, [items]);

  const handleNewRequest = () => {
    router.push(`/${lang}/verification/request`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            {statusPendingLabel}
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            {statusApprovedLabel}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            {statusRejectedLabel}
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    return typeLabels[type] || type;
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/login`);
    }
  }, [status, router, lang]);

  const handleLoadMore = useCallback(() => {
    if (isFetching) return;
    if (page >= totalPages) return;
    setPage((prev) => prev + 1);
  }, [isFetching, page, totalPages]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    if (page >= totalPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        handleLoadMore();
      },
      { rootMargin: '160px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [handleLoadMore, page, totalPages]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← {goBackLabel}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{historyPageTitle}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {historyPageDescription}
                </p>
              </div>
              <button
                onClick={handleNewRequest}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {newRequestLabel}
              </button>
            </div>
          </div>

          {/* Requests List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50">
            {isLoading ? (
              <div className="p-6">
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
                <div className="space-y-3">
                  <div className="h-16 bg-gray-100 dark:bg-gray-700/30 rounded" />
                  <div className="h-16 bg-gray-100 dark:bg-gray-700/30 rounded" />
                  <div className="h-16 bg-gray-100 dark:bg-gray-700/30 rounded" />
                </div>
              </div>
            ) : isError ? (
              <div className="p-10 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {historyLoadErrorTitle}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {historyLoadErrorDescription}
                </p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {retryLabel}
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {noHistoryTitle}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {noHistoryDescription}
                </p>
                <button
                  onClick={handleNewRequest}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 transition-all duration-300"
                >
                  <CheckCircle className="w-5 h-5" />
                  {applyVerificationLabel}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {requests.map((request) => (
                  <div key={request.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {getTypeLabel(request.type)}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {applicationDateLabel}: {new Date(request.submittedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : lang === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                          {request.reviewedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {reviewDateLabel}: {new Date(request.reviewedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : lang === 'vi' ? 'vi-VN' : 'en-US')}
                            </span>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {request.status === 'rejected' && request.reason && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">
                          {rejectionReasonLabel}
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-300">
                          {request.reason}
                        </p>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          {pendingMessageLabel}
                        </p>
                      </div>
                    )}

                    {request.status === 'approved' && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-300">
                          {approvedMessageLabel}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {page < totalPages && (
                  <div className="p-6 flex justify-center">
                    {isFetching ? (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{loadingMoreLabel}</span>
                    ) : (
                      <div ref={sentinelRef} className="h-6 w-full" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Box */}
          {requests.length === 0 && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                {benefitsTitleLabel}
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <li>• {benefit1Label}</li>
                <li>• {benefit2Label}</li>
                <li>• {benefit3Label}</li>
                <li>• {benefit4Label}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
