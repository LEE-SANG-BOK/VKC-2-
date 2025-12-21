import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import { fetchPost, fetchPosts } from '@/repo/posts/fetch';
import { queryKeys } from '@/repo/keys';
import PostDetailClient from './PostDetailClient';
import { normalizePostImageSrc } from '@/utils/normalizePostImageSrc';
import { stripHtml } from '@/utils/htmlToText';
import { buildCategoryPopularFilters, buildRelatedPostFilters } from '@/utils/postRecommendationFilters';
import { SITE_URL } from '@/lib/siteUrl';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';
import { buildPageMetadata } from '@/lib/seo/metadata';

// 동적 라우트 설정
export const dynamicParams = true;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    lang: string;
    id: string;
  }>;
}

// 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, id } = await params;
  const dict = await getDictionary(lang as Locale);
  const t = (dict?.metadata?.post || {}) as Record<string, string>;
  const response = await fetchPost(id);
  const post = response?.data;
  const notFoundFallbacks =
    lang === 'en'
      ? {
          title: 'Post not found',
          description: 'The requested post could not be found.',
        }
      : lang === 'vi'
        ? {
            title: 'Không tìm thấy bài viết',
            description: 'Không thể tìm thấy bài viết bạn yêu cầu.',
          }
        : {
            title: '게시글을 찾을 수 없습니다',
            description: '요청하신 게시글을 찾을 수 없습니다',
          };

  if (!post) {
    return {
      title: t.notFoundTitle || notFoundFallbacks.title,
      description: t.notFoundDescription || notFoundFallbacks.description,
    };
  }

  const baseUrl = SITE_URL;
  const contentText = stripHtml(post.content || '');
  const description = contentText.substring(0, 160);
  const titleSuffix = t.titleSuffix || 'viet kconnect';
  const title = `${post.title} | ${titleSuffix}`;
  const ogImageSrc = normalizePostImageSrc(post.thumbnail) || normalizePostImageSrc(post.thumbnails?.[0]) || '/brand-logo.png';
  const ogImage = ogImageSrc.startsWith('/') ? `${baseUrl}${ogImageSrc}` : ogImageSrc;
  const keywordResult = buildKeywords({
    title: post.title,
    content: contentText,
    tags: post.tags,
    category: post.category,
    subcategory: post.subcategory,
  });
  const keywords = flattenKeywords(keywordResult, 12);
  const authorName = post.author?.displayName || post.author?.name || '';

  return buildPageMetadata({
    locale: lang as Locale,
    path: `/posts/${id}`,
    title,
    description,
    siteName: t.siteName || 'viet kconnect',
    images: ogImage ? [ogImage] : [],
    type: 'article',
    keywords,
    tags: keywords,
    authors: authorName ? [authorName] : undefined,
    publishedTime: post.createdAt,
    category: post.category,
    twitterCard: 'summary_large_image',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  });
}

// Static Params 생성 (정적 생성을 위한 경로 목록)
export async function generateStaticParams() {
  return [];
}

