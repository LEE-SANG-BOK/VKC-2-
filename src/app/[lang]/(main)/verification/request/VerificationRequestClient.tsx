'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { Upload, FileText, CheckCircle, Clock, XCircle, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useVerificationHistory } from '@/repo/verification/query';
import { useCreateVerificationRequest } from '@/repo/verification/mutation';
import type { VerificationType, VerificationRequest } from '@/repo/verification/types';
import { ApiError } from '@/lib/api/errors';
import { toast } from 'sonner';
import { suggestBadgeType } from '@/lib/constants/badges';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';
import TrustBadge from '@/components/atoms/TrustBadge';
import Tooltip from '@/components/atoms/Tooltip';

interface VerificationRequestClientProps {
  translations: Record<string, unknown>;
  lang: string;
}
  
export default function VerificationRequestClient({ translations, lang }: VerificationRequestClientProps) {
  const router = useRouter();
  const { status } = useSession();
  const t = (translations?.verification || {}) as Record<string, string>;
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;

  const trustBadgeGuideHref = `/${lang}/guide/trust-badges`;
  const learnMoreLabel = tCommon.learnMore || (lang === 'vi' ? 'Xem thêm' : lang === 'en' ? 'Learn more' : '자세히');

  const [formData, setFormData] = useState({
    verificationType: '' as VerificationType | '',
    documents: [] as File[],
    additionalInfo: '',
    visaType: '',
    universityName: '',
    universityEmail: '',
    industry: '',
    companyName: '',
    jobTitle: '',
  });

  const [documentPreviews, setDocumentPreviews] = useState<
    { id: string; file: File; url?: string; kind: 'image' | 'pdf' | 'file' }[]
  >([]);

  const [dragActive, setDragActive] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [uploading, setUploading] = useState(false);

  const { data: historyData, isLoading: historyLoading } = useVerificationHistory();
  const createMutation = useCreateVerificationRequest();

  const requests = historyData?.data || [];

  useEffect(() => {
    const previews = formData.documents.map((file) => {
      const id = `${file.name}-${file.size}-${file.lastModified}`;
      const fileName = file.name.toLowerCase();
      const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
      const isImage = file.type.startsWith('image/');
      const kind: 'image' | 'pdf' | 'file' = isImage ? 'image' : isPdf ? 'pdf' : 'file';
      const url = kind === 'image' ? URL.createObjectURL(file) : undefined;
      return { id, file, kind, url };
    });

    setDocumentPreviews(previews);

    return () => {
      previews.forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url);
      });
    };
  }, [formData.documents]);

  const documentKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;
  const maxDocuments = 5;

  const addDocuments = (files: FileList | File[]) => {
    const incoming = Array.from(files || []);
    if (incoming.length === 0) return;

    const existing = formData.documents;
    const seen = new Set(existing.map(documentKey));
    const merged = [...existing];
    incoming.forEach((file) => {
      const key = documentKey(file);
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(file);
    });

    if (merged.length > maxDocuments) {
      toast.error(t.documentLimitError || '서류는 최대 5개까지 첨부할 수 있습니다.');
    }

    setFormData({
      ...formData,
      documents: merged.slice(0, maxDocuments),
    });
  };

  const removeDocument = (id: string) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter((file) => documentKey(file) !== id),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.verificationType || formData.documents.length === 0) {
      toast.error(t.validationError || '인증 유형과 증빙 서류를 선택해주세요.');
      return;
    }

    try {
      setUploading(true);

      const documentPaths: string[] = [];
      for (const file of formData.documents) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadRes = await fetch('/api/upload/document', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          throw new Error(t.uploadError || '파일 업로드에 실패했습니다.');
        }

        const uploadData = await uploadRes.json();
        const documentPath = uploadData.data?.path;

        if (!documentPath) {
          throw new Error(t.urlError || '파일 경로를 받지 못했습니다.');
        }
        documentPaths.push(documentPath);
      }

      await createMutation.mutateAsync({
        type: formData.verificationType as VerificationType,
        documents: documentPaths,
        visaType: formData.visaType || undefined,
        universityName: formData.universityName || undefined,
        universityEmail: formData.universityEmail || undefined,
        industry: formData.industry || undefined,
        companyName: formData.companyName || undefined,
        jobTitle: formData.jobTitle || undefined,
        extraInfo: formData.additionalInfo || undefined,
      });

      toast.success(t.submitSuccess || '인증 신청이 완료되었습니다!\n관리자 검토 후 결과를 알려드립니다.');
      setFormData({
        verificationType: '',
        documents: [],
        additionalInfo: '',
        visaType: '',
        universityName: '',
        universityEmail: '',
        industry: '',
        companyName: '',
        jobTitle: '',
      });
    } catch (error) {
      console.error('Verification request error:', error);
      const translated =
        error instanceof ApiError && error.code
          ? {
              VERIFICATION_REQUIRED_FIELDS: t.validationError || '인증 유형과 증빙 서류를 선택해주세요.',
              VERIFICATION_ALREADY_APPROVED: t.alreadyVerifiedMessage || '이미 인증이 완료되었습니다.',
              VERIFICATION_ALREADY_PENDING: t.pendingRequestMessage || '이미 검토 중인 인증 요청이 있습니다.',
              VERIFICATION_STUDENT_REQUIRED: t.studentRequiredError || '학생 인증은 대학명 또는 학교 이메일이 필요합니다.',
              VERIFICATION_WORKER_REQUIRED: t.workerRequiredError || '직장인 인증은 산업 분야 또는 회사명이 필요합니다.',
              VERIFICATION_DOCUMENT_REQUIRED: t.documentRequiredError || '인증 서류를 다시 첨부해주세요.',
              VERIFICATION_DOCUMENT_LIMIT: t.documentLimitError || '서류는 최대 5개까지 첨부할 수 있습니다.',
              VERIFICATION_DOCUMENT_NOT_OWNED: t.documentNotOwnedError || '본인이 업로드한 서류만 첨부할 수 있습니다.',
            }[error.code]
          : null;

      toast.error(translated || (error instanceof Error ? error.message : (t.submitError || '인증 신청 중 오류가 발생했습니다.')));
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (formData.verificationType || formData.documents.length > 0 || formData.additionalInfo) {
      if (!confirm(t.cancelConfirm || '작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        return;
      }
    }
    router.back();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addDocuments(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addDocuments(e.target.files);
      e.target.value = '';
    }
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

  const hasPendingRequest = requests.some((r: VerificationRequest) => r.status === 'pending');
  const hasApprovedRequest = requests.some((r: VerificationRequest) => r.status === 'approved');

  const suggestedBadgeTypeValue = useMemo(() => {
    if (!formData.verificationType) return null;
    return suggestBadgeType({
      verificationType: formData.verificationType,
      visaType: formData.visaType || null,
      industry: formData.industry || null,
      jobTitle: formData.jobTitle || null,
      extraInfo: formData.additionalInfo || null,
    });
  }, [formData.additionalInfo, formData.industry, formData.jobTitle, formData.verificationType, formData.visaType]);

  const trustBadgePreview = useMemo(() => {
    if (!suggestedBadgeTypeValue) return null;
    return getTrustBadgePresentation({
      locale: lang,
      author: {
        badgeType: suggestedBadgeTypeValue,
      },
      translations: tTrust,
    });
  }, [lang, suggestedBadgeTypeValue, tTrust]);

  const verifiedProfilePreview = useMemo(() => {
    if (!formData.verificationType) {
      return { summary: '', keywords: [] as string[] };
    }

    const trim = (value: string) => value.trim();
    const visaType = trim(formData.visaType);
    const universityName = trim(formData.universityName);
    const companyName = trim(formData.companyName);
    const jobTitle = trim(formData.jobTitle);
    const industry = trim(formData.industry);

    const summaryParts: string[] = [];
    const keywordParts: string[] = [];

    const add = (value: string) => {
      if (!value) return;
      const normalized = value.replace(/^#/, '').trim();
      if (!normalized) return;
      keywordParts.push(normalized);
    };

    const addSummary = (value: string) => {
      if (!value) return;
      summaryParts.push(value);
      add(value);
    };

    if (formData.verificationType === 'student') {
      addSummary(visaType);
      addSummary(universityName);
    } else if (formData.verificationType === 'worker' || formData.verificationType === 'business') {
      addSummary(companyName);
      addSummary(jobTitle);
      addSummary(industry);
      addSummary(visaType);
    } else if (formData.verificationType === 'expert') {
      addSummary(jobTitle);
      addSummary(industry);
      addSummary(companyName);
      addSummary(visaType);
    } else {
      addSummary(visaType);
      addSummary(jobTitle);
    }

    const normalizedKeywords = keywordParts.map((keyword) => keyword.trim()).filter(Boolean);
    const uniqueKeywords = Array.from(new Set(normalizedKeywords)).slice(0, 12);

    return {
      summary: summaryParts.filter(Boolean).join(' · ').slice(0, 140),
      keywords: uniqueKeywords,
    };
  }, [formData.companyName, formData.industry, formData.jobTitle, formData.universityName, formData.verificationType, formData.visaType]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/login`);
    }
  }, [status, router, lang]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← {t.goBack || '뒤로 가기'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 신청 내역 섹션 */}
          {requests.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.historyTitle || '신청 내역'}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(t.historyCount || '총 {count}건').replace('{count}', String(requests.length))}
                    </p>
                  </div>
                </div>
                {showHistory ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {showHistory && (
                <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                  {historyLoading ? (
                    <div className="p-6 text-center">
                      <div className="h-6 w-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin mx-auto" />
                    </div>
                  ) : (
                    requests.map((request: VerificationRequest) => (
                      <div key={request.id} className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {getTypeLabel(request.type)}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {t.submitted || '신청'}: {new Date(request.submittedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : lang === 'vi' ? 'vi-VN' : 'en-US')}
                              </span>
                              {request.reviewedAt && (
                                <span className="flex items-center gap-1">
                                  {t.reviewed || '검토'}: {new Date(request.reviewedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : lang === 'vi' ? 'vi-VN' : 'en-US')}
                                </span>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        {request.status === 'rejected' && request.reason && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                              {t.rejectionReason || '반려 사유'}
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-400">
                              {request.reason}
                            </p>
                          </div>
                        )}

                        {request.status === 'pending' && (
                          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              {t.pendingMessage || '관리자가 검토 중입니다. 영업일 기준 1~3일 소요됩니다.'}
                            </p>
                          </div>
                        )}

                        {request.status === 'approved' && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {t.approvedMessage || '인증이 승인되었습니다. 프로필에 인증 배지가 표시됩니다.'}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* 신청 폼 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-red-600 to-amber-500 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.pageTitle || '인증 신청'}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.pageDescription || '전문가 인증을 신청하세요'}</p>
              </div>
            </div>

            {hasApprovedRequest ? (
              <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
                  {t.alreadyVerifiedTitle || '이미 인증되었습니다'}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {t.alreadyVerifiedMessage || '인증이 승인되어 프로필에 인증 배지가 표시됩니다.'}
                </p>
              </div>
            ) : hasPendingRequest ? (
              <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
                <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                  {t.pendingRequestTitle || '검토 중인 신청이 있습니다'}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  {t.pendingRequestMessage || '이미 검토 중인 인증 신청이 있습니다. 검토가 완료된 후 다시 신청해주세요.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="verificationType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.typeLabel || '인증 유형'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="verificationType"
                    value={formData.verificationType}
                    onChange={(e) => setFormData({ ...formData, verificationType: e.target.value as VerificationType })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">{t.typePlaceholder || '인증 유형을 선택하세요'}</option>
                    <option value="student">{t.typeStudent || '학생 인증'}</option>
                    <option value="worker">{t.typeWorker || '직장인 인증'}</option>
                    <option value="expert">{t.typeExpert || '전문가 인증'}</option>
                    <option value="business">{t.typeBusiness || '사업자 인증'}</option>
                    <option value="other">{t.typeOther || '기타'}</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="visaType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t.visaTypeLabel || '비자 종류'}
                    </label>
                    <input
                      id="visaType"
                      type="text"
                      value={formData.visaType}
                      onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder={t.visaTypePlaceholder || '예: D-2, D-10, E-7-1, F-2-7'}
                    />
                  </div>
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t.jobTitleLabel || '직무/포지션 (선택)'}
                    </label>
                    <input
                      id="jobTitle"
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder={t.jobTitlePlaceholder || '예: 프론트엔드 개발자, 유학생'}
                    />
                  </div>
                </div>

                {formData.verificationType === 'student' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="universityName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t.universityNameLabel || '대학/학교명'}
                      </label>
                      <input
                        id="universityName"
                        type="text"
                        value={formData.universityName}
                        onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder={t.universityNamePlaceholder || '예: 부산대학교'}
                      />
                    </div>
                    <div>
                      <label htmlFor="universityEmail" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t.universityEmailLabel || '학교 이메일'}
                      </label>
                      <input
                        id="universityEmail"
                        type="email"
                        value={formData.universityEmail}
                        onChange={(e) => setFormData({ ...formData, universityEmail: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="name@university.ac.kr"
                      />
                    </div>
                  </div>
                )}

                {['worker', 'business', 'expert'].includes(formData.verificationType) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="industry" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t.industryLabel || '산업 분야'}
                      </label>
                      <input
                        id="industry"
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder={t.industryPlaceholder || '예: 제조, IT, 서비스'}
                      />
                    </div>
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t.companyLabel || '회사명'}
                      </label>
                      <input
                        id="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder={t.companyPlaceholder || '예: K-Tech'}
                      />
                    </div>
                  </div>
                )}

                {formData.verificationType && trustBadgePreview ? (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {t.profilePreviewTitle || (lang === 'vi' ? 'Xem trước hồ sơ' : lang === 'en' ? 'Profile preview' : '프로필 표시 미리보기')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t.profilePreviewDescription ||
                            (lang === 'vi'
                              ? 'Thông tin dưới đây có thể được hiển thị trên hồ sơ sau khi được duyệt.'
                              : lang === 'en'
                                ? 'This information may appear on your profile after approval.'
                                : '승인 후 아래 정보가 프로필에 표시될 수 있어요.')}
                        </p>
                      </div>
                      <Tooltip
                        content={
                          <div className="space-y-1">
                            <div>{trustBadgePreview.tooltip}</div>
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
                          <TrustBadge level={trustBadgePreview.level} label={trustBadgePreview.label} />
                        </span>
                      </Tooltip>
                    </div>

                    {verifiedProfilePreview.keywords.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {verifiedProfilePreview.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="inline-flex items-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-200"
                          >
                            #{keyword}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {verifiedProfilePreview.summary ? (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                        {verifiedProfilePreview.summary}
                      </p>
                    ) : null}

                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      {t.profilePreviewDisclaimer ||
                        (lang === 'vi'
                          ? 'Quản trị viên có thể chỉnh sửa nội dung hiển thị sau khi xác minh.'
                          : lang === 'en'
                            ? 'Admins may adjust what is shown after review.'
                            : '관리자 검토 과정에서 표시 내용이 일부 수정될 수 있어요.')}
                    </p>
                  </div>
                ) : null}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.documentLabel || '증빙 서류'} <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                      dragActive
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="documents"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                      required={formData.documents.length === 0}
                    />
                    <label
                      htmlFor="documents"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      {formData.documents.length > 0 ? (
                        <>
                          <FileText className="w-12 h-12 text-green-500 mb-3" />
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {(t.documentsSelectedCount || '').includes('{count}')
                              ? t.documentsSelectedCount.replace('{count}', String(formData.documents.length))
                              : lang === 'vi'
                                ? `Đã chọn ${formData.documents.length} tệp`
                                : lang === 'en'
                                  ? `${formData.documents.length} files selected`
                                  : `선택된 파일 ${formData.documents.length}개`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t.documentsAddMore ||
                              (lang === 'vi'
                                ? 'Nhấn để thêm tệp khác'
                                : lang === 'en'
                                  ? 'Click to add more files'
                                  : '클릭하여 추가 파일 선택')}
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {t.documentUpload || '클릭하거나 파일을 드래그하여 업로드'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t.documentFormats || 'JPG, PNG, PDF (최대 10MB)'}
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                  {documentPreviews.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {documentPreviews.map((preview) => (
                        <div
                          key={preview.id}
                          className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                        >
                          {preview.kind === 'image' && preview.url ? (
                            <img
                              src={preview.url}
                              alt={preview.file.name}
                              className="h-10 w-10 rounded-md object-cover border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <FileText className="h-10 w-10 p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200" />
                          )}
                          <p className="min-w-0 flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                            {preview.file.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeDocument(preview.id)}
                            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                            aria-label={t.removeDocument || 'Remove document'}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t.documentHint || '※ 학생증, 재직증명서, 자격증 등 인증을 위한 서류를 첨부해주세요'}
                  </p>
                </div>

                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.additionalInfoLabel || '추가 정보 (선택)'}
                  </label>
                  <textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
                    placeholder={t.additionalInfoPlaceholder || '인증과 관련된 추가 정보를 입력해주세요'}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    {t.guideTitle || '📌 인증 심사 안내'}
                  </h3>
                  <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• {t.guide1 || '인증 심사는 영업일 기준 1~3일 소요됩니다.'}</li>
                    <li>• {t.guide2 || '제출하신 서류는 인증 목적으로만 사용되며, 안전하게 보관됩니다.'}</li>
                    <li>• {t.guide3 || '인증이 승인되면 프로필에 인증 배지가 표시됩니다.'}</li>
                    <li>• {t.guide4 || '추가 서류가 필요한 경우 이메일로 연락드립니다.'}</li>
                  </ul>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={uploading || createMutation.isPending}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading || createMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t.submitting || '처리 중...'}
                      </span>
                    ) : (
                      t.submitButton || '인증 신청하기'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300"
                  >
                    {t.cancelButton || '취소'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
