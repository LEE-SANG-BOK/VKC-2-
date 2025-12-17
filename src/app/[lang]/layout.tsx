import type { Metadata } from "next";
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { i18n } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import StructuredData from "@/components/organisms/StructuredData";
import BottomNavigation from '@/components/organisms/BottomNavigation';
import QueryProvider from "@/providers/QueryProvider";
import NextTopLoader from 'nextjs-toploader';
import { SessionProvider } from 'next-auth/react';
import ProfileChecker from '@/components/organisms/ProfileChecker';
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://viet-kconnect-renew-nextjs.vercel.app';
const ogLocaleMap: Record<Locale, string> = {
  ko: 'ko_KR',
  en: 'en_US',
  vi: 'vi_VN',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;

  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const meta = (dict?.metadata?.home || {}) as Record<string, string>;
  const title = meta.title || 'viet kconnect - 베트남 한인 커뮤니티';
  const description =
    meta.description ||
    '베트남 거주 한인을 위한 Q&A 커뮤니티. 기술, 비즈니스, 라이프스타일, 교육 등 다양한 주제의 질문과 답변을 공유하세요.';
  const siteName = meta.siteName || 'viet kconnect';

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      languages: Object.fromEntries(i18n.locales.map((l) => [l, `${siteUrl}/${l}`])),
    },
    keywords: ['베트남', '한인', '커뮤니티', 'Q&A', '질문', '답변'],
    authors: [{ name: 'viet kconnect Team' }],
    creator: 'viet kconnect',
    publisher: 'viet kconnect',
    applicationName: 'viet kconnect',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteName,
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: ogLocaleMap[locale] || 'vi_VN',
      url: `${siteUrl}/${locale}`,
      title,
      description,
      siteName,
      images: [
        {
          url: '/brand-logo.png',
          width: 208,
          height: 98,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/brand-logo.png'],
      creator: '@vietkconnect',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: 'verification_token',
      yandex: 'verification_token',
    },
    icons: {
      apple: '/icon-192x192.png',
    },
    manifest: '/manifest.json',
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
};

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { lang } = await params;

  // Ensure that the incoming `lang` is valid
  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }

  const translations = await getDictionary(lang as Locale);

  return (
    <>
      <NextTopLoader
        color="#2563eb"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #2563eb,0 0 5px #2563eb"
      />
      <QueryProvider>
        <SessionProvider basePath="/api/auth">
          <ProfileChecker locale={lang} />
          <StructuredData locale={lang as Locale} />
          <div className="vk-safe-bottom">
            {children}
            <Suspense fallback={null}>
              <BottomNavigation translations={translations} />
            </Suspense>
          </div>
          <Toaster position="top-center" richColors />
        </SessionProvider>
      </QueryProvider>
    </>
  );
}