// 서버 컴포넌트 - 데이터 페칭 및 렌더링
export default async function PostDetailPage({ params }: PageProps) {
  const { lang, id } = await params;
  const translations = await getDictionary(lang as Locale);
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const anonymousLabel = tCommon.anonymous || '';
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.posts.detail(id),
      queryFn: () => fetchPost(id),
    });
  } catch (error) {
    console.error('prefetch post failed', error);
  }

  let response;
  try {
    response = await fetchPost(id);
  } catch (error) {
    console.error('fetch post failed', error);
    notFound();
  }

  const post = response?.data;

  if (!post) {
    notFound();
  }
  const relatedFilters = buildRelatedPostFilters({
    title: post.title,
    tags: post.tags,
    category: post.category,
    type: post.type,
    limit: 6,
  });
  const categoryFilters = buildCategoryPopularFilters({
    category: post.category,
    type: post.type,
    limit: 6,
  });

  const recommendationTasks: Array<Promise<unknown>> = [];
  if (relatedFilters) {
    recommendationTasks.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.posts.list(relatedFilters),
        queryFn: () => fetchPosts(relatedFilters),
      })
    );
  }
  if (categoryFilters) {
    recommendationTasks.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.posts.list(categoryFilters),
        queryFn: () => fetchPosts(categoryFilters),
      })
    );
  }
  if (recommendationTasks.length > 0) {
    await Promise.all(recommendationTasks);
  }

  const mappedPost: any = {
    id: post.id,
    category: post.category,
    trustBadge: (post as any).trustBadge,
    trustWeight: (post as any).trustWeight,
    author: {
      id: post.author?.id,
      name: post.author?.displayName || post.author?.name || anonymousLabel,
      avatar: post.author?.image || post.author?.avatar || '/default-avatar.jpg',
      followers: 0,
      isFollowing: false,
      isVerified: post.author?.isVerified,
      isExpert: (post.author as any)?.isExpert || false,
      badgeType: (post.author as any)?.badgeType || null,
    },
    title: post.title,
    content: post.content,
    tags: post.tags || [],
    stats: {
      likes: post.stats?.likes ?? post.likes ?? 0,
      comments: post.stats?.comments ?? 0,
      shares: post.stats?.shares ?? 0,
    },
    thumbnail: post.thumbnail || post.thumbnails?.[0] || undefined,
    publishedAt: post.createdAt || post.updatedAt,
    isLiked: post.isLiked ?? false,
    isBookmarked: post.isBookmarked ?? false,
    comments: [],
    answers: [],
    isQuestion: post.type === 'question',
    isAdopted: post.isResolved,
  };

  const baseUrl = SITE_URL;
  const answerCount = post.answersCount ?? 0;
  const jsonLdImageSrc = normalizePostImageSrc(mappedPost.thumbnail) || '/brand-logo.png';
  const jsonLdImage = jsonLdImageSrc.startsWith('/') ? `${baseUrl}${jsonLdImageSrc}` : jsonLdImageSrc;

  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': mappedPost.isQuestion ? ['QAPage', 'DiscussionForumPosting'] : 'DiscussionForumPosting',
    '@id': `${baseUrl}/${lang}/posts/${id}`,
    headline: mappedPost.title,
    description: (mappedPost.content || '').replace(/<[^>]*>/g, '').substring(0, 160),
    image: jsonLdImage,
    datePublished: mappedPost.publishedAt,
    author: {
      '@type': 'Person',
      name: mappedPost.author.name,
      image: mappedPost.author.avatar,
      url: mappedPost.author.id ? `${baseUrl}/${lang}/profile/${mappedPost.author.id}` : undefined,
      ...(mappedPost.author.isExpert ? { jobTitle: 'Expert' } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'K-Connect Q&A Community',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/brand-logo.png`,
      },
    },
    mainEntity: mappedPost.isQuestion ? {
      '@type': 'Question',
      name: mappedPost.title,
      text: mappedPost.content,
      answerCount,
      upvoteCount: mappedPost.stats.likes,
      dateCreated: mappedPost.publishedAt,
      author: {
        '@type': 'Person',
        name: mappedPost.author.name,
      },
    } : {
      '@type': 'DiscussionForumPosting',
      headline: mappedPost.title,
      text: mappedPost.content,
      datePublished: mappedPost.publishedAt,
    },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: mappedPost.stats.likes,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: mappedPost.stats.comments,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ShareAction',
        userInteractionCount: mappedPost.stats.shares,
      },
    ],
    keywords: (mappedPost.tags || []).join(', '),
    discussionUrl: `${baseUrl}/${lang}/posts/${id}`,
  };

  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SSR with TanStack Query Hydration */}
      <HydrationBoundary state={dehydrate(queryClient)}>
      <PostDetailClient initialPost={mappedPost} locale={lang} translations={translations} />
      </HydrationBoundary>
    </>
  );
}
