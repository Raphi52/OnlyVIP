import { Metadata } from "next";

const BASE_URL = "https://viponly.fun";

export const metadata: Metadata = {
  title: "Become a VIP Only Creator | Start Earning Today",
  description:
    "Join VIP Only as a creator and start earning from your exclusive content. Share photos, videos, and connect with your fans. Low fees, instant payouts, full control.",
  keywords: [
    "VIP only",
    "VIP Only",
    "become creator",
    "content creator",
    "earn money online",
    "VipOnly",
    "creator platform",
    "monetize content",
    "subscription platform",
    "exclusive content",
  ],
  openGraph: {
    type: "website",
    title: "Become a VIP Only Creator | Start Earning Today",
    description:
      "Join VIP Only as a creator. Share exclusive content, earn from subscriptions and tips, and build your fan community.",
    url: `${BASE_URL}/dashboard/become-creator`,
    siteName: "VIP Only",
    images: [
      {
        url: `${BASE_URL}/api/og?title=${encodeURIComponent("Become a Creator")}&subtitle=${encodeURIComponent("Start Earning on VIP Only")}`,
        width: 1200,
        height: 630,
        alt: "Become a VIP Only Creator",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Become a Creator | VIP Only",
    description: "Join VIP Only and start earning from your exclusive content.",
    images: [
      `${BASE_URL}/api/og?title=${encodeURIComponent("Become a Creator")}&subtitle=${encodeURIComponent("Start Earning on VIP Only")}`,
    ],
  },
  alternates: {
    canonical: `${BASE_URL}/dashboard/become-creator`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BecomeCreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
