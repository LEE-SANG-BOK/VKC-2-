import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { uploadAvatar } from '@/lib/supabase/storage';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/upload/avatar
 * 아바타 업로드
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('파일이 없습니다.', 'UPLOAD_FILE_REQUIRED');
    }

    // Supabase Storage에 업로드
    const result = await uploadAvatar(file, user.id);

    if (!result.success) {
      return errorResponse(result.error || '아바타 업로드에 실패했습니다.', 'UPLOAD_FAILED');
    }

    // 사용자 프로필 업데이트
    await db
      .update(users)
      .set({
        image: result.url,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return successResponse(
      {
        url: result.url,
        path: result.path,
      },
      '아바타가 업로드되었습니다.'
    );
  } catch (error) {
    console.error('POST /api/upload/avatar error:', error);
    return serverErrorResponse();
  }
}
