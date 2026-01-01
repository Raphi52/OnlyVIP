import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

const BASE_URL = "https://viponly.fun";

export const metadata: Metadata = {
  title: {
    default: "VIP Only Blog | Exclusive Content Tips & Creator Guides",
    template: "%s | VIP Only Blog",
  },
  description:
    "Discover tips for creators, exclusive content strategies, and guides on VIP Only. Learn how to grow your audience and monetize your content.",
  keywords: [
    "VIP only",
    "VIP Only",
    "creator tips",
    "content creator guide",
    "exclusive content",
    "VIP content",
    "monetization",
    "VipOnly blog",
    "creator economy",
    "fan engagement",
  ],
  openGraph: {
    type: "website",
    title: "VIP Only Blog | Creator Tips & Guides",
    description:
      "Tips and guides for creators and fans on VIP Only platform.",
    url: `${BASE_URL}/blog`,
    siteName: "VIP Only",
    images: [
      {
        url: `${BASE_URL}/api/og?title=${encodeURIComponent("VIP Only Blog")}&subtitle=${encodeURIComponent("Creator Tips & Guides")}`,
        width: 1200,
        height: 630,
        alt: "VIP Only Blog",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIP Only Blog",
    description: "Tips and guides for creators and fans on VIP Only.",
    images: [
      `${BASE_URL}/api/og?title=${encodeURIComponent("VIP Only Blog")}&subtitle=${encodeURIComponent("Creator Tips & Guides")}`,
    ],
  },
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Blog structured data
function generateBlogSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "VIP Only Blog",
    description:
      "Tips, guides, and insights for creators and fans on VIP Only platform.",
    url: `${BASE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: "VIP Only",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    inLanguage: "en-US",
  };
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={generateBlogSchema()} />
      {children}
    </>
  );
}
