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
  const fallback = useMemo(() => {
    if (lang === 'en') {
      return {
        documentLimitError: 'You can attach up to 5 documents.',
        validationError: 'Please select a verification type and documents.',
        uploadError: 'Failed to upload file.',
        urlError: 'Failed to retrieve file path.',
        submitSuccess: 'Verification request submitted!\nWe will notify you after review.',
        submitError: 'Failed to submit verification request.',
        cancelConfirm: 'You have unsaved changes. Are you sure you want to cancel?',
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
        alreadyVerifiedTitle: 'Already verified',
        alreadyVerifiedMessage: 'Your profile now shows a verified badge.',
        pendingRequestTitle: 'A request is under review',
        pendingRequestMessage: 'You already have a pending request. Please wait for review to complete.',
        historyTitle: 'Requests',
        historyCount: 'Total {count}',
        noHistoryTitle: 'No requests yet',
        noHistoryDescription: 'Apply for verification to boost trust.',
        applyVerification: 'Apply for verification',
        submitted: 'Submitted',
        reviewed: 'Reviewed',
        rejectionReason: 'Rejection reason',
        pendingMessage: 'Under review. It takes 1–3 business days.',
        approvedMessage: 'Approved. A verified badge will appear on your profile.',
        pageTitle: 'Verification request',
        pageDescription: 'Apply for expert verification.',
        typeLabel: 'Verification type',
        typePlaceholder: 'Select a verification type',
        visaTypeLabel: 'Visa type',
        visaTypePlaceholder: 'e.g., D-2, D-10, E-7-1, F-2-7',
        jobTitleLabel: 'Job title (optional)',
        jobTitlePlaceholder: 'e.g., Frontend developer, student',
        universityNameLabel: 'University/School name',
        universityNamePlaceholder: 'e.g., Pusan National University',
        universityEmailLabel: 'School email',
        industryLabel: 'Industry',
        industryPlaceholder: 'e.g., Manufacturing, IT, Service',
        companyLabel: 'Company name',
        companyPlaceholder: 'e.g., K-Tech',
        documentLabel: 'Supporting documents',
        documentUpload: 'Click or drag files to upload',
        documentFormats: 'JPG, PNG, PDF (max 10MB)',
        removeDocument: 'Remove document',
        documentHint: '※ Attach documents such as student ID, employment certificate, or licenses.',
        additionalInfoLabel: 'Additional info (optional)',
        additionalInfoPlaceholder: 'Add extra details related to verification',
        guideTitle: '📌 Verification review guide',
        guide1: 'Review takes 1–3 business days.',
        guide2: 'Submitted documents are used only for verification and stored securely.',
        guide3: 'Once approved, a verified badge appears on your profile.',
        guide4: 'We will contact you by email if more documents are needed.',
        submitting: 'Submitting...',
        submitButton: 'Submit verification request',
        studentRequiredError: 'Student verification requires a university name or school email.',
        workerRequiredError: 'Worker verification requires industry or company name.',
        documentRequiredError: 'Please attach verification documents.',
        documentNotOwnedError: 'Only documents you uploaded can be attached.',
        alreadyVerifiedError: 'Already verified.',
        pendingRequestError: 'A request is already under review.',
      };
    }
    if (lang === 'vi') {
      return {
        documentLimitError: 'Bạn chỉ có thể đính kèm tối đa 5 tài liệu.',
        validationError: 'Vui lòng chọn loại xác minh và tài liệu.',
        uploadError: 'Tải tệp lên thất bại.',
        urlError: 'Không lấy được đường dẫn tệp.',
        submitSuccess: 'Đã gửi yêu cầu xác minh!\nChúng tôi sẽ thông báo sau khi xét duyệt.',
        submitError: 'Không thể gửi yêu cầu xác minh.',
        cancelConfirm: 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy không?',
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
        historyPageDescription: 'Xem và quản lý các yêu cầu xác minh.',
        alreadyVerifiedTitle: 'Đã xác minh',
        alreadyVerifiedMessage: 'Huy hiệu xác minh đã hiển thị trên hồ sơ của bạn.',
        pendingRequestTitle: 'Đang có yêu cầu xét duyệt',
        pendingRequestMessage: 'Bạn đã có yêu cầu đang xét duyệt. Vui lòng chờ hoàn tất.',
        historyTitle: 'Lịch sử',
        historyCount: 'Tổng {count}',
        noHistoryTitle: 'Chưa có yêu cầu',
        noHistoryDescription: 'Hãy gửi yêu cầu xác minh để tăng độ tin cậy.',
        applyVerification: 'Gửi yêu cầu xác minh',
        submitted: 'Đã gửi',
        reviewed: 'Đã xét',
        rejectionReason: 'Lý do từ chối',
        pendingMessage: 'Đang xét duyệt. Mất 1–3 ngày làm việc.',
        approvedMessage: 'Đã duyệt. Huy hiệu xác minh sẽ hiển thị trên hồ sơ.',
        pageTitle: 'Yêu cầu xác minh',
        pageDescription: 'Gửi yêu cầu xác minh chuyên gia.',
        typeLabel: 'Loại xác minh',
        typePlaceholder: 'Chọn loại xác minh',
        visaTypeLabel: 'Loại visa',
        visaTypePlaceholder: 'VD: D-2, D-10, E-7-1, F-2-7',
        jobTitleLabel: 'Chức danh (tuỳ chọn)',
        jobTitlePlaceholder: 'VD: Lập trình viên Frontend, sinh viên',
        universityNameLabel: 'Tên trường',
        universityNamePlaceholder: 'VD: Đại học Pusan',
        universityEmailLabel: 'Email trường',
        industryLabel: 'Ngành nghề',
        industryPlaceholder: 'VD: Sản xuất, IT, Dịch vụ',
        companyLabel: 'Tên công ty',
        companyPlaceholder: 'VD: K-Tech',
        documentLabel: 'Tài liệu chứng minh',
        documentUpload: 'Nhấp hoặc kéo thả tệp để tải lên',
        documentFormats: 'JPG, PNG, PDF (tối đa 10MB)',
        removeDocument: 'Xoá tài liệu',
        documentHint: '※ Đính kèm thẻ sinh viên, giấy xác nhận công việc, chứng chỉ, v.v.',
        additionalInfoLabel: 'Thông tin bổ sung (tuỳ chọn)',
        additionalInfoPlaceholder: 'Nhập thông tin bổ sung liên quan đến xác minh',
        guideTitle: '📌 Hướng dẫn xét duyệt',
        guide1: 'Xét duyệt mất 1–3 ngày làm việc.',
        guide2: 'Tài liệu chỉ dùng cho xác minh và được lưu trữ an toàn.',
        guide3: 'Khi được duyệt, huy hiệu xác minh sẽ hiển thị trên hồ sơ.',
        guide4: 'Chúng tôi sẽ liên hệ qua email nếu cần thêm tài liệu.',
        submitting: 'Đang xử lý...',
        submitButton: 'Gửi yêu cầu xác minh',
        studentRequiredError: 'Xác minh sinh viên cần tên trường hoặc email trường.',
        workerRequiredError: 'Xác minh người đi làm cần ngành nghề hoặc tên công ty.',
        documentRequiredError: 'Vui lòng đính kèm tài liệu xác minh.',
        documentNotOwnedError: 'Chỉ có thể đính kèm tài liệu do bạn tải lên.',
        alreadyVerifiedError: 'Đã xác minh.',
        pendingRequestError: 'Đã có yêu cầu đang xét duyệt.',
      };
    }
    return {
      documentLimitError: '서류는 최대 5개까지 첨부할 수 있습니다.',
      validationError: '인증 유형과 증빙 서류를 선택해주세요.',
      uploadError: '파일 업로드에 실패했습니다.',
      urlError: '파일 경로를 받지 못했습니다.',
      submitSuccess: '인증 신청이 완료되었습니다!\n관리자 검토 후 결과를 알려드립니다.',
      submitError: '인증 신청 중 오류가 발생했습니다.',
      cancelConfirm: '작성 중인 내용이 있습니다. 정말 취소하시겠습니까?',
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
      alreadyVerifiedTitle: '이미 인증되었습니다',
      alreadyVerifiedMessage: '인증이 승인되어 프로필에 인증 배지가 표시됩니다.',
      pendingRequestTitle: '검토 중인 신청이 있습니다',
      pendingRequestMessage: '이미 검토 중인 인증 신청이 있습니다. 검토가 완료된 후 다시 신청해주세요.',
      historyTitle: '신청 내역',
      historyCount: '총 {count}건',
      noHistoryTitle: '신청 내역이 없습니다',
      noHistoryDescription: '전문가 인증을 신청하여 신뢰도를 높여보세요',
      applyVerification: '인증 신청하기',
      submitted: '신청',
      reviewed: '검토',
      rejectionReason: '반려 사유',
      pendingMessage: '관리자가 검토 중입니다. 영업일 기준 1~3일 소요됩니다.',
      approvedMessage: '인증이 승인되었습니다. 프로필에 인증 배지가 표시됩니다.',
      pageTitle: '인증 신청',
      pageDescription: '전문가 인증을 신청하세요',
      typeLabel: '인증 유형',
      typePlaceholder: '인증 유형을 선택하세요',
      visaTypeLabel: '비자 종류',
      visaTypePlaceholder: '예: D-2, D-10, E-7-1, F-2-7',
      jobTitleLabel: '직무/포지션 (선택)',
      jobTitlePlaceholder: '예: 프론트엔드 개발자, 유학생',
      universityNameLabel: '대학/학교명',
      universityNamePlaceholder: '예: 부산대학교',
      universityEmailLabel: '학교 이메일',
      industryLabel: '산업 분야',
      industryPlaceholder: '예: 제조, IT, 서비스',
      companyLabel: '회사명',
      companyPlaceholder: '예: K-Tech',
      documentLabel: '증빙 서류',
      documentUpload: '클릭하거나 파일을 드래그하여 업로드',
      documentFormats: 'JPG, PNG, PDF (최대 10MB)',
      removeDocument: '서류 삭제',
      documentHint: '※ 학생증, 재직증명서, 자격증 등 인증을 위한 서류를 첨부해주세요',
      additionalInfoLabel: '추가 정보 (선택)',
      additionalInfoPlaceholder: '인증과 관련된 추가 정보를 입력해주세요',
      guideTitle: '📌 인증 심사 안내',
      guide1: '인증 심사는 영업일 기준 1~3일 소요됩니다.',
      guide2: '제출하신 서류는 인증 목적으로만 사용되며, 안전하게 보관됩니다.',
      guide3: '인증이 승인되면 프로필에 인증 배지가 표시됩니다.',
      guide4: '추가 서류가 필요한 경우 이메일로 연락드립니다.',
      submitting: '처리 중...',
      submitButton: '인증 신청하기',
      studentRequiredError: '학생 인증은 대학명 또는 학교 이메일이 필요합니다.',
      workerRequiredError: '직장인 인증은 산업 분야 또는 회사명이 필요합니다.',
      documentRequiredError: '인증 서류를 다시 첨부해주세요.',
      documentNotOwnedError: '본인이 업로드한 서류만 첨부할 수 있습니다.',
      alreadyVerifiedError: '이미 인증이 완료되었습니다.',
      pendingRequestError: '이미 검토 중인 인증 요청이 있습니다.',
    };
  }, [lang]);
  const documentLimitError = t.documentLimitError || fallback.documentLimitError;
  const validationError = t.validationError || fallback.validationError;
  const uploadError = t.uploadError || fallback.uploadError;
  const urlError = t.urlError || fallback.urlError;
  const submitSuccessLabel = t.submitSuccess || fallback.submitSuccess;
  const submitErrorLabel = t.submitError || fallback.submitError;
  const cancelConfirmLabel = t.cancelConfirm || fallback.cancelConfirm;
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
  const alreadyVerifiedTitle = t.alreadyVerifiedTitle || fallback.alreadyVerifiedTitle;
  const alreadyVerifiedMessage = t.alreadyVerifiedMessage || fallback.alreadyVerifiedMessage;
  const pendingRequestTitle = t.pendingRequestTitle || fallback.pendingRequestTitle;
  const pendingRequestMessage = t.pendingRequestMessage || fallback.pendingRequestMessage;
  const historyTitle = t.historyTitle || fallback.historyTitle;
  const historyCountLabel = t.historyCount || fallback.historyCount;
  const noHistoryTitle = t.noHistoryTitle || fallback.noHistoryTitle;
  const noHistoryDescription = t.noHistoryDescription || fallback.noHistoryDescription;
  const applyVerificationLabel = t.applyVerification || fallback.applyVerification;
  const submittedLabel = t.submitted || fallback.submitted;
  const reviewedLabel = t.reviewed || fallback.reviewed;
  const rejectionReasonLabel = t.rejectionReason || fallback.rejectionReason;
  const pendingMessageLabel = t.pendingMessage || fallback.pendingMessage;
  const approvedMessageLabel = t.approvedMessage || fallback.approvedMessage;
  const pageTitleLabel = t.pageTitle || fallback.pageTitle;
  const pageDescriptionLabel = t.pageDescription || fallback.pageDescription;
  const typeLabel = t.typeLabel || fallback.typeLabel;
  const typePlaceholderLabel = t.typePlaceholder || fallback.typePlaceholder;
  const visaTypeLabel = t.visaTypeLabel || fallback.visaTypeLabel;
  const visaTypePlaceholderLabel = t.visaTypePlaceholder || fallback.visaTypePlaceholder;
  const jobTitleLabel = t.jobTitleLabel || fallback.jobTitleLabel;
  const jobTitlePlaceholderLabel = t.jobTitlePlaceholder || fallback.jobTitlePlaceholder;
  const universityNameLabel = t.universityNameLabel || fallback.universityNameLabel;
  const universityNamePlaceholderLabel = t.universityNamePlaceholder || fallback.universityNamePlaceholder;
  const universityEmailLabel = t.universityEmailLabel || fallback.universityEmailLabel;
  const industryLabel = t.industryLabel || fallback.industryLabel;
  const industryPlaceholderLabel = t.industryPlaceholder || fallback.industryPlaceholder;
  const companyLabel = t.companyLabel || fallback.companyLabel;
  const companyPlaceholderLabel = t.companyPlaceholder || fallback.companyPlaceholder;
  const documentLabel = t.documentLabel || fallback.documentLabel;
  const documentUploadLabel = t.documentUpload || fallback.documentUpload;
  const documentFormatsLabel = t.documentFormats || fallback.documentFormats;
  const removeDocumentLabel = t.removeDocument || fallback.removeDocument;
  const documentHintLabel = t.documentHint || fallback.documentHint;
  const additionalInfoLabel = t.additionalInfoLabel || fallback.additionalInfoLabel;
  const additionalInfoPlaceholderLabel = t.additionalInfoPlaceholder || fallback.additionalInfoPlaceholder;
  const guideTitleLabel = t.guideTitle || fallback.guideTitle;
  const guide1Label = t.guide1 || fallback.guide1;
  const guide2Label = t.guide2 || fallback.guide2;
  const guide3Label = t.guide3 || fallback.guide3;
  const guide4Label = t.guide4 || fallback.guide4;
  const submittingLabel = t.submitting || fallback.submitting;
  const submitButtonLabel = t.submitButton || fallback.submitButton;
  const alreadyVerifiedErrorLabel = t.alreadyVerifiedMessage || fallback.alreadyVerifiedError;
  const pendingRequestErrorLabel = t.pendingRequestMessage || fallback.pendingRequestError;
  const studentRequiredErrorLabel = t.studentRequiredError || fallback.studentRequiredError;
  const workerRequiredErrorLabel = t.workerRequiredError || fallback.workerRequiredError;
  const documentRequiredErrorLabel = t.documentRequiredError || fallback.documentRequiredError;
  const documentNotOwnedErrorLabel = t.documentNotOwnedError || fallback.documentNotOwnedError;

  const stepInfoLabel =
    t.stepInfo || (lang === 'vi' ? 'Thông tin' : lang === 'en' ? 'Details' : '정보 입력');
  const stepDocumentsLabel =
    t.stepDocuments || (lang === 'vi' ? 'Tài liệu' : lang === 'en' ? 'Documents' : '서류 업로드');
  const stepStatusLabel =
    t.stepStatus || (lang === 'vi' ? 'Trạng thái' : lang === 'en' ? 'Status' : '상태 확인');
  const nextLabel = tCommon.next || (lang === 'vi' ? 'Tiếp theo' : lang === 'en' ? 'Next' : '다음');
  const previousLabel = tCommon.previous || (lang === 'vi' ? 'Trước' : lang === 'en' ? 'Previous' : '이전');
  const typeStepValidation =
    t.typeValidationError ||
    (lang === 'vi'
      ? 'Vui lòng chọn loại xác minh.'
      : lang === 'en'
        ? 'Select a verification type.'
        : '인증 유형을 선택해주세요.');
  const newRequestLabel =
    t.newRequest || (lang === 'vi' ? 'Yêu cầu mới' : lang === 'en' ? 'New request' : '새 인증 신청');
  const reapplyLabel =
    t.reapplyButton || (lang === 'vi' ? 'Sửa và gửi lại' : lang === 'en' ? 'Edit & reapply' : '수정해서 다시 신청');
  const steps = [
    { id: 1, label: stepInfoLabel },
    { id: 2, label: stepDocumentsLabel },
    { id: 3, label: stepStatusLabel },
  ];

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

        if (!uploadRes.ok) {
          throw new Error(uploadError);
        }

        const uploadData = await uploadRes.json();
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
                        {t.profilePreviewDisclaimer ||
                          (lang === 'vi'
                            ? 'Quản trị viên có thể chỉnh sửa nội dung hiển thị sau khi xác minh.'
                            : lang === 'en'
                              ? 'Admins may adjust what is shown after review.'
                              : '관리자 검토 과정에서 표시 내용이 일부 수정될 수 있어요.')}
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
