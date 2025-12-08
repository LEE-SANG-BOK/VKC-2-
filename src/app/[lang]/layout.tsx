import type { Metadata } from "next";
import { notFound } from 'next/navigation';
import { i18n } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import StructuredData from "@/components/StructuredData";
import QueryProvider from "@/providers/QueryProvider";
import NextTopLoader from 'nextjs-toploader';
import { SessionProvider } from 'next-auth/react';
import ProfileChecker from '@/components/ProfileChecker';
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'viet kconnect - 베트남 한인 커뮤니티',
    template: '%s | viet kconnect',
  },
  description: '베트남 거주 한인을 위한 Q&A 커뮤니티. 기술, 비즈니스, 라이프스타일, 교육 등 다양한 주제의 질문과 답변을 공유하세요.',
  keywords: ['베트남', '한인', '커뮤니티', 'Q&A', '질문', '답변'],
  authors: [{ name: 'viet kconnect Team' }],
  creator: 'viet kconnect',
  publisher: 'viet kconnect',
  applicationName: 'viet kconnect',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'viet kconnect',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    title: 'viet kconnect - 베트남 한인 커뮤니티',
    description: '베트남 거주 한인을 위한 Q&A 커뮤니티',
    siteName: 'viet kconnect',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'viet kconnect 커뮤니티',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'viet kconnect - 베트남 한인 커뮤니티',
    description: '베트남 거주 한인을 위한 Q&A 커뮤니티',
    images: ['/og-image.jpg'],
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
  manifest: '/manifest.json',
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

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* canonical is handled by metadataBase */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <StructuredData />
      </head>
      <body className="antialiased" suppressHydrationWarning>
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
            {children}
            <Toaster position="top-center" richColors />
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
