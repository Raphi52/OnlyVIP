import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { Providers } from "@/components/Providers";
import { PageTracker } from "@/components/analytics/PageTracker";
import { AgeGate } from "@/components/AgeGate";
import { MediaProtection } from "@/components/MediaProtection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
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

  const isEnglish = locale === 'en';

  return {
    title: {
      default: t('title'),
      template: '%s | VipOnly',
    },
    description: t('description'),
    keywords: [
      "VipOnly",
      "viponly",
      "vip only",
      isEnglish ? "exclusive content" : "contenu exclusif",
      isEnglish ? "creator platform" : "plateforme créateur",
      isEnglish ? "premium content" : "contenu premium",
      isEnglish ? "OnlyFans alternative" : "alternative OnlyFans",
    ],
    authors: [{ name: "VipOnly" }],
    creator: "VipOnly",
    publisher: "VipOnly",
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `https://viponly.fun/${locale}`,
      siteName: "VipOnly",
      images: [
        {
          url: `/api/og?title=VipOnly&subtitle=${isEnglish ? 'Exclusive%20Content' : 'Contenu%20Exclusif'}`,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      locale: isEnglish ? 'en_US' : 'fr_FR',
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t('title'),
      description: t('description'),
      images: [`/api/og?title=VipOnly&subtitle=${isEnglish ? 'Exclusive%20Content' : 'Contenu%20Exclusif'}`],
    },
    alternates: {
      canonical: `https://viponly.fun/${locale}`,
      languages: {
        'en': 'https://viponly.fun/en',
        'fr': 'https://viponly.fun/fr',
        'x-default': 'https://viponly.fun/en',
      },
    },
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
        <PageTracker />
        <JsonLd
          data={[generateOrganizationSchema(), generateWebsiteSchema()]}
        />
        {children}
      </Providers>
    </NextIntlClientProvider>
  );
}
