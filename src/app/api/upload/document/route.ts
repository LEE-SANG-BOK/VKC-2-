import { NextRequest } from 'next/server';
import { successResponse, unauthorizedResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { createSignedUrl, uploadDocument } from '@/lib/supabase/storage';

/**
 * POST /api/upload/document
 * 인증 서류 업로드 (Private)
 *
 * Body (multipart/form-data):
 * - file: File (required) - PDF, DOC, DOCX 파일
 * - verificationId?: string - 인증 요청 ID (선택)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const verificationId = formData.get('verificationId') as string | null;

    if (!file) {
      return errorResponse('파일이 제공되지 않았습니다.', 'UPLOAD_FILE_REQUIRED');
    }

    // 파일 업로드 (documents 버킷은 Private)
    const result = await uploadDocument(file, user.id);

    if (!result.success) {
      return errorResponse(result.error || '파일 업로드에 실패했습니다.', 'UPLOAD_FAILED');
    }

    const signed = result.path ? await createSignedUrl('documents', result.path, 600) : null;

    return successResponse(
      {
        path: result.path,
        url: signed?.success ? signed.url : null,
      },
      '인증 서류가 업로드되었습니다.'
    );
  } catch (error) {
    console.error('POST /api/upload/document error:', error);
    return serverErrorResponse();
  }
}
