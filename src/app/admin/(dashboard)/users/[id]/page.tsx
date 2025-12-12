'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useAdminUser,
  useAdminUserPosts,
  useAdminUserComments,
  useAdminUserReportsReceived,
  useAdminUserReportsMade,
} from '@/repo/admin/query';
import { useUpdateUserStatus, useDeleteUser } from '@/repo/admin/mutation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  Shield,
  FileText,
  MessageSquare,
  AlertTriangle,
  Flag,
  ExternalLink,
} from 'lucide-react';
import dayjs from 'dayjs';
import Link from 'next/link';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [activeTab, setActiveTab] = useState('posts');
  const [postsPage, setPostsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [reportsReceivedPage, setReportsReceivedPage] = useState(1);
  const [reportsMadePage, setReportsMadePage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendDays, setSuspendDays] = useState<number>(7);

  const { data: userData, isLoading: userLoading } = useAdminUser(userId);
  const { data: postsData, isLoading: postsLoading } = useAdminUserPosts(userId, { page: postsPage, limit: 10 });
  const { data: commentsData, isLoading: commentsLoading } = useAdminUserComments(userId, { page: commentsPage, limit: 10 });
  const { data: reportsReceivedData, isLoading: reportsReceivedLoading } = useAdminUserReportsReceived(userId, { page: reportsReceivedPage, limit: 10 });
  const { data: reportsMadeData, isLoading: reportsMadeLoading } = useAdminUserReportsMade(userId, { page: reportsMadePage, limit: 10 });

  const updateStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  const user = userData?.user;

  const handleStatusChange = async (newStatus: string, days?: number) => {
    try {
      await updateStatusMutation.mutateAsync({ id: userId, status: newStatus, suspendDays: days });
      setSuspendDialogOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      router.push('/admin/users');
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const getStatusBadge = (status: string | null, suspendedUntil?: string | null) => {
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

  const getReportStatusBadge = (status: string) => {
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

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">유저를 찾을 수 없습니다</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/users')}>
          유저 목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">유저 상세</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>프로필</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-2xl">
                  {(user.displayName || user.name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">
                {user.displayName || user.name || 'Unknown'}
              </h2>
              {user.bio && (
                <p className="mt-2 text-sm text-muted-foreground">{user.bio}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {getStatusBadge(user.status, user.suspendedUntil)}
                {user.isVerified && <Badge variant="default">인증됨</Badge>}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>가입일 {dayjs(user.createdAt).format('YYYY.MM.DD')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>프로필 {user.isProfileComplete ? '완료' : '미완료'}</span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <p className="text-sm font-medium">액션</p>
              <div className="flex flex-wrap gap-2">
                {user.status === 'suspended' || user.status === 'banned' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange('active')}
                    disabled={updateStatusMutation.isPending}
                  >
                    활성화
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSuspendDialogOpen(true)}
                      disabled={updateStatusMutation.isPending}
                    >
                      정지
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('banned')}
                      disabled={updateStatusMutation.isPending}
                    >
                      밴
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  삭제
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>활동</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="posts" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">게시글</span>
                  <Badge variant="secondary" className="ml-1">
                    {postsData?.pagination?.total || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">댓글</span>
                  <Badge variant="secondary" className="ml-1">
                    {commentsData?.pagination?.total || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="reports-received" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">받은 신고</span>
                  <Badge variant="secondary" className="ml-1">
                    {reportsReceivedData?.pagination?.total || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="reports-made" className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  <span className="hidden sm:inline">한 신고</span>
                  <Badge variant="secondary" className="ml-1">
                    {reportsMadeData?.pagination?.total || 0}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-4">
                {postsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>제목</TableHead>
                            <TableHead>유형</TableHead>
                            <TableHead>조회</TableHead>
                            <TableHead>좋아요</TableHead>
                            <TableHead>작성일</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {postsData?.posts.map((post) => (
                            <TableRow key={post.id}>
                              <TableCell className="max-w-[200px] truncate font-medium">
                                <Link
                                  href={`/ko/posts/${post.id}`}
                                  target="_blank"
                                  className="hover:underline"
                                >
                                  {post.title}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge variant={post.type === 'question' ? 'default' : 'secondary'}>
                                  {post.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{post.views}</TableCell>
                              <TableCell>{post.likesCount}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {dayjs(post.createdAt).format('YYYY.MM.DD')}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/ko/posts/${post.id}`} target="_blank">
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {postsData?.posts.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                게시글이 없습니다
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {postsData?.pagination && postsData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Page {postsData.pagination.page} of {postsData.pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                            disabled={postsPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPostsPage((p) => p + 1)}
                            disabled={postsPage >= postsData.pagination.totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="comments" className="mt-4">
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>내용</TableHead>
                            <TableHead>게시글</TableHead>
                            <TableHead>좋아요</TableHead>
                            <TableHead>작성일</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commentsData?.comments.map((comment) => (
                            <TableRow key={comment.id}>
                              <TableCell className="max-w-[200px] truncate">
                                {comment.content}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate text-muted-foreground">
                                {comment.post ? (
                                  <Link
                                    href={`/ko/posts/${comment.post.id}`}
                                    target="_blank"
                                    className="hover:underline"
                                  >
                                    {comment.post.title}
                                  </Link>
                                ) : '-'}
                              </TableCell>
                              <TableCell>{comment.likesCount}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {dayjs(comment.createdAt).format('YYYY.MM.DD')}
                              </TableCell>
                              <TableCell>
                                {comment.postId && (
                                  <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/ko/posts/${comment.postId}`} target="_blank">
                                      <ExternalLink className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {commentsData?.comments.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                댓글이 없습니다
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {commentsData?.pagination && commentsData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Page {commentsData.pagination.page} of {commentsData.pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}
                            disabled={commentsPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCommentsPage((p) => p + 1)}
                            disabled={commentsPage >= commentsData.pagination.totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="reports-received" className="mt-4">
                {reportsReceivedLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>유형</TableHead>
                            <TableHead>대상</TableHead>
                            <TableHead>사유</TableHead>
                            <TableHead>상태</TableHead>
                            <TableHead>날짜</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportsReceivedData?.reports.map((report) => (
                            <TableRow key={report.id}>
                              <TableCell>{getReportTypeBadge(report.type)}</TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                <span className="text-muted-foreground text-xs">[{report.targetType}]</span>{' '}
                                {report.postId ? (
                                  <Link
                                    href={`/ko/posts/${report.postId}`}
                                    target="_blank"
                                    className="hover:underline"
                                  >
                                    {report.targetTitle}
                                  </Link>
                                ) : report.targetTitle}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                {report.reason}
                              </TableCell>
                              <TableCell>{getReportStatusBadge(report.status)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {dayjs(report.createdAt).format('YYYY.MM.DD')}
                              </TableCell>
                              <TableCell>
                                {report.postId && (
                                  <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/ko/posts/${report.postId}`} target="_blank">
                                      <ExternalLink className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {reportsReceivedData?.reports.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                받은 신고가 없습니다
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {reportsReceivedData?.pagination && reportsReceivedData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Page {reportsReceivedData.pagination.page} of {reportsReceivedData.pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReportsReceivedPage((p) => Math.max(1, p - 1))}
                            disabled={reportsReceivedPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReportsReceivedPage((p) => p + 1)}
                            disabled={reportsReceivedPage >= reportsReceivedData.pagination.totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="reports-made" className="mt-4">
                {reportsMadeLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportsMadeData?.reports.map((report) => (
                            <TableRow key={report.id}>
                              <TableCell>{getReportTypeBadge(report.type)}</TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                <span className="text-muted-foreground text-xs">[{report.targetType}]</span>{' '}
                                {report.postId ? (
                                  <Link
                                    href={`/ko/posts/${report.postId}`}
                                    target="_blank"
                                    className="hover:underline"
                                  >
                                    {report.targetTitle}
                                  </Link>
                                ) : report.targetTitle}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                {report.reason}
                              </TableCell>
                              <TableCell>{getReportStatusBadge(report.status)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {dayjs(report.createdAt).format('YYYY.MM.DD')}
                              </TableCell>
                              <TableCell>
                                {report.postId && (
                                  <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/ko/posts/${report.postId}`} target="_blank">
                                      <ExternalLink className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {reportsMadeData?.reports.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                한 신고가 없습니다
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {reportsMadeData?.pagination && reportsMadeData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Page {reportsMadeData.pagination.page} of {reportsMadeData.pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReportsMadePage((p) => Math.max(1, p - 1))}
                            disabled={reportsMadePage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReportsMadePage((p) => p + 1)}
                            disabled={reportsMadePage >= reportsMadeData.pagination.totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
              onClick={() => handleStatusChange('suspended', suspendDays)}
              disabled={updateStatusMutation.isPending}
            >
              정지
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>유저 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 유저를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              모든 게시글, 댓글 및 기타 데이터가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
