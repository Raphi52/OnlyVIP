import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

// Force dynamic generation (don't pre-render at build time)
export const dynamic = "force-dynamic";
// Revalidate sitemap every hour
export const revalidate = 3600;

const baseUrl = "https://viponly.fun";

// All supported locales (12 languages)
const allLocales = ["en", "es", "pt", "fr", "de", "it", "zh", "ja", "ko", "ar", "ru", "hi"];

// Blog posts slugs for sitemap
const blogPostSlugs = [
  "pay-onlyfans-with-crypto-bitcoin",
  "onlyfans-alternatives-accept-bitcoin-crypto",
  "how-to-start-onlyfans-agency-2025",
  "onlyfans-chatter-jobs-guide",
  "best-onlyfans-alternatives-2026",
  "how-to-become-successful-creator",
];

// SEO category pages
const categoryPages = [
  "latina", "asian", "mature", "cosplay", "feet",
  "curvy", "ebony", "blonde", "brunette", "petite",
];

// Helper to generate hreflang alternates for all locales
function generateAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of allLocales) {
    alternates[locale] = `${baseUrl}/${locale}${path}`;
  }
  // Add x-default pointing to English
  alternates["x-default"] = `${baseUrl}/en${path}`;
  return alternates;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Static pages
  const staticRoutes = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/creators", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/top-creators", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/crypto", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/onlyfans-alternative", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/for-agencies", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/credits", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
  ];

  // Add static pages with hreflang alternates (one entry per page, English as canonical)
  for (const route of staticRoutes) {
    sitemapEntries.push({
      url: `${baseUrl}/en${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: generateAlternates(route.path),
      },
      images: [`${baseUrl}/api/og?title=VIPOnly`],
    });
  }

  // Blog posts with hreflang
  for (const slug of blogPostSlugs) {
    sitemapEntries.push({
      url: `${baseUrl}/en/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: generateAlternates(`/blog/${slug}`),
      },
      images: [`${baseUrl}/api/og?title=VIP%20Only%20Blog`],
    });
  }

  // Category pages with hreflang
  for (const category of categoryPages) {
    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
    sitemapEntries.push({
      url: `${baseUrl}/en/creators/${category}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.85,
      alternates: {
        languages: generateAlternates(`/creators/${category}`),
      },
      images: [`${baseUrl}/api/og?title=${encodeURIComponent(categoryTitle + ' Creators')}`],
    });
  }

  // Dynamic creator pages (no limit)
  try {
    const creators = await prisma.creator.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true, avatar: true, cardImage: true, displayName: true },
      orderBy: { updatedAt: "desc" },
    });

    for (const creator of creators) {
      // Collect all available images for this creator
      const creatorImages: string[] = [];

      // Add card image (main profile image)
      if (creator.cardImage) {
        creatorImages.push(creator.cardImage.startsWith('http') ? creator.cardImage : `${baseUrl}${creator.cardImage}`);
      }

      // Add avatar
      if (creator.avatar && creator.avatar !== creator.cardImage) {
        creatorImages.push(creator.avatar.startsWith('http') ? creator.avatar : `${baseUrl}${creator.avatar}`);
      }

      // Add OG image as fallback
      if (creatorImages.length === 0) {
        creatorImages.push(`${baseUrl}/api/og?title=${encodeURIComponent(creator.displayName || creator.slug)}`);
      }

      sitemapEntries.push({
        url: `${baseUrl}/en/${creator.slug}`,
        lastModified: creator.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
        alternates: {
          languages: generateAlternates(`/${creator.slug}`),
        },
        images: creatorImages,
      });
    }
  } catch (error) {
    console.error("Error fetching creators for sitemap:", error);
  }

  return sitemapEntries;
}
