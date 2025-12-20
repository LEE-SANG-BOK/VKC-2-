import type { Metadata } from 'next';
import MainLayout from '@/components/templates/MainLayout';
import { getDictionary } from '@/i18n/get-dictionary';
import { i18n, type Locale } from '@/i18n/config';
import { SITE_URL } from '@/lib/siteUrl';

type PageProps = {
  params: Promise<{ lang: Locale }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const meta = dict.metadata as Record<string, any>;
  const baseUrl = SITE_URL;
  const currentUrl = `${baseUrl}/${lang}/about`;

  return {
    title:
      meta.about?.title ||
      (lang === 'en'
        ? 'About - viet kconnect'
        : lang === 'vi'
          ? 'Giới thiệu - viet kconnect'
          : '소개 - viet kconnect'),
    description:
      meta.about?.description ||
      (lang === 'en'
        ? 'Learn what viet kconnect is and how it works.'
        : lang === 'vi'
          ? 'Tìm hiểu về viet kconnect và cách hoạt động.'
          : 'viet kconnect 소개 및 운영 방식.'),
    alternates: {
      canonical: currentUrl,
      languages: Object.fromEntries(i18n.locales.map((l) => [l, `${baseUrl}/${l}/about`])),
    },
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = ((dict as any)?.staticPages?.about || {}) as Record<string, string>;

  return (
    <MainLayout hideSidebar hideSearch translations={dict}>
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.heading || (lang === 'en' ? 'About' : lang === 'vi' ? 'Giới thiệu' : '소개')}
        </h1>
        <p className="mt-4 text-base text-gray-700 dark:text-gray-200 leading-relaxed">
          {t.body ||
            (lang === 'en'
              ? 'viet kconnect is a Q&A community for Vietnamese and Koreans to share practical information about visas, jobs, and life in Korea.'
              : lang === 'vi'
                ? 'viet kconnect là cộng đồng hỏi đáp để người Việt và người Hàn chia sẻ thông tin thiết thực về visa, công việc và cuộc sống tại Hàn Quốc.'
                : 'viet kconnect는 비자·취업·한국 생활 정보를 나누는 Q&A 커뮤니티입니다.')}
        </p>
      </div>
    </MainLayout>
  );
}
