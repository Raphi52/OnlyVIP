import { Metadata } from "next";

const BASE_URL = "https://viponly.fun";

export const metadata: Metadata = {
  title: "Terms of Service | VipOnly",
  description:
    "Read VipOnly's Terms of Service. Learn about our policies, user agreements, subscriptions, content guidelines, and your rights as a user or creator.",
  keywords: [
    "terms of service",
    "terms and conditions",
    "user agreement",
    "VipOnly",
    "legal",
    "policies",
  ],
  openGraph: {
    type: "website",
    title: "Terms of Service | VipOnly",
    description:
      "Read VipOnly's Terms of Service and user agreements.",
    url: `${BASE_URL}/terms`,
    siteName: "VipOnly",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "VipOnly Terms of Service",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | VipOnly",
    description: "Read VipOnly's Terms of Service and user agreements.",
  },
  alternates: {
    canonical: `${BASE_URL}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
