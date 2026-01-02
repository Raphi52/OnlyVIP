import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { Providers } from "@/components/Providers";
import { PageTracker } from "@/components/analytics/PageTracker";
import { AgeGate } from "@/components/AgeGate";
import { CookieConsent } from "@/components/CookieConsent";
import { MediaProtection } from "@/components/MediaProtection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateSoftwareApplicationSchema,
  generateVipOnlyFAQSchema,
} from "@/lib/seo";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: {
      default: t('title'),
      template: '%s | VipOnly - viponly.fun',
    },
    description: t('description'),
    keywords: [
      "VipOnly",
      "viponly",
      "viponly.fun",
      "VipOnly platform",
      "VipOnly creators",
      "VipOnly exclusive",
      "VipOnly content",
      "VipOnly subscribe",
      "exclusive content platform",
      "creator platform",
      "premium content",
      "OnlyFans alternative",
      "fan subscription platform",
    ],
    authors: [{ name: "VipOnly" }],
    creator: "VipOnly",
    publisher: "VipOnly",
    applicationName: "VipOnly",
    generator: "VipOnly",
    referrer: "origin-when-cross-origin",
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `https://viponly.fun/${locale}`,
      siteName: "VipOnly",
      images: [
        {
          url: `/api/og?title=VipOnly&subtitle=Exclusive%20Content%20Platform`,
          width: 1200,
          height: 630,
          alt: "VipOnly - Exclusive Content Platform",
        },
      ],
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t('title'),
      description: t('description'),
      site: "@VipOnly",
      creator: "@VipOnly",
      images: [`/api/og?title=VipOnly&subtitle=Exclusive%20Content%20Platform`],
    },
    alternates: {
      canonical: `https://viponly.fun/${locale}`,
      languages: {
        'en': 'https://viponly.fun/en',
        'es': 'https://viponly.fun/es',
        'pt': 'https://viponly.fun/pt',
        'fr': 'https://viponly.fun/fr',
        'de': 'https://viponly.fun/de',
        'it': 'https://viponly.fun/it',
        'zh': 'https://viponly.fun/zh',
        'ja': 'https://viponly.fun/ja',
        'ko': 'https://viponly.fun/ko',
        'ar': 'https://viponly.fun/ar',
        'ru': 'https://viponly.fun/ru',
        'hi': 'https://viponly.fun/hi',
        'x-default': 'https://viponly.fun/en',
      },
    },
    category: 'entertainment',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <MediaProtection />
        <AgeGate />
        <CookieConsent />
        <PageTracker />
        <JsonLd
          data={[
            generateOrganizationSchema(),
            generateWebsiteSchema(),
            generateSoftwareApplicationSchema(),
            generateVipOnlyFAQSchema(),
          ]}
        />
        {children}
      </Providers>
    </NextIntlClientProvider>
  );
}
