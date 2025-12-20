import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verificationRequests } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, errorResponse, serverErrorResponse, rateLimitResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/api/rateLimit';

const verificationRateLimitWindowMs = 24 * 60 * 60 * 1000;
const verificationRateLimitMax = 2;

function normalizeDocumentPath(input: unknown): string | null {
  if (typeof input !== 'string') return null;

  let value = input.trim();
  if (!value) return null;

  value = value.replace(/^\/+/, '');

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value);
      const marker = '/documents/';
      const markerIndex = url.pathname.indexOf(marker);
      if (markerIndex === -1) return null;

      const extracted = url.pathname.slice(markerIndex + marker.length);
      value = decodeURIComponent(extracted).replace(/^\/+/, '');
    } catch {
      return null;
    }
  }

  if (value.startsWith('documents/')) {
    value = value.slice('documents/'.length);
  }

  return value || null;
}

/**
 * POST /api/verification/request
 * 인증 요청 생성
 *
 * Body:
 * - type: string (required) - 인증 타입 (예: 'student', 'worker', 'expert', 'business', 'other')
 * - documents: string[] (required) - 업로드된 서류 storage path 배열
 * - description?: string - 추가 설명
 * - visaType?: string
 * - universityName?: string
 * - universityEmail?: string
 * - industry?: string
 * - companyName?: string
 * - jobTitle?: string
 * - extraInfo?: string
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const rateLimit = await checkRateLimit({
      table: verificationRequests,
      userColumn: verificationRequests.userId,
      createdAtColumn: verificationRequests.submittedAt,
      userId: user.id,
      windowMs: verificationRateLimitWindowMs,
      max: verificationRateLimitMax,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(
        '인증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        'VERIFICATION_RATE_LIMITED',
        rateLimit.retryAfterSeconds
      );
    }

    const body = await request.json();
    const {
      type,
      documents,
      description,
      visaType,
      universityName,
      universityEmail,
      industry,
      companyName,
      jobTitle,
      extraInfo,
    } = body;

    // 검증
    const normalizedType = typeof type === 'string' ? type.trim() : '';

    if (!normalizedType || !documents || !Array.isArray(documents) || documents.length === 0) {
      return errorResponse('인증 타입과 서류를 제공해주세요.', 'VERIFICATION_REQUIRED_FIELDS');
    }

    if (documents.length > 5) {
      return errorResponse('서류는 최대 5개까지 첨부할 수 있습니다.', 'VERIFICATION_DOCUMENT_LIMIT');
    }

    const normalizedDocumentPaths = Array.from(
      new Set(
        documents
          .map((document) => normalizeDocumentPath(document))
          .filter((path): path is string => Boolean(path))
      )
    );

    if (normalizedDocumentPaths.length === 0) {
      return errorResponse('인증 서류를 다시 첨부해주세요.', 'VERIFICATION_DOCUMENT_REQUIRED');
    }

    if (normalizedDocumentPaths.length > 5) {
      return errorResponse('서류는 최대 5개까지 첨부할 수 있습니다.', 'VERIFICATION_DOCUMENT_LIMIT');
    }

    const invalidPath = normalizedDocumentPaths.find((path) => !path.startsWith(`${user.id}/`));
    if (invalidPath) {
      return errorResponse('본인이 업로드한 서류만 첨부할 수 있습니다.', 'VERIFICATION_DOCUMENT_NOT_OWNED');
    }

    // 이미 승인된 인증 요청이 있는지 확인
    const approvedRequest = await db.query.verificationRequests.findFirst({
      where: (verificationRequests, { eq, and }) =>
        and(
          eq(verificationRequests.userId, user.id),
          eq(verificationRequests.status, 'approved')
        ),
    });

    if (approvedRequest) {
      return errorResponse('이미 인증이 완료되었습니다.', 'VERIFICATION_ALREADY_APPROVED');
    }

    // 진행 중인 인증 요청이 있는지 확인
    const pendingRequest = await db.query.verificationRequests.findFirst({
      where: (verificationRequests, { eq, and }) =>
        and(
          eq(verificationRequests.userId, user.id),
          eq(verificationRequests.status, 'pending')
        ),
    });

    if (pendingRequest) {
      return errorResponse('이미 검토 중인 인증 요청이 있습니다.', 'VERIFICATION_ALREADY_PENDING');
    }

    // 타입별 최소 필드 검증
    if (normalizedType === 'student') {
      if (!universityName && !universityEmail) {
        return errorResponse('학생 인증은 대학명 또는 학교 이메일이 필요합니다.', 'VERIFICATION_STUDENT_REQUIRED');
      }
    }

    if (normalizedType === 'worker') {
      if (!industry && !companyName) {
        return errorResponse('직장인 인증은 산업 분야 또는 회사명이 필요합니다.', 'VERIFICATION_WORKER_REQUIRED');
      }
    }

    // 인증 요청 생성
    const [newRequest] = await db
      .insert(verificationRequests)
      .values({
        userId: user.id,
        type: normalizedType,
        visaType: visaType || null,
        universityName: universityName || null,
        universityEmail: universityEmail || null,
        industry: industry || null,
        companyName: companyName || null,
        jobTitle: jobTitle || null,
        extraInfo: extraInfo || description || null,
        documentUrls: normalizedDocumentPaths,
        reason: null,
        status: 'pending',
      })
      .returning();

    return successResponse(
      newRequest,
      '인증 요청이 접수되었습니다. 검토까지 영업일 기준 3-5일 소요됩니다.'
    );
  } catch (error) {
    console.error('POST /api/verification/request error:', error);
    return serverErrorResponse();
  }
}
