import type { Locale } from '@/i18n/config';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
const logoPath = '/brand-logo.png';

type Props = {
  locale?: Locale;
};

export default function StructuredData({ locale }: Props) {
  const localizedSiteUrl = locale ? `${siteUrl}/${locale}` : siteUrl;

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'VietKConnect',
    url: localizedSiteUrl,
    description: 'VietKConnect Q&A community',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${localizedSiteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VietKConnect',
    url: siteUrl,
    logo: `${siteUrl}${logoPath}`,
    description: 'VietKConnect Q&A community',
    sameAs: [],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: localizedSiteUrl,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
