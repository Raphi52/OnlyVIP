import { Metadata } from "next";
import { getCreatorFromDB } from "@/lib/creators";
import { JsonLd } from "@/components/seo/JsonLd";
import { generateImageGallerySchema } from "@/lib/seo";

const BASE_URL = "https://viponly.fun";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ creator: string }>;
}

// Generate dynamic metadata for gallery pages
export async function generateMetadata({
  params,
}: {
  params: Promise<{ creator: string }>;
}): Promise<Metadata> {
  const { creator: creatorSlug } = await params;
  const creator = await getCreatorFromDB(creatorSlug);

  if (!creator) {
    return {
      title: "Gallery Not Found | VIP Only",
      description: "This gallery does not exist.",
    };
  }

  const title = `${creator.displayName}'s VIP Only Gallery - Photos & Videos`;
  const description = `Browse ${creator.displayName}'s VIP only exclusive photo and video gallery. ${creator.stats?.photos || 0} photos, ${creator.stats?.videos || 0} videos available for VIP only subscribers.`;
  const canonicalUrl = `${BASE_URL}/${creator.slug}/gallery`;
  const ogImage = creator.cardImage || creator.avatar || `${BASE_URL}/og-image.png`;

  return {
    title,
    description,
    keywords: [
      "VIP only",
      "VIP Only",
      creator.displayName,
      "gallery",
      "photos",
      "videos",
      "exclusive content",
      "VIP content",
      "VipOnly",
    ],
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalUrl,
      siteName: "VIP Only",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${creator.displayName}'s VIP only gallery`,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function GalleryLayout({ children, params }: LayoutProps) {
  const { creator: creatorSlug } = await params;
  const creator = await getCreatorFromDB(creatorSlug);

  if (!creator) {
    return <>{children}</>;
  }

  return (
    <>
      <JsonLd
        data={generateImageGallerySchema(
          creator,
          creator.stats?.photos || 0,
          creator.stats?.videos || 0
        )}
      />
      {children}
    </>
  );
}
