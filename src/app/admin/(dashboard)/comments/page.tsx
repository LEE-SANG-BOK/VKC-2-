'use client';

import { useState } from 'react';
import { useAdminComments } from '@/repo/admin/query';
import { useDeleteComment } from '@/repo/admin/mutation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import dayjs from 'dayjs';
import Link from 'next/link';

const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>/g, '').trim();
};

export default function AdminCommentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const { data, isLoading } = useAdminComments({
    page,
    limit: 20,
    search,
  });

  const deleteCommentMutation = useDeleteComment();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteCommentId) return;
    try {
      await deleteCommentMutation.mutateAsync(deleteCommentId);
      setDeleteCommentId(null);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">댓글 관리</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>댓글 목록</CardTitle>
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
                      <TableHead>작성자</TableHead>
                      <TableHead className="min-w-[300px]">내용</TableHead>
                      <TableHead>게시글</TableHead>
                      <TableHead>좋아요</TableHead>
                      <TableHead>작성일</TableHead>
                      <TableHead className="w-[70px]">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.comments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.author?.image || undefined} />
                              <AvatarFallback>
                                {(comment.author?.displayName || comment.author?.name || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {comment.author?.displayName || comment.author?.name || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="line-clamp-2 text-sm">{stripHtml(comment.content)}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {comment.post?.title ? (
                            <Link
                              href={`/ko/posts/${comment.postId}`}
                              target="_blank"
                              className="line-clamp-1 hover:underline"
                            >
                              {comment.post.title}
                            </Link>
                          ) : (
                            <span className="italic">답변 댓글</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{comment.likes}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {dayjs(comment.createdAt).format('YYYY.MM.DD HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {comment.postId && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/ko/posts/${comment.postId}`} target="_blank">
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {comment.postId && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/ko/posts/${comment.postId}`} target="_blank">
                                      게시글 보기
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => setDeleteCommentId(comment.id)}
                                >
                                  삭제
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data?.comments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          댓글이 없습니다
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

      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
