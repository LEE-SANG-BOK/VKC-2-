'use client';

import { useEffect, useState } from 'react';
import { useAdminVerifications } from '@/repo/admin/query';
import { useUpdateVerificationStatus } from '@/repo/admin/mutation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Eye, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import dayjs from 'dayjs';
import { AdminVerification } from '@/repo/admin/types';
import { useSearchParams } from 'next/navigation';
import { type BadgeType, suggestBadgeType } from '@/lib/constants/badges';

function buildSuggestedVerifiedProfile(verification: AdminVerification): {
  summary: string;
  keywords: string[];
} {
  const type = String(verification.type || '').toLowerCase();
  const visaType = verification.visaType?.trim();
  const universityName = verification.universityName?.trim();
  const companyName = verification.companyName?.trim();
  const jobTitle = verification.jobTitle?.trim();
  const industry = verification.industry?.trim();

  const keywords: string[] = [];
  const summaryParts: string[] = [];

  if (type === 'student') {
    keywords.push('학생', '유학생');
    summaryParts.push('학생');
    if (visaType) summaryParts.push(visaType);
    if (universityName) summaryParts.push(universityName);
  } else if (type === 'worker') {
    keywords.push('직장인');
    summaryParts.push('직장인');
    if (companyName) summaryParts.push(companyName);
    if (jobTitle) summaryParts.push(jobTitle);
    if (industry) summaryParts.push(industry);
    if (visaType) summaryParts.push(visaType);
  } else if (type === 'business') {
    keywords.push('사업자');
    summaryParts.push('사업자');
    if (companyName) summaryParts.push(companyName);
    if (industry) summaryParts.push(industry);
    if (visaType) summaryParts.push(visaType);
  } else if (type === 'expert') {
    keywords.push('전문가');
    summaryParts.push('전문가');
    if (industry) summaryParts.push(industry);
    if (jobTitle) summaryParts.push(jobTitle);
    if (visaType) summaryParts.push(visaType);
  } else {
    keywords.push('인증');
    summaryParts.push('인증 사용자');
    if (visaType) summaryParts.push(visaType);
  }

  if (visaType) keywords.push(visaType);
  if (universityName) keywords.push(universityName);
  if (companyName) keywords.push(companyName);
  if (jobTitle) keywords.push(jobTitle);
  if (industry) keywords.push(industry);

  const normalizedKeywords = keywords
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .map((keyword) => keyword.replace(/^#/, ''));

  const uniqueKeywords = Array.from(new Set(normalizedKeywords)).slice(0, 12);

  return {
    summary: summaryParts.filter(Boolean).join(' · ').slice(0, 140),
    keywords: uniqueKeywords,
  };
}

function parseVerifiedProfileKeywords(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const hashtagMatches = Array.from(trimmed.matchAll(/#([^#\s]+)/g)).map((match) => match[1]);
  const tokens = hashtagMatches.length
    ? hashtagMatches
    : trimmed
        .split(/[\n,]+/)
        .map((token) => token.trim())
        .filter(Boolean);

  const normalized = tokens
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.replace(/^#/, ''));

  return Array.from(new Set(normalized)).slice(0, 12);
}

export default function AdminVerificationsPage() {
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const defaultStatus = searchParams?.get('status') || 'pending';
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatus);
  const [selectedVerification, setSelectedVerification] = useState<AdminVerification | null>(null);
  const [reason, setReason] = useState('');
  const [verifiedProfileSummary, setVerifiedProfileSummary] = useState('');
  const [verifiedProfileKeywordsInput, setVerifiedProfileKeywordsInput] = useState('');
  const [badgeType, setBadgeType] = useState<BadgeType>('verified_user');
  const [badgeExpiresAt, setBadgeExpiresAt] = useState('');
  const [validationError, setValidationError] = useState('');

  const { data, isLoading } = useAdminVerifications({
    page,
    limit: 20,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const updateStatusMutation = useUpdateVerificationStatus();

  const applySuggestedProfile = (verification: AdminVerification) => {
    const suggestion = buildSuggestedVerifiedProfile(verification);
    const suggestedBadgeType = suggestBadgeType({
      verificationType: verification.type,
      visaType: verification.visaType,
      industry: verification.industry,
      jobTitle: verification.jobTitle,
      extraInfo: verification.extraInfo,
    });
    setVerifiedProfileSummary(suggestion.summary);
    setVerifiedProfileKeywordsInput(suggestion.keywords.map((keyword) => `#${keyword}`).join(' '));
    setBadgeType(suggestedBadgeType);
  };

  const formatDateInput = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (!selectedVerification) {
      setReason('');
      setVerifiedProfileSummary('');
      setVerifiedProfileKeywordsInput('');
      setBadgeType('verified_user');
      setBadgeExpiresAt('');
      setValidationError('');
      return;
    }

    setReason('');
    setValidationError('');
    const suggestion = buildSuggestedVerifiedProfile(selectedVerification);
    const suggestedBadgeType = suggestBadgeType({
      verificationType: selectedVerification.type,
      visaType: selectedVerification.visaType,
      industry: selectedVerification.industry,
      jobTitle: selectedVerification.jobTitle,
      extraInfo: selectedVerification.extraInfo,
    });
    setVerifiedProfileSummary(suggestion.summary);
    setVerifiedProfileKeywordsInput(suggestion.keywords.map((keyword) => `#${keyword}`).join(' '));
    setBadgeType(suggestedBadgeType);
    setBadgeExpiresAt(formatDateInput(selectedVerification.user?.badgeExpiresAt));
  }, [selectedVerification?.id]);

  const parsedKeywords = parseVerifiedProfileKeywords(verifiedProfileKeywordsInput);

  const handleStatusUpdate = async (status: string) => {
    if (!selectedVerification) return;
    try {
      const normalizedSummary = verifiedProfileSummary.trim();
      const normalizedReason = reason.trim();
      const normalizedExpiry = badgeExpiresAt.trim();
      const expiryDate = normalizedExpiry ? new Date(normalizedExpiry) : null;
      const expiresAtValue = expiryDate && !Number.isNaN(expiryDate.getTime()) ? expiryDate.toISOString() : null;

      if (status === 'rejected' && !normalizedReason) {
        setValidationError('거부 사유를 입력해주세요.');
        return;
      }

      if (status === 'approved' && !normalizedSummary && parsedKeywords.length === 0) {
        setValidationError('승인 전 요약 또는 키워드를 입력해주세요.');
        return;
      }
      if (status === 'approved' && normalizedExpiry && !expiresAtValue) {
        setValidationError('만료 날짜 형식을 확인해주세요.');
        return;
      }
      setValidationError('');

      await updateStatusMutation.mutateAsync({
        id: selectedVerification.id,
        data: {
          status,
          reason: status === 'rejected' ? normalizedReason : undefined,
          badgeType: status === 'approved' ? badgeType : undefined,
          badgeExpiresAt: status === 'approved' ? expiresAtValue : undefined,
          verifiedProfileSummary: status === 'approved' ? (normalizedSummary ? normalizedSummary : null) : undefined,
          verifiedProfileKeywords: status === 'approved' ? (parsedKeywords.length ? parsedKeywords : null) : undefined,
        },
      });
      setSelectedVerification(null);
      setReason('');
    } catch (error) {
      console.error('Failed to update verification:', error);
    }
  };

  const badgeTypeLabels: Record<BadgeType, string> = {
    verified_student: '학생 인증',
    verified_worker: '직장/재직 인증',
    verified_user: '인증 사용자',
    expert: '전문가',
    expert_visa: '비자 전문가',
    expert_employment: '취업 전문가',
    trusted_answerer: '신뢰 답변자',
  };

  const badgeOptionsFor = (verificationType: string): BadgeType[] => {
    const normalized = verificationType.toLowerCase();
    if (normalized === 'student') return ['verified_student'];
    if (normalized === 'worker' || normalized === 'business') return ['verified_worker'];
    if (normalized === 'expert') return ['expert_visa', 'expert_employment', 'expert'];
    return ['verified_user', 'trusted_answerer'];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default">대기</Badge>;
      case 'approved':
        return <Badge className="bg-green-600">승인됨</Badge>;
      case 'rejected':
        return <Badge variant="destructive">거부됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">인증 관리</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>인증 요청</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="rejected">거부됨</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>유저</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>문서</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>제출일</TableHead>
                      <TableHead className="w-[70px]">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.verifications.map((verification) => (
                      <TableRow key={verification.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={verification.user?.image || undefined} />
                              <AvatarFallback>
                                {(verification.user?.displayName || verification.user?.name || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {verification.user?.displayName || verification.user?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {verification.user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{verification.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {verification.documentUrls?.length || 0}개 파일
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(verification.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {dayjs(verification.submittedAt).format('YYYY.MM.DD')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedVerification(verification)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data?.verifications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          인증 요청이 없습니다
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {data.pagination.page} / {data.pagination.totalPages} 페이지 (총 {data.pagination.total}건)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.pagination.totalPages}
                    >
                      다음
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>인증 요청 검토</DialogTitle>
            <DialogDescription>
              제출된 문서를 검토하고 승인 또는 거부하세요
            </DialogDescription>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">유저</p>
                  <p className="font-medium">
                    {selectedVerification.user?.displayName || selectedVerification.user?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedVerification.user?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">유형</p>
                  <p>{selectedVerification.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">상태</p>
                  <p>{selectedVerification.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">제출일</p>
                  <p>{dayjs(selectedVerification.submittedAt).format('YYYY.MM.DD HH:mm')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">비자 타입</p>
                  <p>{selectedVerification.visaType || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">추가 정보</p>
                  <p>{selectedVerification.extraInfo || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">대학 / 이메일</p>
                  <p>
                    {selectedVerification.universityName || '-'}
                    {selectedVerification.universityEmail ? ` (${selectedVerification.universityEmail})` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">산업 / 회사 / 직무</p>
                  <p>
                    {[selectedVerification.industry, selectedVerification.companyName, selectedVerification.jobTitle]
                      .filter(Boolean)
                      .join(' / ') || '-'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-2">문서</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedVerification.documentUrls?.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">문서 {index + 1}</span>
                    </a>
                  )) || (
                    <p className="text-sm text-muted-foreground col-span-2">업로드된 문서가 없습니다</p>
                  )}
                </div>
              </div>

              {selectedVerification.status === 'pending' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">프로필 인증 정보</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applySuggestedProfile(selectedVerification)}
                    >
                      자동 제안 적용
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="badgeType">배지 타입</Label>
                    <Select
                      value={badgeType}
                      onValueChange={(value) => setBadgeType(value as BadgeType)}
                    >
                      <SelectTrigger id="badgeType" className="mt-1">
                        <SelectValue placeholder="배지 타입 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {badgeOptionsFor(selectedVerification.type).map((option) => (
                          <SelectItem key={option} value={option}>
                            {badgeTypeLabels[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="badgeExpiresAt">배지 만료일</Label>
                    <Input
                      id="badgeExpiresAt"
                      type="date"
                      value={badgeExpiresAt}
                      onChange={(e) => {
                        setBadgeExpiresAt(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="verifiedProfileSummary">요약</Label>
                    <Textarea
                      id="verifiedProfileSummary"
                      value={verifiedProfileSummary}
                      onChange={(e) => {
                        setVerifiedProfileSummary(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                      className="mt-1"
                      placeholder="예: D-2 유학생 · 연세대학교 재학"
                    />
                  </div>

                  <div>
                    <Label htmlFor="verifiedProfileKeywords">키워드</Label>
                    <Input
                      id="verifiedProfileKeywords"
                      value={verifiedProfileKeywordsInput}
                      onChange={(e) => {
                        setVerifiedProfileKeywordsInput(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                      className="mt-1"
                      placeholder="#학생 #D-2 #연세대"
                    />
                    {parsedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {parsedKeywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            #{keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="reason">거부 사유</Label>
                    <Textarea
                      id="reason"
                      placeholder="거부 시 사유를 입력하세요..."
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {selectedVerification.reason && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">이전 사유</p>
                  <p className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    {selectedVerification.reason}
                  </p>
                </div>
              )}
            </div>
          )}
          {validationError ? (
            <p className="text-sm text-red-600">{validationError}</p>
          ) : null}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedVerification(null)}>
              취소
            </Button>
            {selectedVerification?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updateStatusMutation.isPending}
                >
                  거부
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updateStatusMutation.isPending}
                >
                  승인
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
