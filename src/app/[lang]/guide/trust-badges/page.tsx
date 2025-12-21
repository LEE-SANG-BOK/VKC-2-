import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TrustBadge, { type TrustLevel } from '@/components/atoms/TrustBadge';
import { getDictionary } from '@/i18n/get-dictionary';
import { i18n, type Locale } from '@/i18n/config';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';

type PageProps = {
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const meta = (dict?.metadata as Record<string, any>) || {};

  const fallbackMetaByLocale = {
    ko: {
      title: '신뢰 배지 안내 - viet kconnect',
      description: '각 신뢰 배지의 의미와 부여 기준을 확인하세요.',
    },
    en: {
      title: 'Trust Badges - viet kconnect',
      description: 'Learn what each trust badge means and how it is assigned.',
    },
    vi: {
      title: 'Huy hiệu tin cậy - viet kconnect',
      description: 'Tìm hiểu ý nghĩa của từng huy hiệu tin cậy và cách được gán.',
    },
  } as const;
  const fallbackMeta = fallbackMetaByLocale[locale] || fallbackMetaByLocale.ko;

  const title = meta?.trustBadges?.title || fallbackMeta.title;
  const description = meta?.trustBadges?.description || fallbackMeta.description;

  const keywords = flattenKeywords(buildKeywords({ title, content: description }));

  return buildPageMetadata({
    locale,
    path: '/guide/trust-badges',
    title,
    description,
    siteName: (meta?.home as Record<string, string>)?.siteName,
    keywords,
  });
}

export default async function TrustBadgesGuidePage({ params }: PageProps) {
  const { lang } = await params;

  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const tTrust = (dict?.trustBadges || {}) as Record<string, string>;
  const tBottomNav = (dict?.bottomNav || {}) as Record<string, string>;
  const tSidebar = (dict?.sidebar || {}) as Record<string, string>;

  const headingByLocale = {
    ko: '신뢰 배지 안내',
    en: 'Trust Badges',
    vi: 'Huy hiệu tin cậy',
  } as const;
  const subheadingByLocale = {
    ko: '배지는 정보의 신뢰도를 빠르게 판단하는 데 도움을 줍니다.',
    en: 'Badges help you quickly judge how trustworthy information is.',
    vi: 'Huy hiệu giúp bạn nhanh chóng đánh giá mức độ tin cậy của thông tin.',
  } as const;
  const heading = headingByLocale[locale] || headingByLocale.ko;
  const subheading = subheadingByLocale[locale] || subheadingByLocale.ko;

  const homeLabel = tBottomNav.home || '';
  const verifyLabel = tSidebar.verificationRequest || '';

  const badges: Array<{ id: string; level: TrustLevel; label: string; tooltip: string }> = [
    {
      id: 'verified-user',
      level: 'verified',
      label: tTrust.verifiedUserLabel || '',
      tooltip: tTrust.verifiedUserTooltip || '',
    },
    {
      id: 'verified-student',
      level: 'verified',
      label: tTrust.verifiedStudentLabel || '',
      tooltip: tTrust.verifiedStudentTooltip || '',
    },
    {
      id: 'verified-worker',
      level: 'verified',
      label: tTrust.verifiedWorkerLabel || '',
      tooltip: tTrust.verifiedWorkerTooltip || '',
    },
    {
      id: 'trusted-answerer',
      level: 'community',
      label: tTrust.trustedAnswererLabel || '',
      tooltip: tTrust.trustedAnswererTooltip || '',
    },
    {
      id: 'community',
      level: 'community',
      label: tTrust.communityLabel || '',
      tooltip: tTrust.communityTooltip || '',
    },
    {
      id: 'expert-visa',
      level: 'expert',
      label: tTrust.expertVisaLabel || '',
      tooltip: tTrust.expertVisaTooltip || '',
    },
    {
      id: 'expert-employment',
      level: 'expert',
      label: tTrust.expertEmploymentLabel || '',
      tooltip: tTrust.expertEmploymentTooltip || '',
    },
    {
      id: 'expert',
      level: 'expert',
      label: tTrust.expertLabel || '',
      tooltip: tTrust.expertTooltip || '',
    },
    {
      id: 'verified',
      level: 'verified',
      label: tTrust.verifiedLabel || '',
      tooltip: tTrust.verifiedTooltip || '',
    },
    {
      id: 'outdated',
      level: 'outdated',
      label: tTrust.outdatedLabel || '',
      tooltip: tTrust.outdatedTooltip || '',
    },
  ];

  const base = `/${locale}`;

  return (
    <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-10 space-y-8 pb-16">
      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Trust</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{heading}</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{subheading}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={base}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {homeLabel}
            </a>
            <a
              href={`${base}/verification/request`}
              className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-semibold hover:bg-blue-700"
            >
              {verifyLabel}
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <TrustBadge level={badge.level} label={badge.label} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{badge.label}</h2>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{badge.tooltip}</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
