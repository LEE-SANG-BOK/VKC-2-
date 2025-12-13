import { MetadataRoute } from 'next';
import { desc } from 'drizzle-orm';

const locales = ['ko', 'en', 'vi'];
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticPages = ['', '/about', '/terms', '/privacy', '/guide/visa-roadmap'];
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

  const categories = ['visa', 'employment', 'housing', 'daily-life', 'education', 'legal'];
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

  return [...localizedStaticPages, ...localizedCategories, ...localizedPosts];
}
