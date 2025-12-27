import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/Providers";
import { PageTracker } from "@/components/analytics/PageTracker";
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
  title: "VipOnly - Exclusive Creator Platform",
  description: "The premium platform for exclusive creators. Share content, connect with fans, and earn from subscriptions.",
  keywords: ["VipOnly", "exclusive content", "creator platform", "premium", "VIP"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <Providers>
          <PageTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
