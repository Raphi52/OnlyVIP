import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { locales } from "@/i18n/config";

// Force dynamic generation (don't pre-render at build time)
export const dynamic = "force-dynamic";
// Revalidate sitemap every hour
export const revalidate = 3600;

// Blog posts slugs for sitemap
const blogPostSlugs = [
  "best-onlyfans-alternatives-2026",
  "how-to-become-successful-creator",
  "maximize-earnings-exclusive-content",
  "engage-your-vip-subscribers",
  "pricing-your-content-guide",
  "growing-audience-social-media",
];

// Helper to generate alternates for a path
function generateAlternates(basePath: string) {
  const languages: Record<string, string> = {};
  locales.forEach((locale) => {
    languages[locale] = `https://viponly.fun/${locale}${basePath}`;
  });
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://viponly.fun";

  // Generate pages for all locales
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Static pages with alternates for each locale
  const staticRoutes = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/creators", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/credits", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/membership", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/dashboard/become-creator", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/auth/login", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/auth/register", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
  ];

  // Add static pages for each locale
  for (const locale of locales) {
    for (const route of staticRoutes) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: generateAlternates(route.path),
      });
    }

    // Blog posts
    for (const slug of blogPostSlugs) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: generateAlternates(`/blog/${slug}`),
      });
    }
  }

  // Dynamic creator pages
  try {
    const creators = await prisma.creator.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    for (const locale of locales) {
      for (const creator of creators) {
        // Creator profile
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/${creator.slug}`,
          lastModified: creator.updatedAt,
          changeFrequency: "daily",
          priority: 0.8,
          alternates: generateAlternates(`/${creator.slug}`),
        });

        // Creator gallery
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/${creator.slug}/gallery`,
          lastModified: creator.updatedAt,
          changeFrequency: "daily",
          priority: 0.7,
          alternates: generateAlternates(`/${creator.slug}/gallery`),
        });

        // Creator membership
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/${creator.slug}/membership`,
          lastModified: creator.updatedAt,
          changeFrequency: "weekly",
          priority: 0.6,
          alternates: generateAlternates(`/${creator.slug}/membership`),
        });
      }
    }
  } catch (error) {
    console.error("Error fetching creators for sitemap:", error);
  }

  return sitemapEntries;
}
