'use client';

import { useRef, useState } from 'react';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';

interface VerificationRequestProps {
  onClose: () => void;
}

export default function VerificationRequest({ onClose }: VerificationRequestProps) {
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';
  const [verificationType, setVerificationType] = useState<'student' | 'resident' | ''>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [reason, setReason] = useState('');
  const requestCounterRef = useRef(0);

  const text = {
    title: locale === 'vi' ? 'Xác minh tài khoản' : locale === 'en' ? 'Account verification' : '공식 유저 인증',
    subtitle: locale === 'vi' ? 'Đăng ký xác minh sinh viên/cư trú' : locale === 'en' ? 'Apply for student/resident verification' : '유학생/거주자 인증을 신청하세요',
    typeLabel: locale === 'vi' ? 'Chọn loại xác minh' : locale === 'en' ? 'Select verification type' : '인증 유형 선택',
    studentTitle: locale === 'vi' ? 'Xác minh sinh viên' : locale === 'en' ? 'Student verification' : '유학생 인증',
    studentDesc: locale === 'vi' ? 'Giấy chứng nhận đang học, thẻ sinh viên...' : locale === 'en' ? 'Enrollment proof, student ID, etc.' : '재학증명서, 학생증 등',
    residentTitle: locale === 'vi' ? 'Xác minh cư trú' : locale === 'en' ? 'Resident verification' : '거주자 인증',
    residentDesc: locale === 'vi' ? 'Giấy chứng nhận cư trú, visa...' : locale === 'en' ? 'Residence proof, visa, etc.' : '거주증명서, 비자 등',
    uploadLabel: locale === 'vi' ? 'Tải lên hồ sơ' : locale === 'en' ? 'Upload documents' : '서류 첨부',
    uploadHint: locale === 'vi' ? 'Kéo thả hoặc bấm để tải lên' : locale === 'en' ? 'Drag & drop or click to upload' : '파일을 드래그하거나 클릭하여 업로드',
    fileSelect: locale === 'vi' ? 'Chọn tệp' : locale === 'en' ? 'Choose file' : '파일 선택',
    fileLimit: locale === 'vi' ? 'JPG, PNG, PDF, DOC (tối đa 10MB)' : locale === 'en' ? 'JPG, PNG, PDF, DOC (max 10MB)' : 'JPG, PNG, PDF, DOC (최대 10MB)',
    reasonLabel: locale === 'vi' ? 'Lý do' : locale === 'en' ? 'Reason' : '신청 사유',
    reasonPlaceholder: locale === 'vi' ? 'Hãy mô tả ngắn gọn lý do xin xác minh...' : locale === 'en' ? 'Briefly describe why you request verification...' : '인증을 신청하는 이유를 간단히 작성해주세요...',
    infoTitle: locale === 'vi' ? 'Lưu ý' : locale === 'en' ? 'Notes' : '안내사항',
    infoList: locale === 'vi'
      ? [
        'Tài liệu chỉ dùng cho mục đích xác minh',
        'Có thể mất 2-3 ngày làm việc để duyệt',
        'Thông tin cá nhân được bảo mật',
        'Tài liệu không phù hợp có thể bị từ chối'
      ]
      : locale === 'en'
        ? [
          'Documents are used only for verification',
          'Approval may take 2-3 business days',
          'Personal data is protected',
          'Inappropriate documents may be rejected'
        ]
        : [
          '제출하신 서류는 인증 목적으로만 사용됩니다',
          '승인까지 2-3 영업일이 소요될 수 있습니다',
          '개인정보는 안전하게 보호됩니다',
          '부적절한 서류 제출 시 승인이 거부될 수 있습니다'
        ],
    cancel: locale === 'vi' ? 'Hủy' : locale === 'en' ? 'Cancel' : '취소',
    submit: locale === 'vi' ? 'Gửi đăng ký' : locale === 'en' ? 'Submit' : '신청하기',
    toastType: locale === 'vi' ? 'Vui lòng chọn loại xác minh.' : locale === 'en' ? 'Please select a verification type.' : '인증 유형을 선택해주세요.',
    toastFiles: locale === 'vi' ? 'Vui lòng đính kèm hồ sơ.' : locale === 'en' ? 'Please attach documents.' : '서류를 첨부해주세요.',
    toastReason: locale === 'vi' ? 'Vui lòng nhập lý do.' : locale === 'en' ? 'Please enter a reason.' : '신청 사유를 입력해주세요.',
    toastSuccess: locale === 'vi' ? 'Đã gửi yêu cầu xác minh!' : locale === 'en' ? 'Verification request submitted!' : '인증 신청이 완료되었습니다!',
    deleteLabel: locale === 'vi' ? 'Xóa' : locale === 'en' ? 'Remove' : '삭제',
    attached: locale === 'vi' ? 'Đã tải lên' : locale === 'en' ? 'Uploaded' : '첨부됨',
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!verificationType) {
      toast.error(text.toastType);
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error(text.toastFiles);
      return;
    }

    if (!reason.trim()) {
      toast.error(text.toastReason);
      return;
    }

    // Save verification request to localStorage
    requestCounterRef.current += 1;
    const request = {
      id: requestCounterRef.current,
      type: verificationType,
      files: uploadedFiles.map(f => f.name),
      reason: reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const existingRequests = JSON.parse(localStorage.getItem('verificationRequests') || '[]');
    localStorage.setItem('verificationRequests', JSON.stringify([request, ...existingRequests]));

    toast.success(text.toastSuccess);
    onClose();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{text.title}</h2>
            <p className="text-sm text-gray-500">{text.subtitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Verification Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {text.typeLabel}
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setVerificationType('student')}
            className={`p-4 border-2 rounded-lg transition-all ${
              verificationType === 'student'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <FileText className={`h-8 w-8 mx-auto mb-2 ${
                verificationType === 'student' ? 'text-red-500' : 'text-gray-400'
              }`} />
              <h3 className="font-semibold text-gray-900">{text.studentTitle}</h3>
              <p className="text-xs text-gray-500 mt-1">{text.studentDesc}</p>
            </div>
          </button>

          <button
            onClick={() => setVerificationType('resident')}
            className={`p-4 border-2 rounded-lg transition-all ${
              verificationType === 'resident'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <FileText className={`h-8 w-8 mx-auto mb-2 ${
                verificationType === 'resident' ? 'text-red-500' : 'text-gray-400'
              }`} />
              <h3 className="font-semibold text-gray-900">{text.residentTitle}</h3>
              <p className="text-xs text-gray-500 mt-1">{text.residentDesc}</p>
            </div>
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {text.uploadLabel}
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            {text.uploadHint}
          </p>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="secondary" size="sm" className="cursor-pointer">
              {text.fileSelect}
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            {text.fileLimit}
          </p>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  {text.deleteLabel}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reason */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {text.reasonLabel}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={text.reasonPlaceholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          rows={4}
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">{text.infoTitle}</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          {text.infoList.map((line, idx) => (
            <li key={idx}>• {line}</li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={onClose}
        >
          {text.cancel}
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={handleSubmit}
        >
          {text.submit}
        </Button>
      </div>
    </div>
  );
}
