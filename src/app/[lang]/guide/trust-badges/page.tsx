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

  const title =
    meta?.trustBadges?.title ||
    (locale === 'en'
      ? 'Trust Badges - viet kconnect'
      : locale === 'vi'
        ? 'Huy hiệu tin cậy - viet kconnect'
        : '신뢰 배지 안내 - viet kconnect');
  const description =
    meta?.trustBadges?.description ||
    (locale === 'en'
      ? 'Learn what each trust badge means and how it is assigned.'
      : locale === 'vi'
        ? 'Tìm hiểu ý nghĩa của từng huy hiệu tin cậy và cách được gán.'
        : '각 신뢰 배지의 의미와 부여 기준을 확인하세요.');

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

  const heading =
    locale === 'en'
      ? 'Trust Badges'
      : locale === 'vi'
        ? 'Huy hiệu tin cậy'
        : '신뢰 배지 안내';
  const subheading =
    locale === 'en'
      ? 'Badges help you quickly judge how trustworthy information is.'
      : locale === 'vi'
        ? 'Huy hiệu giúp bạn nhanh chóng đánh giá mức độ tin cậy của thông tin.'
        : '배지는 정보의 신뢰도를 빠르게 판단하는 데 도움을 줍니다.';

  const homeLabel = locale === 'vi' ? 'Trang chủ' : locale === 'en' ? 'Home' : '홈으로';
  const verifyLabel = locale === 'vi' ? 'Yêu cầu xác minh' : locale === 'en' ? 'Request verification' : '인증 신청';

  const badges: Array<{ id: string; level: TrustLevel; label: string; tooltip: string }>= [
    {
      id: 'verified-user',
      level: 'verified',
      label: tTrust.verifiedUserLabel || (locale === 'vi' ? 'Người dùng đã xác minh' : locale === 'en' ? 'Verified User' : '인증 사용자'),
      tooltip: tTrust.verifiedUserTooltip || (locale === 'vi' ? 'Đã xác minh danh tính' : locale === 'en' ? 'Identity verified' : '신분 서류가 확인된 사용자'),
    },
    {
      id: 'verified-student',
      level: 'verified',
      label: tTrust.verifiedStudentLabel || (locale === 'vi' ? 'Sinh viên đã xác minh' : locale === 'en' ? 'Verified Student' : '학생 인증'),
      tooltip: tTrust.verifiedStudentTooltip || (locale === 'vi' ? 'Đã xác minh tình trạng sinh viên' : locale === 'en' ? 'Student status verified' : '학생 신분이 확인된 사용자'),
    },
    {
      id: 'verified-worker',
      level: 'verified',
      label: tTrust.verifiedWorkerLabel || (locale === 'vi' ? 'Người đi làm đã xác minh' : locale === 'en' ? 'Verified Worker' : '직장/재직 인증'),
      tooltip: tTrust.verifiedWorkerTooltip || (locale === 'vi' ? 'Đã xác minh tình trạng việc làm' : locale === 'en' ? 'Employment status verified' : '재직/직장인 증빙이 확인된 사용자'),
    },
    {
      id: 'trusted-answerer',
      level: 'community',
      label: tTrust.trustedAnswererLabel || (locale === 'vi' ? 'Người trả lời đáng tin' : locale === 'en' ? 'Trusted Answerer' : '신뢰 답변자'),
      tooltip: tTrust.trustedAnswererTooltip || (locale === 'vi' ? 'Được cộng đồng đánh giá tin cậy dựa trên đóng góp' : locale === 'en' ? 'Trusted by community based on contributions' : '커뮤니티 활동 기반 신뢰 답변자'),
    },
    {
      id: 'community',
      level: 'community',
      label: tTrust.communityLabel || (locale === 'vi' ? 'Cộng đồng' : locale === 'en' ? 'Community' : '커뮤니티'),
      tooltip: tTrust.communityTooltip || (locale === 'vi' ? 'Được cộng đồng tin cậy' : locale === 'en' ? 'Trusted by community' : '커뮤니티 신뢰 정보'),
    },
    {
      id: 'expert-visa',
      level: 'expert',
      label: tTrust.expertVisaLabel || (locale === 'vi' ? 'Chuyên gia visa' : locale === 'en' ? 'Visa Expert' : '비자 전문가'),
      tooltip: tTrust.expertVisaTooltip || (locale === 'vi' ? 'Chuyên gia visa/xuất nhập cảnh (đã xác minh)' : locale === 'en' ? 'Verified visa/immigration professional' : '비자/출입국 관련 전문 자격 또는 경력 확인'),
    },
    {
      id: 'expert-employment',
      level: 'expert',
      label: tTrust.expertEmploymentLabel || (locale === 'vi' ? 'Chuyên gia việc làm' : locale === 'en' ? 'Employment Expert' : '취업 전문가'),
      tooltip: tTrust.expertEmploymentTooltip || (locale === 'vi' ? 'Chuyên gia tuyển dụng/career (đã xác minh)' : locale === 'en' ? 'Verified employment/career professional' : '취업/채용 관련 전문 경력 확인'),
    },
    {
      id: 'expert',
      level: 'expert',
      label: tTrust.expertLabel || (locale === 'vi' ? 'Chuyên gia' : locale === 'en' ? 'Expert' : '전문가'),
      tooltip: tTrust.expertTooltip || (locale === 'vi' ? 'Được chuyên gia xem xét' : locale === 'en' ? 'Reviewed by an expert' : '전문가/공식 답변자'),
    },
    {
      id: 'verified',
      level: 'verified',
      label: tTrust.verifiedLabel || (locale === 'vi' ? 'Đã xác minh' : locale === 'en' ? 'Verified' : '검증됨'),
      tooltip: tTrust.verifiedTooltip || (locale === 'vi' ? 'Thông tin từ người dùng đã xác minh' : locale === 'en' ? 'From a verified user' : '인증된 사용자 기반 정보'),
    },
    {
      id: 'outdated',
      level: 'outdated',
      label: tTrust.outdatedLabel || (locale === 'vi' ? 'Hết hạn' : locale === 'en' ? 'Outdated' : '오래된 정보'),
      tooltip: tTrust.outdatedTooltip || (locale === 'vi' ? 'Thông tin hơn 12 tháng trước' : locale === 'en' ? 'More than 12 months old' : '12개월 이상 지난 정보'),
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
