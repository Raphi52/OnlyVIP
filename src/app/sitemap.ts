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

  // Add static pages for all locales with hreflang alternates
  for (const locale of allLocales) {
    for (const route of staticRoutes) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: generateAlternates(route.path),
        },
      });
    }

    // Blog posts with hreflang
    for (const slug of blogPostSlugs) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: {
          languages: generateAlternates(`/blog/${slug}`),
        },
      });
    }

    // Category pages with hreflang
    for (const category of categoryPages) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/creators/${category}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.85,
        alternates: {
          languages: generateAlternates(`/creators/${category}`),
        },
      });
    }
  }

  // Dynamic creator pages (no limit)
  try {
    const creators = await prisma.creator.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    for (const locale of allLocales) {
      for (const creator of creators) {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/${creator.slug}`,
          lastModified: creator.updatedAt,
          changeFrequency: "daily" as const,
          priority: 0.8,
          alternates: {
            languages: generateAlternates(`/${creator.slug}`),
          },
        });
      }
    }
  } catch (error) {
    console.error("Error fetching creators for sitemap:", error);
  }

  return sitemapEntries;
}
