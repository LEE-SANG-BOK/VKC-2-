import type { Metadata } from 'next';
import MainLayout from '@/components/templates/MainLayout';
import { getDictionary } from '@/i18n/get-dictionary';
import { i18n, type Locale } from '@/i18n/config';

type PageProps = {
  params: Promise<{ lang: Locale }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const meta = dict.metadata as Record<string, any>;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const currentUrl = `${baseUrl}/${lang}/privacy`;

  return {
    title:
      meta.privacy?.title ||
      (lang === 'en'
        ? 'Privacy - viet kconnect'
        : lang === 'vi'
          ? 'Quyền riêng tư - viet kconnect'
          : '개인정보처리방침 - viet kconnect'),
    description:
      meta.privacy?.description ||
      (lang === 'en'
        ? 'Learn how viet kconnect handles your data.'
        : lang === 'vi'
          ? 'Tìm hiểu cách viet kconnect xử lý dữ liệu của bạn.'
          : 'viet kconnect의 개인정보 처리 방침을 확인하세요.'),
    alternates: {
      canonical: currentUrl,
      languages: Object.fromEntries(i18n.locales.map((l) => [l, `${baseUrl}/${l}/privacy`])),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = ((dict as any)?.staticPages?.privacy || {}) as Record<string, string>;

  return (
    <MainLayout hideSidebar hideSearch translations={dict}>
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.heading || (lang === 'en' ? 'Privacy' : lang === 'vi' ? 'Quyền riêng tư' : '개인정보처리방침')}
        </h1>
        <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
          <p>
            {t.body1 ||
              (lang === 'en'
                ? 'We collect and process only the data necessary to provide the service.'
                : lang === 'vi'
                  ? 'Chúng tôi chỉ thu thập và xử lý dữ liệu cần thiết để cung cấp dịch vụ.'
                  : '서비스 제공에 필요한 범위에서만 데이터를 수집·처리합니다.')}
          </p>
          <p>
            {t.body2 ||
              (lang === 'en'
                ? 'You can request deletion of your account and related data at any time.'
                : lang === 'vi'
                  ? 'Bạn có thể yêu cầu xóa tài khoản và dữ liệu liên quan bất cứ lúc nào.'
                  : '언제든 계정 및 관련 데이터 삭제를 요청할 수 있습니다.')}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
