import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://viponly.fun"),
  title: {
    default: "VIPOnly - Exclusive Creator Platform",
    template: "%s | VIPOnly",
  },
  description:
    "VIPOnly - The premium platform for exclusive creators. Share VIP content, connect with fans, and earn from subscriptions. Join the best creator platform.",
  keywords: [
    "VIPOnly",
    "viponly",
    "viponly.fun",
    "exclusive content",
    "creator platform",
    "premium content",
    "VIP subscription",
    "creator subscription",
    "exclusive photos",
    "exclusive videos",
  ],
  authors: [{ name: "VIPOnly" }],
  creator: "VIPOnly",
  publisher: "VIPOnly",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://viponly.fun",
    siteName: "VIPOnly",
    title: "VIPOnly - Exclusive Creator Platform",
    description:
      "The premium platform for exclusive creators. Share VIP content, connect with fans, and earn from subscriptions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIPOnly - Exclusive Creator Platform",
    description:
      "The premium platform for exclusive creators. Share VIP content, connect with fans, and earn from subscriptions.",
    creator: "@VIPOnly",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "your-google-verification-code",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;

  return (
    <html lang={locale || 'en'} className="dark">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
