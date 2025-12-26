import type { Metadata } from 'next';
import { i18n, type Locale } from '@/i18n/config';
import { SITE_URL } from '@/lib/siteUrl';

type MetadataInput = {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  siteName?: string;
  images?: string[];
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
  tags?: string[];
  authors?: string[];
  publishedTime?: string | null;
  category?: string | null;
  robots?: Metadata['robots'];
  twitterCard?: 'summary' | 'summary_large_image';
};

const buildAlternates = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return Object.fromEntries(
    i18n.locales.map((locale) => [locale, `${SITE_URL}/${locale}${normalizedPath}`])
  );
};

export const buildPageMetadata = ({
  locale,
  path,
  title,
  description,
  siteName = 'viet kconnect',
  images,
  type = 'website',
  keywords,
  tags,
  authors,
  publishedTime,
  category,
  robots,
  twitterCard = 'summary',
}: MetadataInput): Metadata => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const currentUrl = `${SITE_URL}/${locale}${normalizedPath}`;
  const imageList = images?.filter(Boolean) || [];

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: currentUrl,
      languages: buildAlternates(normalizedPath),
    },
    robots,
    keywords,
    category: category || undefined,
    authors: authors?.filter(Boolean).map((name) => ({ name })) || undefined,
    openGraph: {
      type,
      title,
      description,
      url: currentUrl,
      siteName,
      images: imageList,
      locale,
      publishedTime: publishedTime || undefined,
      tags,
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      images: imageList,
    },
  };
};
