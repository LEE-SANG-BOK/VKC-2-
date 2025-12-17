'use client';

import { useState } from 'react';
import { useAdminReports } from '@/repo/admin/query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { AdminReport } from '@/repo/admin/types';
import { useSearchParams } from 'next/navigation';
import { stripHtml } from '@/utils/htmlToText';

const reportTypeLabels: Record<string, string> = {
  spam: '스팸',
  harassment: '괴롭힘',
  inappropriate: '부적절',
  misinformation: '허위정보',
  other: '기타',
};

export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const defaultStatus = searchParams?.get('status') || 'pending';
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatus);

  const { data, isLoading } = useAdminReports({
    page,
    limit: 20,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default">대기</Badge>;
      case 'reviewed':
        return <Badge variant="secondary">검토됨</Badge>;
      case 'resolved':
        return <Badge className="bg-green-600">해결됨</Badge>;
      case 'dismissed':
        return <Badge variant="outline">기각됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'spam':
        return <Badge variant="outline">{reportTypeLabels[type]}</Badge>;
      case 'harassment':
        return <Badge variant="destructive">{reportTypeLabels[type]}</Badge>;
      case 'inappropriate':
        return <Badge variant="destructive">{reportTypeLabels[type]}</Badge>;
      default:
        return <Badge variant="outline">{reportTypeLabels[type] || type}</Badge>;
    }
  };

  const getTargetInfo = (report: AdminReport) => {
    if (report.post) return { type: '게시글', title: report.post.title };
    if (report.answer) {
      const text = stripHtml(report.answer.content);
      return { type: '답변', title: text.length > 50 ? text.slice(0, 50) + '...' : text };
    }
    if (report.comment) {
      const text = stripHtml(report.comment.content);
      return { type: '댓글', title: text.length > 50 ? text.slice(0, 50) + '...' : text };
    }
    return { type: '알 수 없음', title: '' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">신고 관리</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>신고 목록</CardTitle>
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
                <SelectItem value="reviewed">검토됨</SelectItem>
                <SelectItem value="resolved">해결됨</SelectItem>
                <SelectItem value="dismissed">기각됨</SelectItem>
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
                      <TableHead>신고자</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>대상</TableHead>
                      <TableHead className="min-w-[200px]">사유</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>신고일</TableHead>
                      <TableHead className="w-[70px]">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.reports.map((report) => {
                      const target = getTargetInfo(report);
                      return (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={report.reporter?.image || undefined} />
                                <AvatarFallback>
                                  {(report.reporter?.displayName || report.reporter?.name || 'U')[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">
                                {report.reporter?.displayName || report.reporter?.name || 'Unknown'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(report.type)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs">{target.type}</Badge>
                              <p className="text-sm text-muted-foreground line-clamp-1">{target.title}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm line-clamp-2">{report.reason}</p>
                          </TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {dayjs(report.createdAt).format('YYYY.MM.DD')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/admin/reports/${report.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {data?.reports.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          신고가 없습니다
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
    </div>
  );
}
