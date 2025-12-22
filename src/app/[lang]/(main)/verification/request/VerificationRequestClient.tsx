'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { Upload, FileText, CheckCircle, Clock, XCircle, Calendar, X } from 'lucide-react';
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
  const tErrors = (translations?.errors || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;
  const documentLimitError = t.documentLimitError || '';
  const validationError = t.validationError || '';
  const uploadError = t.uploadError || '';
  const urlError = t.urlError || '';
  const submitSuccessLabel = t.submitSuccess || '';
  const submitErrorLabel = t.submitError || '';
  const cancelConfirmLabel = t.cancelConfirm || '';
  const statusPendingLabel = t.statusPending || '';
  const statusApprovedLabel = t.statusApproved || '';
  const statusRejectedLabel = t.statusRejected || '';
  const typeLabels: Record<string, string> = {
    student: t.typeStudent || '',
    worker: t.typeWorker || '',
    expert: t.typeExpert || '',
    business: t.typeBusiness || '',
    other: t.typeOther || '',
  };
  const goBackLabel = t.goBack || '';
  const historyPageTitle = t.historyPageTitle || '';
  const historyPageDescription = t.historyPageDescription || '';
  const alreadyVerifiedTitle = t.alreadyVerifiedTitle || '';
  const alreadyVerifiedMessage = t.alreadyVerifiedMessage || '';
  const pendingRequestTitle = t.pendingRequestTitle || '';
  const pendingRequestMessage = t.pendingRequestMessage || '';
  const historyTitle = t.historyTitle || '';
  const historyCountLabel = t.historyCount || '';
  const noHistoryTitle = t.noHistoryTitle || '';
  const noHistoryDescription = t.noHistoryDescription || '';
  const applyVerificationLabel = t.applyVerification || '';
  const submittedLabel = t.submitted || '';
  const reviewedLabel = t.reviewed || '';
  const rejectionReasonLabel = t.rejectionReason || '';
  const pendingMessageLabel = t.pendingMessage || '';
  const approvedMessageLabel = t.approvedMessage || '';
  const pageTitleLabel = t.pageTitle || '';
  const pageDescriptionLabel = t.pageDescription || '';
  const typeLabel = t.typeLabel || '';
  const typePlaceholderLabel = t.typePlaceholder || '';
  const visaTypeLabel = t.visaTypeLabel || '';
  const visaTypePlaceholderLabel = t.visaTypePlaceholder || '';
  const jobTitleLabel = t.jobTitleLabel || '';
  const jobTitlePlaceholderLabel = t.jobTitlePlaceholder || '';
  const universityNameLabel = t.universityNameLabel || '';
  const universityNamePlaceholderLabel = t.universityNamePlaceholder || '';
  const universityEmailLabel = t.universityEmailLabel || '';
  const industryLabel = t.industryLabel || '';
  const industryPlaceholderLabel = t.industryPlaceholder || '';
  const companyLabel = t.companyLabel || '';
  const companyPlaceholderLabel = t.companyPlaceholder || '';
  const documentLabel = t.documentLabel || '';
  const documentUploadLabel = t.documentUpload || '';
  const documentFormatsLabel = t.documentFormats || '';
  const removeDocumentLabel = t.removeDocument || '';
  const documentHintLabel = t.documentHint || '';
  const additionalInfoLabel = t.additionalInfoLabel || '';
  const additionalInfoPlaceholderLabel = t.additionalInfoPlaceholder || '';
  const guideTitleLabel = t.guideTitle || '';
  const guide1Label = t.guide1 || '';
  const guide2Label = t.guide2 || '';
  const guide3Label = t.guide3 || '';
  const guide4Label = t.guide4 || '';
  const submittingLabel = t.submitting || '';
  const submitButtonLabel = t.submitButton || '';
  const alreadyVerifiedErrorLabel = t.alreadyVerifiedMessage || '';
  const pendingRequestErrorLabel = t.pendingRequestMessage || '';
  const studentRequiredErrorLabel = t.studentRequiredError || '';
  const workerRequiredErrorLabel = t.workerRequiredError || '';
  const documentRequiredErrorLabel = t.documentRequiredError || '';
  const documentNotOwnedErrorLabel = t.documentNotOwnedError || '';

  const stepInfoLabel =
    t.stepInfo || '';
  const stepDocumentsLabel =
    t.stepDocuments || '';
  const stepStatusLabel =
    t.stepStatus || '';
  const nextLabel = tCommon.next || '';
  const previousLabel = tCommon.previous || '';
  const typeStepValidation =
    t.typeValidationError || '';
  const newRequestLabel =
    t.newRequest || '';
  const reapplyLabel =
    t.reapplyButton || '';
  const steps = [
    { id: 1, label: stepInfoLabel },
    { id: 2, label: stepDocumentsLabel },
    { id: 3, label: stepStatusLabel },
  ];

  const trustBadgeGuideHref = `/${lang}/guide/trust-badges`;
  const learnMoreLabel = tCommon.learnMore || '';

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
  const [uploading, setUploading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useVerificationHistory();
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
      toast.error(documentLimitError);
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
      toast.error(validationError);
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
        const uploadData = await uploadRes.json().catch(() => null);
        if (!uploadRes.ok || !uploadData?.success) {
          const message =
            (uploadData?.code && tErrors[uploadData.code]) ||
            uploadData?.error ||
            uploadError;
          throw new Error(message);
        }

        const documentPath = uploadData.data?.path;

        if (!documentPath) {
          throw new Error(urlError);
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

      await refetchHistory();
      setActiveStep(3);
      toast.success(submitSuccessLabel);
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
              VERIFICATION_REQUIRED_FIELDS: validationError,
              VERIFICATION_ALREADY_APPROVED: alreadyVerifiedErrorLabel,
              VERIFICATION_ALREADY_PENDING: pendingRequestErrorLabel,
              VERIFICATION_STUDENT_REQUIRED: studentRequiredErrorLabel,
              VERIFICATION_WORKER_REQUIRED: workerRequiredErrorLabel,
              VERIFICATION_DOCUMENT_REQUIRED: documentRequiredErrorLabel,
              VERIFICATION_DOCUMENT_LIMIT: documentLimitError,
              VERIFICATION_DOCUMENT_NOT_OWNED: documentNotOwnedErrorLabel,
            }[error.code]
          : null;

      if (error instanceof ApiError) {
        const fallbackMessage =
          (error.code && tErrors[error.code]) ||
          (error.status === 429 && tErrors.RATE_LIMITED) ||
          '';
        const suffix = error.retryAfterSeconds ? ` (${error.retryAfterSeconds}s)` : '';
        toast.error((translated || fallbackMessage || error.message || submitErrorLabel) + suffix);
        return;
      }

      toast.error(translated || (error instanceof Error ? error.message : submitErrorLabel));
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (formData.verificationType || formData.documents.length > 0 || formData.additionalInfo) {
      if (!confirm(cancelConfirmLabel)) {
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

  const handleNextStep = () => {
    if (!canStartNewRequest) {
      setActiveStep(3);
      return;
    }
    if (!formData.verificationType) {
      toast.error(typeStepValidation);
      return;
    }
    setActiveStep(2);
  };

  const handleReapply = (request: VerificationRequest) => {
    if (!canStartNewRequest) {
      setActiveStep(3);
      return;
    }
    const nextType = resolveVerificationType(request.type);
    if (!nextType) {
      toast.error(typeStepValidation);
      return;
    }
    setFormData({
      verificationType: nextType,
      documents: [],
      additionalInfo: request.extraInfo || '',
      visaType: request.visaType || '',
      universityName: request.universityName || '',
      universityEmail: request.universityEmail || '',
      industry: request.industry || '',
      companyName: request.companyName || '',
      jobTitle: request.jobTitle || '',
    });
    setActiveStep(1);
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

  const hasPendingRequest = requests.some((r: VerificationRequest) => r.status === 'pending');
  const hasApprovedRequest = requests.some((r: VerificationRequest) => r.status === 'approved');
  const canStartNewRequest = !hasPendingRequest && !hasApprovedRequest;
  const allowedVerificationTypes = ['student', 'worker', 'expert', 'business', 'other'] as const;
  const resolveVerificationType = (value: string | null | undefined) => {
    if (!value) return '';
    const normalized = value.trim().toLowerCase();
    return allowedVerificationTypes.includes(normalized as (typeof allowedVerificationTypes)[number])
      ? (normalized as VerificationType)
      : '';
  };

  useEffect(() => {
    if (!canStartNewRequest && activeStep !== 3) {
      setActiveStep(3);
    }
  }, [activeStep, canStartNewRequest]);

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
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← {goBackLabel}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-4">
            <div className="grid grid-cols-3 gap-2">
              {steps.map((step) => {
                const isActive = activeStep === step.id;
                const isComplete = activeStep > step.id;
                const isDisabled = !canStartNewRequest && step.id !== 3;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (isDisabled) return;
                      if (step.id === 2 && !formData.verificationType) {
                        toast.error(typeStepValidation);
                        return;
                      }
                      setActiveStep(step.id);
                    }}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                      isActive ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                    } ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        isActive || isComplete
                          ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {step.id}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        isActive || isComplete
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeStep === 3 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FileText className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{historyPageTitle}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{historyPageDescription}</p>
                  </div>
                </div>
                {canStartNewRequest ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 transition-all duration-300"
                  >
                    {newRequestLabel}
                  </button>
                ) : null}
              </div>

              {hasApprovedRequest ? (
                <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
                    {alreadyVerifiedTitle}
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {alreadyVerifiedMessage}
                  </p>
                </div>
              ) : hasPendingRequest ? (
                <div className="mt-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
                  <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                    {pendingRequestTitle}
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    {pendingRequestMessage}
                  </p>
                </div>
              ) : null}

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{historyTitle}</h2>
                  {requests.length > 0 ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {historyCountLabel.replace('{count}', String(requests.length))}
                    </span>
                  ) : null}
                </div>

                {historyLoading ? (
                  <div className="p-6 text-center">
                    <div className="h-6 w-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin mx-auto" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {noHistoryTitle}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      {noHistoryDescription}
                    </p>
                    {canStartNewRequest ? (
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 transition-all duration-300"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {applyVerificationLabel}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {requests.map((request: VerificationRequest) => (
                      <div key={request.id} className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {getTypeLabel(request.type)}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {submittedLabel}: {new Date(request.submittedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : lang === 'vi' ? 'vi-VN' : 'en-US')}
                              </span>
                              {request.reviewedAt && (
                                <span className="flex items-center gap-1">
                                  {reviewedLabel}: {new Date(request.reviewedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : lang === 'vi' ? 'vi-VN' : 'en-US')}
                                </span>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        {request.status === 'rejected' && request.reason && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                              {rejectionReasonLabel}
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-400">
                              {request.reason}
                            </p>
                          </div>
                        )}

                        {request.status === 'pending' && (
                          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              {pendingMessageLabel}
                            </p>
                          </div>
                        )}

                        {request.status === 'approved' && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {approvedMessageLabel}
                            </p>
                          </div>
                        )}

                        {request.status === 'rejected' && canStartNewRequest ? (
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleReapply(request)}
                              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              {reapplyLabel}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-red-600 to-amber-500 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pageTitleLabel}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{pageDescriptionLabel}</p>
                </div>
              </div>

              {activeStep === 1 ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="verificationType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {typeLabel} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="verificationType"
                      value={formData.verificationType}
                      onChange={(e) => setFormData({ ...formData, verificationType: e.target.value as VerificationType })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">{typePlaceholderLabel}</option>
                      <option value="student">{typeLabels.student}</option>
                      <option value="worker">{typeLabels.worker}</option>
                      <option value="expert">{typeLabels.expert}</option>
                      <option value="business">{typeLabels.business}</option>
                      <option value="other">{typeLabels.other}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="visaType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {visaTypeLabel}
                      </label>
                      <input
                        id="visaType"
                        type="text"
                        value={formData.visaType}
                        onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder={visaTypePlaceholderLabel}
                      />
                    </div>
                    <div>
                      <label htmlFor="jobTitle" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {jobTitleLabel}
                      </label>
                      <input
                        id="jobTitle"
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder={jobTitlePlaceholderLabel}
                      />
                    </div>
                  </div>

                  {formData.verificationType === 'student' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="universityName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {universityNameLabel}
                        </label>
                        <input
                          id="universityName"
                          type="text"
                          value={formData.universityName}
                          onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          placeholder={universityNamePlaceholderLabel}
                        />
                      </div>
                      <div>
                        <label htmlFor="universityEmail" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {universityEmailLabel}
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
                          {industryLabel}
                        </label>
                        <input
                          id="industry"
                          type="text"
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          placeholder={industryPlaceholderLabel}
                        />
                      </div>
                      <div>
                        <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {companyLabel}
                        </label>
                        <input
                          id="companyName"
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          placeholder={companyPlaceholderLabel}
                        />
                      </div>
                    </div>
                  )}

                  {formData.verificationType && trustBadgePreview ? (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {t.profilePreviewTitle || ''}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t.profilePreviewDescription || ''}
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
                          interactive
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
                        {t.profilePreviewDisclaimer || ''}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300"
                    >
                      {nextLabel}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {documentLabel} <span className="text-red-500">*</span>
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
                              {(t.documentsSelectedCount || '').replace('{count}', String(formData.documents.length))}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t.documentsAddMore || ''}
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              {documentUploadLabel}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {documentFormatsLabel}
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
                              aria-label={removeDocumentLabel}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {documentHintLabel}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="additionalInfo" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {additionalInfoLabel}
                    </label>
                    <textarea
                      id="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
                      placeholder={additionalInfoPlaceholderLabel}
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      {guideTitleLabel}
                    </h3>
                    <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                      <li>• {guide1Label}</li>
                      <li>• {guide2Label}</li>
                      <li>• {guide3Label}</li>
                      <li>• {guide4Label}</li>
                    </ul>
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300"
                    >
                      {previousLabel}
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || createMutation.isPending}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading || createMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {submittingLabel}
                        </span>
                      ) : (
                        submitButtonLabel
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
