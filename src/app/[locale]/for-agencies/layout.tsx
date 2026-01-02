import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { generateOrganizationSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "OnlyFans Agency Management Platform | VipOnly for Agencies",
  description:
    "VipOnly is the best OnlyFans agency management platform. Manage multiple creators, assign chatters, AI-powered messaging, track earnings, and more. Built for agencies.",
  keywords: [
    "onlyfans agency",
    "onlyfans management",
    "onlyfans agency software",
    "onlyfans chatter",
    "onlyfans chatter jobs",
    "manage onlyfans creators",
    "onlyfans agency tools",
    "onlyfans manager",
    "content creator agency",
    "onlyfans business",
  ],
  openGraph: {
    title: "OnlyFans Agency Management Platform | VipOnly",
    description:
      "The best platform for OnlyFans agencies. Manage creators, assign chatters, AI messaging, and track earnings from one dashboard.",
    url: "https://viponly.fun/for-agencies",
    type: "website",
    images: [
      {
        url: "https://viponly.fun/api/og?title=OnlyFans%20Agency%20Platform&subtitle=Manage%20Creators%20%26%20Chatters",
        width: 1200,
        height: 630,
        alt: "VipOnly - OnlyFans Agency Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OnlyFans Agency Management Platform | VipOnly",
    description:
      "Manage multiple creators, assign chatters, and track earnings from one dashboard.",
  },
  alternates: {
    canonical: "https://viponly.fun/for-agencies",
    languages: {
      en: "https://viponly.fun/en/for-agencies",
      es: "https://viponly.fun/es/for-agencies",
      fr: "https://viponly.fun/fr/for-agencies",
      pt: "https://viponly.fun/pt/for-agencies",
      de: "https://viponly.fun/de/for-agencies",
    },
  },
};

export default function ForAgenciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={generateOrganizationSchema()} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "OnlyFans Agency Management Platform - VipOnly",
          description:
            "VipOnly provides the best tools for OnlyFans agencies to manage creators, chatters, and earnings",
          url: "https://viponly.fun/for-agencies",
          isPartOf: {
            "@id": "https://viponly.fun/#website",
          },
          mainEntity: {
            "@type": "SoftwareApplication",
            name: "VipOnly Agency Platform",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              description: "Free to start. Platform takes only 5% of earnings.",
            },
            featureList: [
              "Multi-creator management",
              "Chatter assignment",
              "AI-powered messaging",
              "Earnings tracking by creator",
              "Commission management",
              "Analytics dashboard",
            ],
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is an OnlyFans agency?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "An OnlyFans agency manages multiple content creators, handling their marketing, fan engagement, and business operations. VipOnly provides tools specifically designed for agencies to manage creators efficiently.",
              },
            },
            {
              "@type": "Question",
              name: "How do I start an OnlyFans agency on VipOnly?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sign up for VipOnly, apply to become an agency, and once approved you can add creators to your agency, assign chatters, and manage everything from your agency dashboard.",
              },
            },
            {
              "@type": "Question",
              name: "What are OnlyFans chatters?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Chatters are team members who respond to fan messages on behalf of creators. VipOnly lets agencies assign chatters to specific creators and track their performance.",
              },
            },
          ],
        }}
      />
      {children}
    </>
  );
}
