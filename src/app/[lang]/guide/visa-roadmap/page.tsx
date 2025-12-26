import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/get-dictionary';
import { i18n, type Locale } from '@/i18n/config';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';

type PageProps = {
  params: Promise<{ lang: string }>;
};

type RoadmapStep = {
  title?: string;
  desc?: string;
  badge?: string;
  query?: string;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const meta = (dict?.metadata as Record<string, any>) || {};
  const seo = (meta?.visaRoadmap as Record<string, string> | undefined) || {};

  const title = seo.title || '';
  const description = seo.description || '';
  const keywords = flattenKeywords(buildKeywords({ title, content: description }));

  return buildPageMetadata({
    locale,
    path: '/guide/visa-roadmap',
    title,
    description,
    siteName: (meta?.home as Record<string, string> | undefined)?.siteName,
    keywords,
  });
}

export default async function VisaRoadmapPage({ params }: PageProps) {
  const { lang } = await params;
  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = (dict?.visaRoadmap || {}) as Record<string, unknown>;

  const label = String(t.label || '');
  const title = String(t.title || '');
  const subtitle = String(t.subtitle || '');
  const askQuestionLabel = String(t.askQuestion || '');
  const relatedQuestionsLabel = String(t.relatedQuestions || '');
  const quickLinksTitle = String(t.quickLinksTitle || '');

  const quickLinks = (t.quickLinks || {}) as Record<string, unknown>;
  const quickVisaQaLabel = String(quickLinks.visaQa || '');
  const quickAskLabel = String(quickLinks.askQuestion || '');
  const quickSearchE7Label = String(quickLinks.searchE7 || '');

  const steps = (Array.isArray(t.steps) ? (t.steps as RoadmapStep[]) : []).map((step) => ({
    badge: step.badge ? String(step.badge) : '',
    title: step.title ? String(step.title) : '',
    desc: step.desc ? String(step.desc) : '',
    query: step.query ? String(step.query) : '',
  }));

  const base = `/${locale}`;

  return (
    <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-10 space-y-8 pb-16">
      <section className="grid gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-gray-700 dark:text-gray-200 mt-2">{subtitle}</p>
          </div>
          <a href={`${base}/posts/new?type=question`} className="text-sm font-semibold text-blue-600">
            {askQuestionLabel}
          </a>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((step) => (
            <div
              key={`${step.badge}-${step.title}`}
              className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800"
            >
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-300 mb-2">{step.badge}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">{step.desc}</p>
              <a
                href={`${base}/search?q=${encodeURIComponent(step.query || step.title)}`}
                className="inline-flex mt-3 text-sm font-semibold text-blue-600"
              >
                {relatedQuestionsLabel}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{quickLinksTitle}</h2>
        <div className="flex flex-wrap gap-3">
          <a className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold" href={`${base}?c=visa`}>
            {quickVisaQaLabel}
          </a>
          <a
            className="rounded-lg border border-blue-200 dark:border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-200"
            href={`${base}/posts/new?type=question`}
          >
            {quickAskLabel}
          </a>
          <a
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200"
            href={`${base}/search?q=E-7`}
          >
            {quickSearchE7Label}
          </a>
        </div>
      </section>
    </main>
  );
}
