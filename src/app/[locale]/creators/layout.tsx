import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

const BASE_URL = "https://viponly.fun";

export const metadata: Metadata = {
  title: "Discover VIP Creators — Exclusive Content Platform | VIP Only",
  description:
    "Browse and discover the best exclusive content creators on VIP Only. Subscribe to VIP creators and access premium photos, videos, and exclusive content. The best OnlyFans alternative in 2026.",
  keywords: [
    "VIP only",
    "VIP Only",
    "discover creators",
    "exclusive content creators",
    "VIP creators",
    "premium creators",
    "content subscription",
    "VipOnly",
    "creator platform",
    "exclusive photos",
    "exclusive videos",
    "onlyfans alternative",
    "best creator platform 2026",
  ],
  openGraph: {
    type: "website",
    title: "Discover VIP Creators — Exclusive Content | VIP Only",
    description:
      "Browse the best exclusive content creators on VIP Only. Subscribe for VIP only photos, videos, and premium content.",
    url: `${BASE_URL}/creators`,
    siteName: "VIP Only",
    images: [
      {
        url: `${BASE_URL}/api/og?title=Discover%20VIP%20Creators&subtitle=Exclusive%20Content%20Platform`,
        width: 1200,
        height: 630,
        alt: "Discover VIP Creators on VipOnly",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover VIP Creators | VIP Only",
    description:
      "Browse and discover exclusive content creators on VipOnly — the best OnlyFans alternative.",
    images: [`${BASE_URL}/api/og?title=Discover%20VIP%20Creators&subtitle=Exclusive%20Content%20Platform`],
  },
  alternates: {
    canonical: `${BASE_URL}/creators`,
  },
};

function generateCollectionPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Discover VIP Creators",
    description: "Browse and discover the best exclusive content creators on VIP Only.",
    url: `${BASE_URL}/creators`,
    isPartOf: {
      "@type": "WebSite",
      name: "VIP Only",
      url: BASE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      name: "VIP Content Creators",
      description: "Exclusive content creators sharing premium photos and videos",
      itemListElement: [],
    },
  };
}

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={generateCollectionPageSchema()} />
      {children}
    </>
  );
}
