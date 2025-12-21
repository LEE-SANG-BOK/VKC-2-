import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { uploadPostImage } from '@/lib/supabase/storage';

/**
 * POST /api/upload
 * 일반 파일 업로드 (게시글 이미지 등)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const postId = formData.get('postId') as string | null;

    if (!file) {
      return errorResponse('파일이 없습니다.', 'UPLOAD_FILE_REQUIRED');
    }

    // Supabase Storage에 업로드
    const result = await uploadPostImage(file, user.id, postId || undefined);

    if (!result.success) {
      return errorResponse(result.error || '파일 업로드에 실패했습니다.', 'UPLOAD_FAILED');
    }

    return successResponse(
      {
        url: result.url,
        path: result.path,
      },
      '파일이 업로드되었습니다.'
    );
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return serverErrorResponse();
  }
}
