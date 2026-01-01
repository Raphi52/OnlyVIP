import { Metadata } from "next";

const BASE_URL = "https://viponly.fun";

export const metadata: Metadata = {
  title: "Buy VIP Only Credits | VIP Only",
  description:
    "Purchase VIP only credits to unlock exclusive content, send tips to your favorite creators, and access VIP only photos and videos. Secure payment with crypto or card.",
  keywords: [
    "VIP only",
    "VIP Only",
    "buy credits",
    "credits",
    "VipOnly",
    "unlock content",
    "tips",
    "crypto payment",
    "exclusive content",
    "VIP content",
  ],
  openGraph: {
    type: "website",
    title: "Buy VIP Only Credits | VIP Only",
    description:
      "Purchase VIP only credits to unlock exclusive content and support your favorite creators.",
    url: `${BASE_URL}/credits`,
    siteName: "VIP Only",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Buy Credits on VipOnly",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Credits | VipOnly",
    description: "Purchase credits to unlock exclusive content on VipOnly.",
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
