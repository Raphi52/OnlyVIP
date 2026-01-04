import { Metadata } from "next";

const BASE_URL = "https://viponly.fun";

export const metadata: Metadata = {
  title: "Legal Notice / Mentions Légales | VipOnly",
  description:
    "VipOnly legal notice and company information. Publisher identification, hosting provider, and contact details.",
  keywords: [
    "legal notice",
    "mentions légales",
    "VipOnly",
    "company information",
    "publisher",
  ],
  openGraph: {
    type: "website",
    title: "Legal Notice | VipOnly",
    description: "VipOnly legal notice and company information.",
    url: `${BASE_URL}/legal`,
    siteName: "VipOnly",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "VipOnly Legal Notice",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Legal Notice | VipOnly",
    description: "VipOnly legal notice and company information.",
  },
  alternates: {
    canonical: `${BASE_URL}/legal`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
