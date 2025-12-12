import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, isNull, asc } from 'drizzle-orm';

/**
 * GET /api/categories
 * 카테고리 목록 조회 (2단계 구조)
 */
export async function GET(request: NextRequest) {
  try {
    // 모든 활성 카테고리 조회
    const allCategories = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: [asc(categories.order)],
    });

    // 대분류 (parentId가 null)
    const parentCategories = allCategories.filter(cat => !cat.parentId);

    // 결과 구조화
    const result = parentCategories.map(parent => ({
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      order: parent.order,
      children: allCategories
        .filter(cat => cat.parentId === parent.id)
        .map(child => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          order: child.order,
        })),
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: '카테고리를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
