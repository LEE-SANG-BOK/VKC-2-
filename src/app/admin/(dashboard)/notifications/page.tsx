'use client';

import { useState } from 'react';
import { useAdminNotifications } from '@/repo/admin/query';
import { useCreateNotification, useDeleteNotification } from '@/repo/admin/mutation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { Label } from '@/components/ui/label';
import { Plus, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

const notificationTypes = [
  { value: 'answer', label: '답변' },
  { value: 'comment', label: '댓글' },
  { value: 'reply', label: '답글' },
  { value: 'adoption', label: '채택' },
  { value: 'like', label: '좋아요' },
  { value: 'follow', label: '팔로우' },
];

export default function AdminNotificationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteNotificationId, setDeleteNotificationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'comment' as string,
    content: '',
    sendToAll: true,
  });

  const { data, isLoading } = useAdminNotifications({
    page,
    limit: 20,
    search,
    type: typeFilter === 'all' ? undefined : typeFilter,
  });

  const createMutation = useCreateNotification();
  const deleteMutation = useDeleteNotification();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        type: formData.type,
        content: formData.content,
      });
      setIsDialogOpen(false);
      setFormData({ type: 'comment', content: '', sendToAll: true });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteNotificationId) return;
    try {
      await deleteMutation.mutateAsync(deleteNotificationId);
      setDeleteNotificationId(null);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      answer: 'bg-blue-600',
      comment: 'bg-green-600',
      reply: 'bg-purple-600',
      adoption: 'bg-yellow-600',
      like: 'bg-pink-600',
      follow: 'bg-cyan-600',
    };
    return <Badge className={colors[type] || ''}>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">알림 관리</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          알림 발송
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>알림 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <Input
                placeholder="내용으로 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="max-w-sm"
              />
              <Button type="submit" variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="유형 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {notificationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
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
                      <TableHead className="min-w-[300px]">내용</TableHead>
                      <TableHead>읽음</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead className="w-[70px]">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.notifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={notification.user?.image || undefined} />
                              <AvatarFallback>
                                {(notification.user?.displayName || notification.user?.name || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {notification.user?.displayName || notification.user?.name || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(notification.type)}</TableCell>
                        <TableCell>
                          <p className="text-sm line-clamp-2">{notification.content}</p>
                        </TableCell>
                        <TableCell>
                          {notification.isRead ? (
                            <Badge variant="secondary">읽음</Badge>
                          ) : (
                            <Badge variant="default">안읽음</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dayjs(notification.createdAt).format('YYYY.MM.DD HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteNotificationId(notification.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data?.notifications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          알림이 없습니다
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>알림 발송</DialogTitle>
            <DialogDescription>
              모든 유저에게 알림을 발송합니다
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateNotification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">유형</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="알림 메시지..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '발송 중...' : '전체 발송'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteNotificationId} onOpenChange={() => setDeleteNotificationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>알림 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 알림을 삭제하시겠습니까?
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
