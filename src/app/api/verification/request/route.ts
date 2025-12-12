import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verificationRequests } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq } from 'drizzle-orm';

/**
 * POST /api/verification/request
 * 인증 요청 생성
 *
 * Body:
 * - type: string (required) - 인증 타입 (예: 'student', 'worker', 'expert', 'business', 'other')
 * - documents: string[] (required) - 업로드된 서류 URL 배열
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
    if (!type || !documents || !Array.isArray(documents) || documents.length === 0) {
      return errorResponse('인증 타입과 서류를 제공해주세요.');
    }

    if (documents.length > 5) {
      return errorResponse('서류는 최대 5개까지 첨부할 수 있습니다.');
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
      return errorResponse('이미 인증이 완료되었습니다.');
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
      return errorResponse('이미 검토 중인 인증 요청이 있습니다.');
    }

    // 타입별 최소 필드 검증
    if (type === 'student') {
      if (!universityName && !universityEmail) {
        return errorResponse('학생 인증은 대학명 또는 학교 이메일이 필요합니다.');
      }
    }

    if (type === 'worker') {
      if (!industry && !companyName) {
        return errorResponse('직장인 인증은 산업 분야 또는 회사명이 필요합니다.');
      }
    }

    // 인증 요청 생성
    const [newRequest] = await db
      .insert(verificationRequests)
      .values({
        userId: user.id,
        type,
        visaType: visaType || null,
        universityName: universityName || null,
        universityEmail: universityEmail || null,
        industry: industry || null,
        companyName: companyName || null,
        jobTitle: jobTitle || null,
        extraInfo: extraInfo || description || null,
        documentUrls: documents,
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
