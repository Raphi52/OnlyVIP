import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://viponly.fun";
  const locales = ["en", "es", "pt", "fr", "de", "it", "zh", "ja", "ko", "ar", "ru", "hi"];

  // Helper pour generer les disallows avec prefixes locale
  const generateLocaleDisallows = (paths: string[]): string[] => {
    const disallows: string[] = [];
    for (const locale of locales) {
      for (const path of paths) {
        disallows.push(`/${locale}${path}`);
      }
    }
    return disallows;
  };

  const privateLocalePaths = [
    "/dashboard/",
    "/chatter/",
    "/admin/",
    "/checkout",
    "/team/",
    "/gallery",
    "/auth/reset-password",
    "/auth/forgot-password",
  ];

  return {
    rules: [
      // 1. Googlebot-Image - Autoriser images
      {
        userAgent: "Googlebot-Image",
        allow: ["/uploads/", "/api/og", "/*.jpg", "/*.png", "/*.webp", "/*.gif"],
      },

      // 2. Moteurs de recherche principaux
      {
        userAgent: ["Googlebot", "Bingbot", "DuckDuckBot"],
        allow: ["/", "/api/og", "/uploads/", "/sitemap.xml"],
        disallow: [
          "/api/",
          "/_next/",
          ...generateLocaleDisallows(privateLocalePaths),
          ...locales.flatMap(l => [`/${l}/*/checkout`, `/${l}/*/auth/`]),
        ],
      },

      // 3. Autres crawlers
      {
        userAgent: "*",
        allow: ["/", "/api/og", "/uploads/"],
        disallow: [
          "/api/",
          "/_next/",
          ...generateLocaleDisallows(privateLocalePaths),
          ...locales.flatMap(l => [`/${l}/*/checkout`, `/${l}/*/auth/`]),
        ],
        crawlDelay: 1,
      },

      // 4. Bloquer bots SEO agressifs
      {
        userAgent: ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot"],
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
