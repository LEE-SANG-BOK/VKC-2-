import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments, users, posts, likes } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { sql, desc, ilike, eq, inArray } from 'drizzle-orm';

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

    const offset = (page - 1) * limit;

    const whereCondition = search ? ilike(comments.content, `%${search}%`) : undefined;

    const [countResult, commentsList] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(comments).where(whereCondition),
      db
        .select({
          id: comments.id,
          content: comments.content,
          postId: comments.postId,
          answerId: comments.answerId,
          parentId: comments.parentId,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          author: {
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            email: users.email,
            image: users.image,
          },
          post: {
            id: posts.id,
            title: posts.title,
          },
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .leftJoin(posts, eq(comments.postId, posts.id))
        .where(whereCondition)
        .orderBy(desc(comments.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    const commentIds = commentsList.map((comment) => comment.id).filter(Boolean) as string[];
    const likeRows = commentIds.length
      ? await db
          .select({ commentId: likes.commentId, count: sql<number>`count(*)::int` })
          .from(likes)
          .where(inArray(likes.commentId, commentIds))
          .groupBy(likes.commentId)
      : [];

    const likeCountMap = new Map<string, number>();
    likeRows.forEach((row) => {
      if (row.commentId) likeCountMap.set(row.commentId, row.count);
    });

    const formattedComments = commentsList.map((comment) => ({
      id: comment.id,
      content: comment.content,
      likes: likeCountMap.get(comment.id) ?? 0,
      postId: comment.postId,
      answerId: comment.answerId,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      post: comment.post?.id ? {
        id: comment.post.id,
        title: comment.post.title,
      } : null,
      author: comment.author?.id ? {
        id: comment.author.id,
        name: comment.author.displayName || comment.author.name || comment.author.email?.split('@')[0],
        email: comment.author.email,
        image: comment.author.image,
      } : null,
    }));

    return NextResponse.json({
      comments: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin comments list error:', error);
    return NextResponse.json(
      { success: false, message: '댓글 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
