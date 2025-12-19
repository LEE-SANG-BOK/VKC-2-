'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useAdminNews } from '@/repo/admin/query';
import { useCreateNews, useUpdateNews, useDeleteNews } from '@/repo/admin/mutation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Search, ExternalLink, Upload, X, ImageIcon } from 'lucide-react';
import { AdminNews } from '@/repo/admin/types';
import dayjs from 'dayjs';

interface NewsFormData {
  title: string;
  category: string;
  language: string;
  type: 'post' | 'cardnews' | 'shorts';
  content: string;
  imageUrl: string;
  linkUrl: string;
  order: number;
  isActive: boolean;
  startAt: string;
  endAt: string;
}

const CATEGORY_OPTIONS = [
  { value: 'notice', label: '공지' },
  { value: 'visa', label: '비자/체류' },
  { value: 'employment', label: '취업/커리어' },
  { value: 'life', label: '생활/문화' },
  { value: 'safety', label: '사기·주의' },
  { value: 'cardnews', label: '카드뉴스' },
  { value: 'b2b-guide', label: '기업용 가이드' },
  { value: 'event', label: '이벤트' },
  { value: 'custom', label: '직접 입력' },
];

const LANG_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
];

const TYPE_OPTIONS = [
  { value: 'post', label: '일반' },
  { value: 'cardnews', label: '카드뉴스' },
  { value: 'shorts', label: '숏폼/Shorts' },
] as const;

const initialFormData: NewsFormData = {
  title: '',
  category: '',
  language: 'vi',
  type: 'post',
  content: '',
  imageUrl: '',
  linkUrl: '',
  order: 0,
  isActive: true,
  startAt: '',
  endAt: '',
};

const formatDateTimeInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function AdminNewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [languageFilter, setLanguageFilter] = useState('vi');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<AdminNews | null>(null);
  const [deleteNewsId, setDeleteNewsId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewsFormData>(initialFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [categoryMode, setCategoryMode] = useState<'preset' | 'custom'>('preset');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useAdminNews({
    page,
    limit: 10,
    search,
    language: languageFilter === 'all' ? undefined : languageFilter,
  });
  const createMutation = useCreateNews();
  const updateMutation = useUpdateNews();
  const deleteMutation = useDeleteNews();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB를 초과할 수 없습니다.');
      return;
    }

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '업로드 실패');
      }

      setFormData((prev) => ({ ...prev, imageUrl: result.url }));
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleOpenDialog = (newsItem?: AdminNews) => {
    if (newsItem) {
      setEditingNews(newsItem);
      const isCustom = !CATEGORY_OPTIONS.some((opt) => opt.value === newsItem.category);
      setCategoryMode(isCustom ? 'custom' : 'preset');
      setFormData({
        title: newsItem.title,
        category: newsItem.category,
        language: newsItem.language || 'vi',
        type: newsItem.type || 'post',
        content: newsItem.content || '',
        imageUrl: newsItem.imageUrl || '',
        linkUrl: newsItem.linkUrl || '',
        order: newsItem.order,
        isActive: newsItem.isActive,
        startAt: formatDateTimeInput(newsItem.startAt),
        endAt: formatDateTimeInput(newsItem.endAt),
      });
    } else {
      setEditingNews(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingNews(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNews) {
        await updateMutation.mutateAsync({
          id: editingNews.id,
          data: {
            ...formData,
            language: formData.language || 'vi',
            content: formData.content || '',
            imageUrl: formData.imageUrl || null,
            linkUrl: formData.linkUrl || null,
            startAt: formData.startAt,
            endAt: formData.endAt,
          },
        });
        toast.success('뉴스가 업데이트되었습니다.');
      } else {
        await createMutation.mutateAsync({
          ...formData,
          language: formData.language || 'vi',
          content: formData.content || '',
          imageUrl: formData.imageUrl || undefined,
          linkUrl: formData.linkUrl || undefined,
          startAt: formData.startAt,
          endAt: formData.endAt,
        });
        toast.success('뉴스가 생성되었습니다.');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save news:', error);
      toast.error('저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDelete = async () => {
    if (!deleteNewsId) return;
    try {
      await deleteMutation.mutateAsync(deleteNewsId);
      setDeleteNewsId(null);
      toast.success('뉴스가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete news:', error);
      toast.error('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">공지/배너 관리</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          공지/배너 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>공지/배너 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="제목 또는 카테고리 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="languageFilter">언어</Label>
              <select
                id="languageFilter"
                value={languageFilter}
                onChange={(e) => {
                  setLanguageFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none"
              >
                <option value="all">전체</option>
                {LANG_OPTIONS.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
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
                      <TableHead className="w-[80px]">이미지</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>언어</TableHead>
                      <TableHead>순서</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead className="w-[120px]">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.news.map((newsItem) => (
                      <TableRow key={newsItem.id}>
                        <TableCell>
                          {newsItem.imageUrl ? (
                            <div className="relative w-16 h-12 rounded overflow-hidden">
                              <Image
                                src={newsItem.imageUrl}
                                alt={newsItem.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-12 rounded bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate max-w-[200px]">
                              {newsItem.title}
                            </span>
                            {newsItem.linkUrl && (
                              <a
                                href={newsItem.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{newsItem.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {newsItem.language || 'vi'}
                          </Badge>
                        </TableCell>
                        <TableCell>{newsItem.order}</TableCell>
                        <TableCell>
                          {newsItem.isActive ? (
                            <Badge className="bg-green-600">활성</Badge>
                          ) : (
                            <Badge variant="secondary">비활성</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dayjs(newsItem.createdAt).format('YYYY-MM-DD')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(newsItem)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteNewsId(newsItem.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data?.news.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          게시글이 없습니다
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    이전
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNews ? '공지/배너 수정' : '공지/배너 추가'}
            </DialogTitle>
            <DialogDescription>
              {editingNews ? '공지/배너 정보를 수정합니다' : '새 공지/배너를 추가합니다'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="뉴스 제목"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">본문 *</Label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full min-h-[140px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                placeholder="본문을 입력하세요"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <select
                id="category"
                value={categoryMode === 'preset' ? formData.category : 'custom'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setCategoryMode('custom');
                    setFormData((prev) => ({ ...prev, category: '' }));
                  } else {
                    setCategoryMode('preset');
                    setFormData((prev) => ({ ...prev, category: val }));
                  }
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none"
                required
              >
                <option value="">카테고리 선택</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {categoryMode === 'custom' && (
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="직접 입력 (예: 커뮤니티 카드뉴스)"
                  required
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">언어 *</Label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none"
                required
              >
                {LANG_OPTIONS.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">콘텐츠 유형 *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as NewsFormData['type'] })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none"
                required
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>이미지</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {formData.imageUrl ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                  <Image
                    src={formData.imageUrl}
                    alt="뉴스 이미지"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  {isUploading ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
                  ) : (
                    <>
                      <ImageIcon className="h-10 w-10 text-gray-400" />
                      <span className="text-sm text-gray-500">클릭하여 이미지 업로드</span>
                      <span className="text-xs text-gray-400">JPG, PNG, GIF (최대 5MB)</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkUrl">링크 URL</Label>
              <Input
                id="linkUrl"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="https://example.com/news"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startAt">노출 시작</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">노출 종료</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">순서</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">활성</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                취소
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingNews ? '수정' : '생성'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteNewsId} onOpenChange={() => setDeleteNewsId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>뉴스 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 뉴스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
