'use client';

import { useEffect, useMemo, useState } from 'react';
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

  const [page, setPage] = useState(1);
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
            {t.statusPending || '심사중'}
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            {t.statusApproved || '승인'}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            {t.statusRejected || '반려'}
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      student: t.typeStudent || '학생 인증',
      worker: t.typeWorker || '직장인 인증',
      expert: t.typeExpert || '전문가 인증',
      business: t.typeBusiness || '사업자 인증',
      other: t.typeOther || '기타',
    };
    return labels[type] || type;
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/login`);
    }
  }, [status, router, lang]);

  const handleLoadMore = () => {
    if (isFetching) return;
    if (page >= totalPages) return;
    setPage((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← {t.goBack || '뒤로 가기'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.historyPageTitle || '인증 신청 내역'}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.historyPageDescription || '인증 신청 현황을 확인하고 관리하세요'}
                </p>
              </div>
              <button
                onClick={handleNewRequest}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {t.newRequest || '새 인증 신청'}
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
                  {t.historyLoadErrorTitle || '내역을 불러오지 못했습니다'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {t.historyLoadErrorDescription || '잠시 후 다시 시도해주세요.'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {t.retry || '다시 시도'}
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t.noHistoryTitle || '신청 내역이 없습니다'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {t.noHistoryDescription || '전문가 인증을 신청하여 신뢰도를 높여보세요'}
                </p>
                <button
                  onClick={handleNewRequest}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 transition-all duration-300"
                >
                  <CheckCircle className="w-5 h-5" />
                  {t.applyVerification || '인증 신청하기'}
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
                            {t.applicationDate || '신청일'}: {new Date(request.submittedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : lang === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                          {request.reviewedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {t.reviewDate || '검토일'}: {new Date(request.reviewedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : lang === 'vi' ? 'vi-VN' : 'en-US')}
                            </span>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {request.status === 'rejected' && request.reason && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">
                          {t.rejectionReason || '반려 사유'}
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-300">
                          {request.reason}
                        </p>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          {t.pendingMessage || '관리자가 검토 중입니다. 영업일 기준 1~3일 소요됩니다.'}
                        </p>
                      </div>
                    )}

                    {request.status === 'approved' && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-300">
                          {t.approvedMessage || '인증이 승인되었습니다. 프로필에 인증 배지가 표시됩니다.'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {page < totalPages && (
                  <div className="p-6 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isFetching}
                      className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {isFetching
                        ? (t.loadingMore || '불러오는 중...')
                        : (t.loadMore || '더 보기')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Box */}
          {requests.length === 0 && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                {t.benefitsTitle || '💡 인증의 장점'}
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <li>• {t.benefit1 || '프로필에 인증 배지가 표시되어 신뢰도가 높아집니다'}</li>
                <li>• {t.benefit2 || '전문 분야의 질문에 답변 시 더 높은 신뢰를 받습니다'}</li>
                <li>• {t.benefit3 || '커뮤니티에서 전문가로 인정받을 수 있습니다'}</li>
                <li>• {t.benefit4 || '인증된 사용자만 이용할 수 있는 기능에 접근할 수 있습니다'}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
