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
import { getUserTypeLabel } from '@/utils/userTypeLabel';
import { API_BASE } from '@/lib/apiBase';
import { SITE_URL } from '@/lib/siteUrl';
import { buildPageMetadata } from '@/lib/seo/metadata';

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
  const fallbackDict = lang === 'ko' ? dict : await getDictionary('ko');
  const t = (dict?.metadata?.profile || {}) as Record<string, string>;
  const tFallback = (fallbackDict?.metadata?.profile || {}) as Record<string, string>;
  const tMerged = { ...tFallback, ...t } as Record<string, string>;
  const profile = await getProfileById(id);

  if (!profile) {
    return {
      title: tMerged.notFoundTitle || dict?.metadata?.home?.title || '',
      description: tMerged.notFoundDescription || dict?.metadata?.home?.description || '',
    };
  }

  const baseUrl = SITE_URL;
  const avatarSrc = normalizePostImageSrc(profile.avatar);
  const ogImage = avatarSrc
    ? avatarSrc.startsWith('/')
      ? `${baseUrl}${avatarSrc}`
      : avatarSrc
    : `${baseUrl}/brand-logo.png`;

  const titleTemplate = tMerged.title || profile.displayName;
  const title = titleTemplate.replace('{name}', profile.displayName);
  const description =
    profile.bio ||
    (tMerged.description || '')
      .replace('{name}', profile.displayName)
      .replace('{posts}', String(profile.stats.posts))
      .replace('{accepted}', String(profile.stats.accepted))
      .replace('{comments}', String(profile.stats.comments));

  return buildPageMetadata({
    locale: lang,
    path: `/profile/${id}`,
    title,
    description,
    siteName: tMerged.siteName || dict?.metadata?.home?.siteName,
    images: ogImage ? [ogImage] : [],
    type: 'profile',
    authors: profile.displayName ? [profile.displayName] : undefined,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
      },
    },
  });
}

// 서버 컴포넌트 - 데이터 페칭 및 렌더링
export default async function ProfilePage({ params }: PageProps) {
  const { lang, id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const baseUrl = SITE_URL;
  const profileUrl = `${baseUrl}/${lang}/profile/${id}`;

  const queryClient = new QueryClient();

  const profile = await getProfileById(id, cookieHeader);

  if (!profile) {
    notFound();
  }

  const dict = await getDictionary(lang);
  const tProfileEdit = (dict?.profileEdit || {}) as Record<string, string>;

  const legacyStatus = profile.status;
  const effectiveUserType =
    profile.userType ||
    (legacyStatus && legacyStatus !== 'banned' && legacyStatus !== 'suspended' ? legacyStatus : null);

  const userTypeLabel = effectiveUserType
    ? getUserTypeLabel(String(effectiveUserType), {
        student: tProfileEdit.statusStudent || undefined,
        worker: tProfileEdit.statusWorker || undefined,
        resident: tProfileEdit.statusResident || undefined,
        other: tProfileEdit.statusOther || undefined,
      })
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
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/CommentAction',
          userInteractionCount: profile.stats.comments,
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/AgreeAction',
          userInteractionCount: profile.stats.accepted,
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
        <ProfileClient initialProfile={profile} locale={lang} translations={dict} />
      </HydrationBoundary>
    </>
  );
}
