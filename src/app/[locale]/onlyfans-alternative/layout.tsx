import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { generateOrganizationSchema, generateVipOnlyFAQSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Best OnlyFans Alternative 2025 | VipOnly - Lower Fees, Crypto Payments",
  description:
    "VipOnly is the best OnlyFans alternative with only 5% fees (vs 20% on OnlyFans). Accept crypto payments, AI chat features, and agency tools. Creators keep 95% of earnings.",
  keywords: [
    "onlyfans alternative",
    "best onlyfans alternative",
    "cheaper than onlyfans",
    "onlyfans cheaper",
    "onlyfans competitor",
    "sites like onlyfans",
    "onlyfans alternative 2025",
    "better than onlyfans",
    "onlyfans low fees",
    "onlyfans 5 percent fee",
    "fansly alternative",
    "creator platform",
  ],
  openGraph: {
    title: "Best OnlyFans Alternative 2025 | VipOnly - 5% Fees vs 20%",
    description:
      "VipOnly is the best OnlyFans alternative. Only 5% platform fee, crypto payments, AI chat, and agency tools. Creators keep 95% of earnings.",
    url: "https://viponly.fun/onlyfans-alternative",
    type: "website",
    images: [
      {
        url: "https://viponly.fun/api/og?title=Best%20OnlyFans%20Alternative&subtitle=5%25%20Fees%20vs%2020%25%20-%20Keep%20More%20Earnings",
        width: 1200,
        height: 630,
        alt: "VipOnly - Best OnlyFans Alternative",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best OnlyFans Alternative 2025 | VipOnly",
    description:
      "VipOnly: 5% fees vs OnlyFans 20%. Crypto payments. AI chat. Keep 95% of your earnings.",
  },
  alternates: {
    canonical: "https://viponly.fun/onlyfans-alternative",
    languages: {
      en: "https://viponly.fun/en/onlyfans-alternative",
      es: "https://viponly.fun/es/onlyfans-alternative",
      fr: "https://viponly.fun/fr/onlyfans-alternative",
      pt: "https://viponly.fun/pt/onlyfans-alternative",
      de: "https://viponly.fun/de/onlyfans-alternative",
    },
  },
};

export default function OnlyFansAlternativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={generateOrganizationSchema()} />
      <JsonLd data={generateVipOnlyFAQSchema()} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Best OnlyFans Alternative - VipOnly",
          description:
            "Compare VipOnly vs OnlyFans. Lower fees, crypto payments, and AI features.",
          url: "https://viponly.fun/onlyfans-alternative",
          isPartOf: {
            "@id": "https://viponly.fun/#website",
          },
          mainEntity: {
            "@type": "ItemList",
            name: "OnlyFans Alternatives Comparison",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                item: {
                  "@type": "Product",
                  name: "VipOnly",
                  description: "Best OnlyFans alternative with 5% fees and crypto payments",
                  brand: { "@type": "Brand", name: "VipOnly" },
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                    description: "Free to join, 5% platform fee on earnings",
                  },
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: "4.9",
                    ratingCount: "500",
                    bestRating: "5",
                  },
                },
              },
              {
                "@type": "ListItem",
                position: 2,
                item: {
                  "@type": "Product",
                  name: "OnlyFans",
                  description: "Popular content subscription platform",
                  brand: { "@type": "Brand", name: "OnlyFans" },
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                    description: "Free to join, 20% platform fee on earnings",
                  },
                },
              },
            ],
          },
        }}
      />
      {children}
    </>
  );
}
