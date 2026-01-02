import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

const BASE_URL = "https://viponly.fun";

export const metadata: Metadata = {
  title: "Discover VIPOnly Creators — Exclusive Content Platform | VIPOnly",
  description:
    "Browse and discover the best exclusive content creators on VIPOnly. Subscribe to VIPOnly creators and access premium photos, videos, and exclusive content. The best OnlyFans alternative in 2026.",
  keywords: [
    "VIPOnly",
    "viponly",
    "viponly.fun",
    "discover creators",
    "exclusive content creators",
    "VIPOnly creators",
    "premium creators",
    "content subscription",
    "creator platform",
    "exclusive photos",
    "exclusive videos",
    "onlyfans alternative",
    "best creator platform 2026",
  ],
  openGraph: {
    type: "website",
    title: "Discover VIPOnly Creators — Exclusive Content | VIPOnly",
    description:
      "Browse the best exclusive content creators on VIPOnly. Subscribe for VIPOnly photos, videos, and premium content.",
    url: `${BASE_URL}/creators`,
    siteName: "VIPOnly",
    images: [
      {
        url: `${BASE_URL}/api/og?title=Discover%20VIPOnly%20Creators&subtitle=Exclusive%20Content%20Platform`,
        width: 1200,
        height: 630,
        alt: "Discover VIPOnly Creators",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover VIPOnly Creators | VIPOnly",
    description:
      "Browse and discover exclusive content creators on VIPOnly — the best OnlyFans alternative.",
    images: [`${BASE_URL}/api/og?title=Discover%20VIPOnly%20Creators&subtitle=Exclusive%20Content%20Platform`],
  },
  alternates: {
    canonical: `${BASE_URL}/creators`,
  },
};

function generateCollectionPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Discover VIPOnly Creators",
    description: "Browse and discover the best exclusive content creators on VIPOnly.",
    url: `${BASE_URL}/creators`,
    isPartOf: {
      "@type": "WebSite",
      name: "VIPOnly",
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
