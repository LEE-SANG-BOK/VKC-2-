import { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import FeedbackClient from './FeedbackClient';

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const meta = (dict?.metadata as Record<string, unknown>) || {};
  const t = (meta.feedback || {}) as Record<string, string>;
  const fallback = (() => {
    if (lang === 'en') {
      return {
        title: 'Feedback & bug reports - viet kconnect',
        description: 'Send feedback and bug reports to improve the service.',
      };
    }
    if (lang === 'vi') {
      return {
        title: 'Phản hồi & báo lỗi - viet kconnect',
        description: 'Gửi phản hồi và báo lỗi để cải thiện dịch vụ.',
      };
    }
    return {
      title: '피드백/버그 제보 - viet kconnect',
      description: '서비스 개선을 위한 피드백과 버그 제보를 접수합니다.',
    };
  })();

  return {
    title: t.title || fallback.title,
    description: t.description || fallback.description,
  };
}

export default async function FeedbackPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <FeedbackClient translations={dict} lang={lang} />;
}
