import { MetadataRoute } from 'next';
import { desc } from 'drizzle-orm';
import { CATEGORY_GROUP_SLUGS } from '@/lib/constants/category-groups';
import { SITE_URL } from '@/lib/siteUrl';

const locales = ['ko', 'en', 'vi'];
const baseUrl = SITE_URL;

async function fetchPostsForSitemap() {
  const skipDb = process.env.SKIP_SITEMAP_DB === 'true';
  if (skipDb || !process.env.DATABASE_URL) return [];
  try {
    const { db } = await import('@/lib/db');
    const { posts } = await import('@/lib/db/schema');
    const rows = await db
      .select({ id: posts.id, updatedAt: posts.updatedAt })
      .from(posts)
      .orderBy(desc(posts.updatedAt))
      .limit(2000);
    return rows;
  } catch (error) {
    return [];
  }
}

async function fetchProfilesForSitemap() {
  const skipDb = process.env.SKIP_SITEMAP_DB === 'true';
  if (skipDb || !process.env.DATABASE_URL) return [];
  try {
    const { db } = await import('@/lib/db');
    const { users } = await import('@/lib/db/schema');
    const rows = await db
      .select({ id: users.id, updatedAt: users.updatedAt })
      .from(users)
      .orderBy(desc(users.updatedAt))
      .limit(2000);
    return rows;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticPages = ['', '/about', '/terms', '/privacy', '/media', '/faq', '/guide/visa-roadmap'];
  const localizedStaticPages = locales.flatMap((locale) =>
    staticPages.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}${route}`])),
      },
    }))
  );

  const categories = Object.keys(CATEGORY_GROUP_SLUGS);
  const localizedCategories = locales.flatMap((locale) =>
    categories.map((category) => ({
      url: `${baseUrl}/${locale}?c=${category}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}?c=${category}`])),
      },
    }))
  );

  let postRows: { id: string; updatedAt: Date | null }[] = [];
  try {
    postRows = await fetchPostsForSitemap();
  } catch {
    postRows = [];
  }
  const localizedPosts = postRows.flatMap((post) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/posts/${post.id}`,
      lastModified: post.updatedAt || lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}/posts/${post.id}`])),
      },
    }))
  );

  let profileRows: { id: string; updatedAt: Date | null }[] = [];
  try {
    profileRows = await fetchProfilesForSitemap();
  } catch {
    profileRows = [];
  }

  const localizedProfiles = profileRows.flatMap((profile) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/profile/${profile.id}`,
      lastModified: profile.updatedAt || lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}/profile/${profile.id}`])),
      },
    }))
  );

  return [...localizedStaticPages, ...localizedCategories, ...localizedPosts, ...localizedProfiles];
}
