import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { generateOrganizationSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pay with Crypto on VipOnly | Bitcoin, Ethereum, USDT Accepted",
  description:
    "VipOnly accepts cryptocurrency payments including Bitcoin (BTC), Ethereum (ETH), USDT, and more. Pay anonymously for exclusive content without bank statements. The best OnlyFans alternative for crypto users.",
  keywords: [
    "onlyfans crypto",
    "pay onlyfans with bitcoin",
    "onlyfans bitcoin",
    "onlyfans ethereum",
    "crypto adult content",
    "anonymous onlyfans payment",
    "onlyfans alternative crypto",
    "pay with crypto adult",
    "bitcoin adult content",
    "onlyfans usdt",
  ],
  openGraph: {
    title: "Pay with Crypto on VipOnly | Bitcoin, Ethereum, USDT",
    description:
      "Unlike OnlyFans, VipOnly accepts Bitcoin, Ethereum, USDT and other cryptocurrencies. Pay anonymously without bank statements.",
    url: "https://viponly.fun/crypto",
    type: "website",
    images: [
      {
        url: "https://viponly.fun/api/og?title=Pay%20with%20Crypto&subtitle=Bitcoin%2C%20Ethereum%2C%20USDT%20Accepted",
        width: 1200,
        height: 630,
        alt: "VipOnly - Pay with Crypto",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pay with Crypto on VipOnly | Bitcoin, Ethereum, USDT",
    description:
      "Unlike OnlyFans, VipOnly accepts Bitcoin, Ethereum, USDT and other cryptocurrencies.",
  },
  alternates: {
    canonical: "https://viponly.fun/crypto",
    languages: {
      en: "https://viponly.fun/en/crypto",
      es: "https://viponly.fun/es/crypto",
      fr: "https://viponly.fun/fr/crypto",
      pt: "https://viponly.fun/pt/crypto",
      de: "https://viponly.fun/de/crypto",
    },
  },
};

export default function CryptoLayout({
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
          name: "Pay with Cryptocurrency on VipOnly",
          description:
            "VipOnly accepts Bitcoin, Ethereum, USDT and other cryptocurrencies for anonymous payments",
          url: "https://viponly.fun/crypto",
          isPartOf: {
            "@id": "https://viponly.fun/#website",
          },
          mainEntity: {
            "@type": "Service",
            name: "Cryptocurrency Payments",
            provider: {
              "@id": "https://viponly.fun/#organization",
            },
            description:
              "Pay for exclusive content with Bitcoin, Ethereum, USDT and other cryptocurrencies",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              description: "Free to join. Pay with crypto for subscriptions and content.",
            },
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
              name: "Does VipOnly accept Bitcoin?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes! VipOnly accepts Bitcoin (BTC), Ethereum (ETH), USDT, and many other cryptocurrencies. Unlike OnlyFans, we provide full crypto payment support.",
              },
            },
            {
              "@type": "Question",
              name: "Is paying with crypto on VipOnly anonymous?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, cryptocurrency payments on VipOnly are anonymous. No bank statements, no credit card records. Your privacy is protected.",
              },
            },
            {
              "@type": "Question",
              name: "Why doesn't OnlyFans accept crypto?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "OnlyFans does not accept cryptocurrency payments. VipOnly is the best OnlyFans alternative that accepts Bitcoin, Ethereum, and other cryptocurrencies.",
              },
            },
          ],
        }}
      />
      {children}
    </>
  );
}
