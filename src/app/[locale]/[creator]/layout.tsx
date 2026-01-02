import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getCreatorFromDB } from "@/lib/creators";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  generateProfilePageSchema,
  generateCreatorSchema,
} from "@/lib/seo";

const BASE_URL = "https://viponly.fun";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; creator: string }>;
}

// All supported locales for hreflang
const allLocales = ["en", "es", "pt", "fr", "de", "it", "zh", "ja", "ko", "ar", "ru", "hi"];

// Generate dynamic metadata for creator pages
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; creator: string }>;
}): Promise<Metadata> {
  const { locale, creator: creatorSlug } = await params;
  const creator = await getCreatorFromDB(creatorSlug);

  if (!creator) {
    return {
      title: "Creator Not Found | VipOnly",
      description: "This creator page does not exist.",
    };
  }

  const title = `${creator.displayName} - VIP Only Exclusive Content`;
  const description =
    creator.bio ||
    `Subscribe to ${creator.displayName} for VIP only exclusive photos, videos, and premium content on VIP Only.`;
  const canonicalUrl = `${BASE_URL}/${creator.slug}`;
  const creatorImage = creator.avatar || creator.cardImage;
  const ogImageUrl = creatorImage
    ? `${BASE_URL}/api/og?type=creator&title=${encodeURIComponent(creator.displayName)}&subtitle=${encodeURIComponent("VIP Only Exclusive Content")}&image=${encodeURIComponent(creatorImage.startsWith("http") ? creatorImage : BASE_URL + creatorImage)}`
    : `${BASE_URL}/api/og?title=${encodeURIComponent(creator.displayName)}&subtitle=${encodeURIComponent("VIP Only Exclusive Content")}`;

  return {
    title,
    description,
    keywords: [
      "VIP only",
      "VIP Only",
      creator.displayName,
      creator.name,
      "exclusive content",
      "VIP content",
      "VIP subscription",
      "creator",
      "photos",
      "videos",
      "VipOnly",
    ],
    authors: [{ name: creator.displayName }],
    creator: creator.displayName,
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonicalUrl,
      siteName: "VIP Only",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${creator.displayName} on VipOnly`,
        },
      ],
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      creator: creator.socialLinks?.twitter
        ? `@${creator.socialLinks.twitter.split("/").pop()}`
        : "@VipOnly",
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/${creator.slug}`,
      languages: Object.fromEntries([
        ...allLocales.map(loc => [loc, `${BASE_URL}/${loc}/${creator.slug}`]),
        ['x-default', `${BASE_URL}/en/${creator.slug}`],
      ]),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function CreatorLayout({ children, params }: LayoutProps) {
  const { creator: creatorSlug } = await params;
  const creator = await getCreatorFromDB(creatorSlug);

  if (!creator) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={[
          generateProfilePageSchema(creator),
          generateCreatorSchema(creator),
        ]}
      />
      {children}
    </>
  );
}
