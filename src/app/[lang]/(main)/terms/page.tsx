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
  const currentUrl = `${baseUrl}/${lang}/terms`;

  return {
    title:
      meta.terms?.title ||
      (lang === 'en'
        ? 'Terms - viet kconnect'
        : lang === 'vi'
          ? 'Điều khoản - viet kconnect'
          : '이용약관 - viet kconnect'),
    description:
      meta.terms?.description ||
      (lang === 'en'
        ? 'Review the terms of service for viet kconnect.'
        : lang === 'vi'
          ? 'Xem điều khoản dịch vụ của viet kconnect.'
          : 'viet kconnect 이용약관을 확인하세요.'),
    alternates: {
      canonical: currentUrl,
      languages: Object.fromEntries(i18n.locales.map((l) => [l, `${baseUrl}/${l}/terms`])),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function TermsPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = ((dict as any)?.staticPages?.terms || {}) as Record<string, string>;

  return (
    <MainLayout hideSidebar hideSearch translations={dict}>
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.heading || (lang === 'en' ? 'Terms' : lang === 'vi' ? 'Điều khoản' : '이용약관')}
        </h1>
        <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
          <p>
            {t.body1 ||
              (lang === 'en'
                ? 'By using viet kconnect, you agree to follow community guidelines and applicable laws.'
                : lang === 'vi'
                  ? 'Khi sử dụng viet kconnect, bạn đồng ý tuân thủ nội quy cộng đồng và pháp luật hiện hành.'
                  : 'viet kconnect 이용 시 커뮤니티 가이드와 관련 법규를 준수해야 합니다.')}
          </p>
          <p>
            {t.body2 ||
              (lang === 'en'
                ? 'Do not post illegal content, spam, or personal information without consent.'
                : lang === 'vi'
                  ? 'Không đăng nội dung bất hợp pháp, spam hoặc thông tin cá nhân khi chưa có sự đồng ý.'
                  : '불법 콘텐츠·스팸·동의 없는 개인정보 게시를 금지합니다.')}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
