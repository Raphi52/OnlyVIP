import { Metadata } from "next";

const BASE_URL = "https://viponly.fun";

export const metadata: Metadata = {
  title: "Buy VIPOnly Credits | VIPOnly",
  description:
    "Purchase VIPOnly credits to unlock exclusive content, send tips to your favorite creators, and access VIPOnly photos and videos. Secure payment with crypto or card.",
  keywords: [
    "VIPOnly",
    "viponly",
    "viponly.fun",
    "buy credits",
    "credits",
    "unlock content",
    "tips",
    "crypto payment",
    "exclusive content",
    "VIP content",
  ],
  openGraph: {
    type: "website",
    title: "Buy VIPOnly Credits | VIPOnly",
    description:
      "Purchase VIPOnly credits to unlock exclusive content and support your favorite creators.",
    url: `${BASE_URL}/credits`,
    siteName: "VIPOnly",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Buy Credits on VIPOnly",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Credits | VIPOnly",
    description: "Purchase credits to unlock exclusive content on VIPOnly.",
    images: [`${BASE_URL}/og-image.png`],
  },
  alternates: {
    canonical: `${BASE_URL}/credits`,
  },
};

export default function CreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
