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
  const currentUrl = `${baseUrl}/${lang}/faq`;

  return {
    title:
      meta.faq?.title ||
      (lang === 'en'
        ? 'FAQ - viet kconnect'
        : lang === 'vi'
          ? 'Câu hỏi thường gặp - viet kconnect'
          : '자주 묻는 질문 - viet kconnect'),
    description:
      meta.faq?.description ||
      (lang === 'en'
        ? 'Find answers to common questions about using viet kconnect.'
        : lang === 'vi'
          ? 'Giải đáp các câu hỏi phổ biến khi sử dụng viet kconnect.'
          : 'viet kconnect 이용에 관한 자주 묻는 질문을 확인하세요.'),
    alternates: {
      canonical: currentUrl,
      languages: Object.fromEntries(i18n.locales.map((l) => [l, `${baseUrl}/${l}/faq`])),
    },
  };
}

export default async function FaqPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = ((dict as any)?.staticPages?.faq || {}) as Record<string, string>;

  const heading = t.heading || (lang === 'en' ? 'FAQ' : lang === 'vi' ? 'FAQ' : '자주 묻는 질문');
  const intro =
    t.intro ||
    (lang === 'en'
      ? 'Quick answers to help you get started.'
      : lang === 'vi'
        ? 'Câu trả lời nhanh giúp bạn bắt đầu dễ dàng.'
        : '시작에 도움이 되는 빠른 답변을 모았습니다.');

  const items = [
    {
      question:
        t.q1 || (lang === 'en' ? 'How do I find verified answers?' : lang === 'vi' ? 'Làm sao để tìm câu trả lời đã xác minh?' : '검증된 답변은 어떻게 찾나요?'),
      answer:
        t.a1 || (lang === 'en' ? 'Look for Verified/Expert badges on posts and profiles.' : lang === 'vi' ? 'Hãy tìm huy hiệu Đã xác minh/Chuyên gia trên bài viết và hồ sơ.' : '게시글/프로필의 인증·전문가 배지를 확인하세요.'),
    },
    {
      question:
        t.q2 || (lang === 'en' ? 'Where can I manage my subscriptions?' : lang === 'vi' ? 'Tôi quản lý theo dõi ở đâu?' : '구독 관리는 어디서 하나요?'),
      answer:
        t.a2 || (lang === 'en' ? 'Open profile settings to manage categories and topics you follow.' : lang === 'vi' ? 'Mở cài đặt hồ sơ để quản lý danh mục/chủ đề theo dõi.' : '프로필 설정에서 카테고리/토픽 구독을 관리할 수 있어요.'),
    },
    {
      question:
        t.q3 || (lang === 'en' ? 'How do I report incorrect information?' : lang === 'vi' ? 'Báo cáo thông tin sai thế nào?' : '잘못된 정보는 어떻게 신고하나요?'),
      answer:
        t.a3 || (lang === 'en' ? 'Use the report button on each post or answer.' : lang === 'vi' ? 'Dùng nút báo cáo ở mỗi bài viết hoặc câu trả lời.' : '게시글/답변의 신고 버튼을 눌러 주세요.'),
    },
  ];

  return (
    <MainLayout hideSidebar hideSearch translations={dict}>
      <div className="mx-auto max-w-3xl py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{heading}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">{intro}</p>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={`${item.question}-${index}`} className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-5 space-y-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{item.question}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
