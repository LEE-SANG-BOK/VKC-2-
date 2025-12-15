import { getSupabaseAdmin } from './server';

export type StorageBucket = 'avatars' | 'profile' | 'posts' | 'documents' | 'temp';

export interface UploadOptions {
  bucket: StorageBucket;
  file: File;
  userId: string;
  folder?: string;
  maxSize?: number; // in bytes
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

// 허용된 파일 타입
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

// 최대 파일 크기 (바이트)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Supabase Storage에 파일 업로드
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { bucket, file, userId, folder, maxSize } = options;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 파일 타입 검증
    if (!validateFileType(file, bucket)) {
      return {
        success: false,
        error: '지원하지 않는 파일 형식입니다.',
      };
    }

    // 파일 크기 검증
    const sizeLimit = maxSize || getMaxFileSize(bucket);
    if (file.size > sizeLimit) {
      return {
        success: false,
        error: `파일 크기는 ${sizeLimit / 1024 / 1024}MB를 초과할 수 없습니다.`,
      };
    }

    // 파일 경로 생성
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}.${fileExt}`;
    const filePath = folder
      ? `${userId}/${folder}/${fileName}`
      : `${userId}/${fileName}`;

    // 파일 업로드
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      const message = typeof (error as any)?.message === 'string' ? String((error as any).message) : '';
      const statusCode = (error as any)?.statusCode;
      const isBucketNotFound =
        statusCode === 404 ||
        statusCode === '404' ||
        (/bucket/i.test(message) && /not\s+found/i.test(message));
      return {
        success: false,
        error: isBucketNotFound ? '스토리지 버킷을 찾을 수 없습니다.' : '파일 업로드에 실패했습니다.',
      };
    }

    if (bucket === 'documents') {
      return {
        success: true,
        path: data.path,
      };
    }

    // Public URL 생성
    const { data: publicData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: '파일 업로드 중 오류가 발생했습니다.',
    };
  }
}

export async function createSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 600
): Promise<UploadResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Storage signed url error:', error);
      return {
        success: false,
        error: 'Signed URL 생성에 실패했습니다.',
      };
    }

    return {
      success: true,
      url: data.signedUrl,
      path,
    };
  } catch (error) {
    console.error('Signed URL error:', error);
    return {
      success: false,
      error: 'Signed URL 생성 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 파일 타입 검증
 */
function validateFileType(file: File, bucket: StorageBucket): boolean {
  const { type } = file;

  switch (bucket) {
    case 'avatars':
    case 'profile':
      return ALLOWED_IMAGE_TYPES.includes(type);
    case 'posts':
      return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES].includes(type);
    case 'documents':
      return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES].includes(type);
    case 'temp':
      return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_VIDEO_TYPES].includes(type);
    default:
      return false;
  }
}

/**
 * 버킷별 최대 파일 크기 반환
 */
function getMaxFileSize(bucket: StorageBucket): number {
  switch (bucket) {
    case 'documents':
      return MAX_DOCUMENT_SIZE;
    case 'avatars':
    case 'posts':
    case 'temp':
    default:
      return MAX_IMAGE_SIZE;
  }
}

/**
 * 파일 삭제
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<UploadResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      return {
        success: false,
        error: '파일 삭제에 실패했습니다.',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: '파일 삭제 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 여러 파일 삭제
 */
export async function deleteFiles(bucket: StorageBucket, paths: string[]): Promise<UploadResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      console.error('Storage delete error:', error);
      return {
        success: false,
        error: '파일 삭제에 실패했습니다.',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: '파일 삭제 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 아바타 업로드 헬퍼
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  const primary = await uploadFile({
    bucket: 'profile',
    file,
    userId,
    maxSize: MAX_IMAGE_SIZE,
  });

  if (primary.success) return primary;

  if ((primary.error || '').includes('스토리지 버킷을 찾을 수 없습니다.')) {
    return uploadFile({
      bucket: 'avatars',
      file,
      userId,
      maxSize: MAX_IMAGE_SIZE,
    });
  }

  return primary;
}

/**
 * 게시글 이미지 업로드 헬퍼
 */
export async function uploadPostImage(file: File, userId: string, postId?: string): Promise<UploadResult> {
  return uploadFile({
    bucket: 'posts',
    file,
    userId,
    folder: postId,
    maxSize: MAX_IMAGE_SIZE,
  });
}

/**
 * 인증 서류 업로드 헬퍼
 */
export async function uploadDocument(file: File, userId: string): Promise<UploadResult> {
  return uploadFile({
    bucket: 'documents',
    file,
    userId,
    maxSize: MAX_DOCUMENT_SIZE,
  });
}
