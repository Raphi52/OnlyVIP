import { Metadata } from "next";

const BASE_URL = "https://viponly.fun";

export const metadata: Metadata = {
  title: "Privacy Policy | VipOnly",
  description:
    "Read VipOnly's Privacy Policy. Learn how we collect, use, and protect your personal information. Your privacy and data security are our priority.",
  keywords: [
    "privacy policy",
    "data protection",
    "personal information",
    "VipOnly",
    "privacy",
    "security",
    "GDPR",
  ],
  openGraph: {
    type: "website",
    title: "Privacy Policy | VipOnly",
    description:
      "Learn how VipOnly collects, uses, and protects your personal information.",
    url: `${BASE_URL}/privacy`,
    siteName: "VipOnly",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "VipOnly Privacy Policy",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | VipOnly",
    description: "Learn how VipOnly protects your personal information.",
  },
  alternates: {
    canonical: `${BASE_URL}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
