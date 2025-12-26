import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { setNoStore, setPublicSWR } from '@/lib/api/response';
import { eq, asc } from 'drizzle-orm';
import { DEPRECATED_GROUP_PARENT_SLUGS } from '@/lib/constants/category-groups';
import { isE2ETestMode } from '@/lib/e2e/mode';

/**
 * GET /api/categories
 * 카테고리 목록 조회 (2단계 구조)
 */
export async function GET(request: NextRequest) {
  try {
    if (isE2ETestMode()) {
      const response = NextResponse.json({
        success: true,
        data: [
          {
            id: 'visa',
            name: '비자·체류',
            slug: 'visa',
            order: 1,
            children: [
              { id: 'visa-change', name: '비자 변경', slug: 'visa-change', order: 1 },
              { id: 'arc', name: '외국인등록', slug: 'arc', order: 2 },
            ],
          },
          {
            id: 'students',
            name: '유학·학생',
            slug: 'students',
            order: 2,
            children: [
              { id: 'korean-learning', name: '한국어', slug: 'korean-learning', order: 1 },
            ],
          },
          {
            id: 'career',
            name: '취업·경력',
            slug: 'career',
            order: 3,
            children: [],
          },
        ],
      });
      setPublicSWR(response, 300, 600);
      return response;
    }

    // 모든 활성 카테고리 조회
    const allCategories = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: [asc(categories.order)],
    });

    const deprecatedParentIds = new Set(
      allCategories
        .filter((cat) => DEPRECATED_GROUP_PARENT_SLUGS.has(cat.slug))
        .map((cat) => cat.id)
    );

    const visibleCategories = allCategories.filter((cat) => {
      if (DEPRECATED_GROUP_PARENT_SLUGS.has(cat.slug)) return false;
      if (cat.parentId && deprecatedParentIds.has(cat.parentId)) return false;
      return true;
    });

    // 대분류 (parentId가 null)
    const parentCategories = visibleCategories.filter(cat => !cat.parentId);

    // 결과 구조화
    const result = parentCategories.map(parent => ({
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      order: parent.order,
      children: visibleCategories
        .filter(cat => cat.parentId === parent.id)
        .map(child => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          order: child.order,
        })),
    }));

    const response = NextResponse.json({
      success: true,
      data: result,
    });

    setPublicSWR(response, 300, 600);
    return response;
  } catch (error) {
    console.error('Error fetching categories:', error);
    const response = NextResponse.json({ error: '카테고리를 가져오는데 실패했습니다.' }, { status: 500 });
    setNoStore(response);
    return response;
  }
}
