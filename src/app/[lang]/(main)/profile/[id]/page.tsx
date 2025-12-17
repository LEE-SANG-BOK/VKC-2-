import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import ProfileClient, { ProfileData } from './ProfileClient';
import { fetchUserPosts, fetchUserAnswers, fetchUserComments } from '@/repo/users/fetch';
import { PaginatedResponse, UserPost, UserAnswer, UserComment } from '@/repo/users/types';
import { queryKeys } from '@/repo/keys';
import { normalizePostImageSrc } from '@/utils/normalizePostImageSrc';
import { API_BASE } from '@/lib/apiBase';

export const dynamicParams = true;
export const revalidate = 60;

interface PageProps {
  params: Promise<{
    lang: Locale;
    id: string;
  }>;
}

// API로 프로필 가져오기 (쿠키 포함)
async function getProfileById(id: string, cookieHeader?: string): Promise<ProfileData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      cache: 'no-store',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });
    
    if (!res.ok) {
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, id } = await params;
  const dict = await getDictionary(lang);
  const t = (dict?.metadata?.profile || {}) as Record<string, string>;
  const profile = await getProfileById(id);

  if (!profile) {
    return {
      title: t.notFoundTitle || '프로필을 찾을 수 없습니다',
      description: t.notFoundDescription || '요청하신 프로필을 찾을 수 없습니다',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const currentUrl = `${baseUrl}/${lang}/profile/${id}`;

  const avatarSrc = normalizePostImageSrc(profile.avatar);
  const ogImage = avatarSrc
    ? avatarSrc.startsWith('/')
      ? `${baseUrl}${avatarSrc}`
      : avatarSrc
    : `${baseUrl}/brand-logo.png`;

  const title = (t.title || '{name} - 프로필 | viet kconnect').replace('{name}', profile.displayName);
  const description =
    profile.bio ||
    (t.description || "{name}님의 viet kconnect 커뮤니티 프로필. 게시글 {posts}개, 채택 {accepted}개, 댓글 {comments}개.")
      .replace('{name}', profile.displayName)
      .replace('{posts}', String(profile.stats.posts))
      .replace('{accepted}', String(profile.stats.accepted))
      .replace('{comments}', String(profile.stats.comments));

  return {
    title,
    description,

    // Canonical URL
    alternates: {
      canonical: currentUrl,
      languages: {
        ko: `${baseUrl}/ko/profile/${id}`,
        en: `${baseUrl}/en/profile/${id}`,
        vi: `${baseUrl}/vi/profile/${id}`,
      },
    },

    // Open Graph
    openGraph: {
      type: 'profile',
      title,
      description,
      url: currentUrl,
      siteName: t.siteName || 'viet kconnect',
      images: [
        {
          url: ogImage,
          width: 400,
          height: 400,
          alt: profile.displayName,
        },
      ],
      locale: lang,
    },

    // Twitter Card
    twitter: {
      card: 'summary',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
      },
    },

    // Additional metadata
    authors: [{ name: profile.displayName }],
  };
}

// 서버 컴포넌트 - 데이터 페칭 및 렌더링
export default async function ProfilePage({ params }: PageProps) {
  const { lang, id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const profileUrl = `${baseUrl}/${lang}/profile/${id}`;

  const queryClient = new QueryClient();

  const profile = await getProfileById(id, cookieHeader);

  if (!profile) {
    notFound();
  }

  const legacyStatus = profile.status;
  const effectiveUserType =
    profile.userType ||
    (legacyStatus && legacyStatus !== 'banned' && legacyStatus !== 'suspended' ? legacyStatus : null);

  const userTypeLabel = effectiveUserType
    ? (() => {
        const normalized = String(effectiveUserType).toLowerCase();
        if (normalized === 'student' || effectiveUserType === '학생') {
          return lang === 'vi' ? 'Sinh viên' : lang === 'en' ? 'Student' : '학생';
        }
        if (normalized === 'worker' || effectiveUserType === '직장인' || effectiveUserType === '근로자') {
          return lang === 'vi' ? 'Người lao động' : lang === 'en' ? 'Worker' : '근로자';
        }
        if (normalized === 'resident' || effectiveUserType === '거주자') {
          return lang === 'vi' ? 'Cư dân' : lang === 'en' ? 'Resident' : '거주자';
        }
        if (normalized === 'other' || effectiveUserType === '기타') {
          return lang === 'vi' ? 'Khác' : lang === 'en' ? 'Other' : '기타';
        }
        return String(effectiveUserType);
      })()
    : undefined;

  type PageParam = { page: number; cursor?: string | null };
  const defaultPageParam: PageParam = { page: 1, cursor: null };

  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.users.posts(id, {}),
      queryFn: ({ pageParam = defaultPageParam }: { pageParam?: PageParam }) => {
        const param = pageParam as PageParam;
        return fetchUserPosts(id, {
          page: param.page,
          cursor: param.cursor || undefined,
          limit: 20,
        });
      },
      initialPageParam: defaultPageParam,
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.users.answers(id, { adoptedOnly: true }),
      queryFn: ({ pageParam = defaultPageParam }: { pageParam?: PageParam }) => {
        const param = pageParam as PageParam;
        return fetchUserAnswers(id, {
          adoptedOnly: true,
          page: param.page,
          cursor: param.cursor || undefined,
          limit: 20,
        });
      },
      initialPageParam: defaultPageParam,
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.users.comments(id, {}),
      queryFn: ({ pageParam = defaultPageParam }: { pageParam?: PageParam }) => {
        const param = pageParam as PageParam;
        return fetchUserComments(id, {
          page: param.page,
          cursor: param.cursor || undefined,
          limit: 20,
        });
      },
      initialPageParam: defaultPageParam,
    }),
  ]);

  // JSON-LD 구조화 데이터 - ProfilePage schema
  const avatarSrc = normalizePostImageSrc(profile.avatar);
  const avatar = avatarSrc ? (avatarSrc.startsWith('/') ? `${baseUrl}${avatarSrc}` : avatarSrc) : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': profileUrl,
    name: profile.displayName,
    description: profile.bio,
    url: profileUrl,
    mainEntity: {
      '@type': 'Person',
      '@id': `${profileUrl}#person`,
      name: profile.displayName,
      image: avatar,
      description: profile.bio,
      gender: profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : 'Other',
      jobTitle: userTypeLabel,
      url: profileUrl,
      sameAs: [],
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/WriteAction',
          userInteractionCount: profile.stats.posts,
          name: '작성한 게시글',
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/CommentAction',
          userInteractionCount: profile.stats.comments,
          name: '남긴 댓글',
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/AgreeAction',
          userInteractionCount: profile.stats.accepted,
          name: '채택된 답변',
        },
      ],
    },
    dateCreated: profile.joinedAt,
    publisher: {
      '@type': 'Organization',
      name: 'K-Connect Q&A Community',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/brand-logo.png`,
      },
    },
  };

  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SSR with Tanstack Query Hydration */}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProfileClient initialProfile={profile} locale={lang} translations={await getDictionary(lang)} />
      </HydrationBoundary>
    </>
  );
}
