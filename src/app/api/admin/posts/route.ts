import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts, users, answers, comments } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { sql, desc, ilike, or, eq, and, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limitCandidate = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(50, Math.max(1, limitCandidate));
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') as 'question' | 'share' | null;

    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(posts.title, `%${search}%`),
          ilike(posts.content, `%${search}%`)
        )
      );
    }

    if (type) {
      conditions.push(eq(posts.type, type));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const contentPreviewLimit = 200;

    const [countResult, postsList] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(posts).where(whereCondition),
      db
        .select({
          id: posts.id,
          title: posts.title,
          content: sql<string>`left(${posts.content}, ${contentPreviewLimit})`.as('content'),
          type: posts.type,
          category: posts.category,
          subcategory: posts.subcategory,
          tags: posts.tags,
          views: posts.views,
          likes: posts.likes,
          isResolved: posts.isResolved,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          author: {
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            email: users.email,
            image: users.image,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(whereCondition)
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    const postIds = postsList.map((post) => post.id).filter(Boolean) as string[];

    const [answerCounts, commentCounts] = postIds.length
      ? await Promise.all([
          db
            .select({ postId: answers.postId, count: sql<number>`count(*)::int` })
            .from(answers)
            .where(inArray(answers.postId, postIds))
            .groupBy(answers.postId),
          db
            .select({ postId: comments.postId, count: sql<number>`count(*)::int` })
            .from(comments)
            .where(inArray(comments.postId, postIds))
            .groupBy(comments.postId),
        ])
      : [[], []];

    const answerCountMap = new Map<string, number>();
    answerCounts.forEach((row) => {
      if (row.postId) answerCountMap.set(row.postId, row.count);
    });

    const commentCountMap = new Map<string, number>();
    commentCounts.forEach((row) => {
      if (row.postId) commentCountMap.set(row.postId, row.count);
    });

    const formattedPosts = postsList.map((post) => ({
      id: post.id,
      title: post.title,
      content: typeof post.content === 'string' ? post.content : '',
      type: post.type,
      category: post.category,
      subcategory: post.subcategory,
      tags: post.tags ?? null,
      views: post.views ?? 0,
      likes: post.likes ?? 0,
      isResolved: post.isResolved ?? false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author ? {
        id: post.author.id,
        name: post.author.displayName || post.author.name || post.author.email?.split('@')[0],
        email: post.author.email,
        image: post.author.image,
      } : null,
      _count: {
        answers: answerCountMap.get(post.id) ?? 0,
        comments: commentCountMap.get(post.id) ?? 0,
      },
    }));

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin posts list error:', error);
    return NextResponse.json(
      { success: false, message: '게시물 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
