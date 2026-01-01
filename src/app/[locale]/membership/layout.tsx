import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

const BASE_URL = "https://viponly.fun";

export const metadata: Metadata = {
  title: "VIP Only Membership Plans | Exclusive Access",
  description:
    "Choose your VIP Only membership plan. Get access to exclusive content from your favorite creators with flexible subscription options.",
  keywords: [
    "VIP only",
    "VIP Only",
    "membership",
    "subscription",
    "VipOnly",
    "exclusive access",
    "VIP membership",
    "creator subscription",
    "premium content",
  ],
  openGraph: {
    type: "website",
    title: "VIP Only Membership Plans | Exclusive Access",
    description:
      "Choose your VIP Only membership plan and get access to exclusive content from your favorite creators.",
    url: `${BASE_URL}/membership`,
    siteName: "VIP Only",
    images: [
      {
        url: `${BASE_URL}/api/og?title=${encodeURIComponent("VIP Membership")}&subtitle=${encodeURIComponent("Choose Your Plan")}`,
        width: 1200,
        height: 630,
        alt: "VIP Only Membership Plans",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIP Only Membership Plans",
    description: "Choose your plan and unlock exclusive content.",
    images: [
      `${BASE_URL}/api/og?title=${encodeURIComponent("VIP Membership")}&subtitle=${encodeURIComponent("Choose Your Plan")}`,
    ],
  },
  alternates: {
    canonical: `${BASE_URL}/membership`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Membership offers schema
function generateMembershipSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "VIP Only Membership",
    description:
      "Access exclusive content from your favorite creators on VIP Only.",
    brand: {
      "@type": "Brand",
      name: "VIP Only",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "99.99",
      offerCount: "3",
      availability: "https://schema.org/InStock",
    },
    url: `${BASE_URL}/membership`,
  };
}

export default function MembershipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={generateMembershipSchema()} />
      {children}
    </>
  );
}
