import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import { fetchPost } from '@/repo/posts/fetch';
import { queryKeys } from '@/repo/keys';
import PostDetailClient from './PostDetailClient';

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
  const response = await fetchPost(id);
  const post = response?.data;

  if (!post) {
    return {
      title: '게시글을 찾을 수 없습니다',
      description: '요청하신 게시글을 찾을 수 없습니다',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const currentUrl = `${baseUrl}/${lang}/posts/${id}`;

  // HTML 태그 제거 및 텍스트 추출 (최대 160자)
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  };

  const description = stripHtml(post.content || '').substring(0, 160);
  const title = `${post.title} | viet kconnect`;
  const ogImage = post.thumbnail || post.thumbnails?.[0] || '/brand-logo.png';

  return {
    title,
    description,

    // Canonical URL
    alternates: {
      canonical: currentUrl,
      languages: {
        ko: `${baseUrl}/ko/posts/${id}`,
        en: `${baseUrl}/en/posts/${id}`,
        vi: `${baseUrl}/vi/posts/${id}`,
      },
    },

    // Open Graph
    openGraph: {
      type: 'article',
      title,
      description,
      url: currentUrl,
      siteName: 'viet kconnect',
      images: ogImage ? [ogImage] : [],
      publishedTime: post.createdAt,
      authors: [post.author?.displayName || post.author?.name || ''],
      tags: post.tags,
      locale: lang,
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
      creator: post.author?.displayName ? `@${post.author.displayName}` : undefined,
    },

    // Robots
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

    // Additional metadata
    authors: [{ name: post.author?.displayName || post.author?.name || '' }],
    keywords: post.tags,
    category: post.category,
  };
}

// Static Params 생성 (정적 생성을 위한 경로 목록)
export async function generateStaticParams() {
  return [];
}

// 서버 컴포넌트 - 데이터 페칭 및 렌더링
export default async function PostDetailPage({ params }: PageProps) {
  const { lang, id } = await params;
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

  const mappedPost: any = {
    id: post.id,
    category: post.category,
    trustBadge: (post as any).trustBadge,
    trustWeight: (post as any).trustWeight,
    author: {
      id: post.author?.id,
      name: post.author?.displayName || post.author?.name || '알 수 없음',
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
    stats: { likes: post.likes ?? 0, comments: 0, shares: 0 },
    thumbnail: post.thumbnail || post.thumbnails?.[0] || undefined,
    publishedAt: post.createdAt || post.updatedAt,
    isLiked: post.isLiked ?? false,
    isBookmarked: post.isBookmarked ?? false,
    comments: [],
    answers: [],
    isQuestion: post.type === 'question',
    isAdopted: post.isResolved,
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': mappedPost.isQuestion ? 'QAPage' : 'DiscussionForumPosting',
    '@id': `${baseUrl}/${lang}/posts/${id}`,
    headline: mappedPost.title,
    description: (mappedPost.content || '').replace(/<[^>]*>/g, '').substring(0, 160),
    image: mappedPost.thumbnail || '',
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
      answerCount: 0,
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
        <PostDetailClient initialPost={mappedPost} locale={lang} translations={await getDictionary(lang as Locale)} />
      </HydrationBoundary>
    </>
  );
}
