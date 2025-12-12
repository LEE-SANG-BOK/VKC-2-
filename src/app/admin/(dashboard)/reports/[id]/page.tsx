'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminReport } from '@/repo/admin/query';
import { useUpdateReportStatus, useUpdateUserStatus } from '@/repo/admin/mutation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  Calendar,
  Shield,
  AlertTriangle,
  FileText,
  User,
  Ban,
} from 'lucide-react';
import dayjs from 'dayjs';

export default function AdminReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const { data, isLoading } = useAdminReport(reportId);
  const updateReportMutation = useUpdateReportStatus();
  const updateUserStatusMutation = useUpdateUserStatus();

  const [reviewNote, setReviewNote] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [suspendDays, setSuspendDays] = useState<number>(7);

  const report = data?.report;

  const handleResolve = async () => {
    try {
      await updateReportMutation.mutateAsync({
        id: reportId,
        data: { status: 'resolved', reviewNote, deleteTarget },
      });
      router.push('/admin/reports');
    } catch (error) {
      console.error('Failed to resolve report:', error);
    }
  };

  const handleDismiss = async () => {
    try {
      await updateReportMutation.mutateAsync({
        id: reportId,
        data: { status: 'dismissed', reviewNote },
      });
      router.push('/admin/reports');
    } catch (error) {
      console.error('Failed to dismiss report:', error);
    }
  };

  const handleSuspendUser = async () => {
    if (!report?.reportedUser?.id) return;
    try {
      await updateUserStatusMutation.mutateAsync({
        id: report.reportedUser.id,
        status: 'suspended',
        suspendDays,
      });
      setSuspendDialogOpen(false);
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleBanUser = async () => {
    if (!report?.reportedUser?.id) return;
    try {
      await updateUserStatusMutation.mutateAsync({
        id: report.reportedUser.id,
        status: 'banned',
      });
      setBanDialogOpen(false);
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleActivateUser = async () => {
    if (!report?.reportedUser?.id) return;
    try {
      await updateUserStatusMutation.mutateAsync({
        id: report.reportedUser.id,
        status: 'active',
      });
    } catch (error) {
      console.error('Failed to activate user:', error);
    }
  };

  const getReportTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-100 text-yellow-800',
      harassment: 'bg-red-100 text-red-800',
      inappropriate: 'bg-orange-100 text-orange-800',
      misinformation: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={colors[type] || colors.other}>{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">대기</Badge>;
      case 'reviewed':
        return <Badge variant="secondary">검토됨</Badge>;
      case 'resolved':
        return <Badge variant="default">해결됨</Badge>;
      case 'dismissed':
        return <Badge variant="outline">기각됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserStatusBadge = (status: string | null, suspendedUntil?: string | null) => {
    switch (status) {
      case 'suspended':
        return (
          <Badge variant="destructive">
            정지 {suspendedUntil && `(~${dayjs(suspendedUntil).format('MM.DD')})`}
          </Badge>
        );
      case 'banned':
        return <Badge variant="destructive">밴</Badge>;
      default:
        return <Badge variant="secondary">활성</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">신고를 찾을 수 없습니다</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/reports')}>
          신고 목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/reports')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">신고 상세</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>신고 정보</CardTitle>
                <div className="flex gap-2">
                  {getReportTypeBadge(report.type)}
                  {getStatusBadge(report.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">신고 사유</p>
                <p className="text-sm">{report.reason}</p>
              </div>

              <div className="flex gap-8">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">신고일</p>
                  <p className="text-sm">{dayjs(report.createdAt).format('YYYY.MM.DD HH:mm')}</p>
                </div>
                {report.reporter && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">신고자</p>
                    <Link
                      href={`/admin/users/${report.reporter.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {report.reporter.displayName || report.reporter.name || report.reporter.email}
                    </Link>
                  </div>
                )}
              </div>

              {report.reviewNote && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">검토 노트</p>
                  <p className="text-sm">{report.reviewNote}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  신고된 콘텐츠
                </CardTitle>
                {report.linkedPostId && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/ko/posts/${report.linkedPostId}`} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      게시글 보기
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {report.targetContent ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{report.targetContent.type}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {dayjs(report.targetContent.createdAt).format('YYYY.MM.DD HH:mm')}
                    </span>
                  </div>
                  {report.targetContent.title && (
                    <h3 className="font-medium">{report.targetContent.title}</h3>
                  )}
                  <div
                    className="text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-[300px] overflow-y-auto"
                    dangerouslySetInnerHTML={{
                      __html: report.targetContent.content || report.targetContent.title || '',
                    }}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">콘텐츠가 삭제되었습니다</p>
              )}
            </CardContent>
          </Card>

          {report.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>조치</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">검토 노트 (선택)</label>
                  <Textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="이 신고에 대한 메모를 추가하세요..."
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="deleteTarget"
                    checked={deleteTarget}
                    onChange={(e) => setDeleteTarget(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="deleteTarget" className="text-sm">
                    해결 시 신고된 콘텐츠 삭제
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleResolve}
                    disabled={updateReportMutation.isPending}
                  >
                    해결
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDismiss}
                    disabled={updateReportMutation.isPending}
                  >
                    기각
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                피신고자
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.reportedUser ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={report.reportedUser.image || undefined} />
                      <AvatarFallback className="text-lg">
                        {(report.reportedUser.displayName || report.reportedUser.name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/admin/users/${report.reportedUser.id}`}
                        className="font-medium hover:underline"
                      >
                        {report.reportedUser.displayName || report.reportedUser.name || 'Unknown'}
                      </Link>
                      <div className="flex gap-2 mt-1">
                        {getUserStatusBadge(report.reportedUser.status, report.reportedUser.suspendedUntil)}
                        {report.reportedUser.isVerified && (
                          <Badge variant="default">인증됨</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{report.reportedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>가입일 {dayjs(report.reportedUser.createdAt).format('YYYY.MM.DD')}</span>
                    </div>
                  </div>

                  {report.reportedUser.stats && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{report.reportedUser.stats.postsCount}</p>
                        <p className="text-sm text-muted-foreground">게시글</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {report.reportedUser.stats.reportsReceivedCount}
                        </p>
                        <p className="text-sm text-muted-foreground">받은 신고</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      유저 액션
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {report.reportedUser.status === 'suspended' || report.reportedUser.status === 'banned' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleActivateUser}
                          disabled={updateUserStatusMutation.isPending}
                        >
                          활성화
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSuspendDialogOpen(true)}
                            disabled={updateUserStatusMutation.isPending}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            정지
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setBanDialogOpen(true)}
                            disabled={updateUserStatusMutation.isPending}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            밴
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">유저를 찾을 수 없거나 삭제되었습니다</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>유저 정지</AlertDialogTitle>
            <AlertDialogDescription>
              정지 기간을 선택하세요. 기간이 만료되면 자동으로 활성화됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={String(suspendDays)}
              onValueChange={(v) => setSuspendDays(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="기간 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1일</SelectItem>
                <SelectItem value="3">3일</SelectItem>
                <SelectItem value="7">7일</SelectItem>
                <SelectItem value="14">14일</SelectItem>
                <SelectItem value="30">30일</SelectItem>
                <SelectItem value="90">90일</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendUser}
              disabled={updateUserStatusMutation.isPending}
            >
              정지
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>유저 밴</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 유저를 영구적으로 밴하시겠습니까? 게시글이나 댓글을 작성할 수 없게 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={updateUserStatusMutation.isPending}
            >
              영구 밴
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
