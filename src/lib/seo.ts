// SEO utilities for generating JSON-LD structured data
// Schema.org compliant structured data for better search engine visibility

import type { Creator } from "@/lib/creators";

const BASE_URL = "https://viponly.fun";

// Organization schema for the homepage
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VIP Only",
    alternateName: ["VipOnly", "VIP only"],
    url: BASE_URL,
    logo: `${BASE_URL}/icon`,
    description:
      "VIP Only is a premium content platform where creators share exclusive photos, videos, and VIP only content with their subscribers. The best VIP only creator platform.",
    sameAs: [
      "https://twitter.com/VipOnly",
      // Add more social links as needed
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@viponly.fun",
      contactType: "customer support",
    },
  };
}

// Website schema for the homepage
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VIP Only",
    alternateName: ["VipOnly", "VIP only"],
    url: BASE_URL,
    description:
      "VIP Only - Premium exclusive content platform for creators and fans. The best VIP only subscription platform.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/creators?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Person/Creator schema for creator pages
export function generateCreatorSchema(creator: Creator) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator.displayName,
    alternateName: creator.name,
    url: `${BASE_URL}/${creator.slug}`,
    image: creator.avatar || creator.cardImage,
    description: creator.bio,
    sameAs: [
      creator.socialLinks?.instagram,
      creator.socialLinks?.twitter,
      creator.socialLinks?.tiktok,
    ].filter(Boolean),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/FollowAction",
        userInteractionCount: creator.stats?.subscribers || 0,
      },
    ],
  };
}

// ProfilePage schema for creator profile
export function generateProfilePageSchema(creator: Creator) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${creator.displayName} on VipOnly`,
    url: `${BASE_URL}/${creator.slug}`,
    description: creator.bio,
    mainEntity: generateCreatorSchema(creator),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: BASE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Creators",
          item: `${BASE_URL}/creators`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: creator.displayName,
          item: `${BASE_URL}/${creator.slug}`,
        },
      ],
    },
  };
}

// Offer schema for subscription/pricing
export function generateSubscriptionOfferSchema(
  creator: Creator,
  pricing: {
    name: string;
    price: number;
    currency?: string;
    description?: string;
  }
) {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: pricing.name,
    description:
      pricing.description ||
      `Subscribe to ${creator.displayName}'s exclusive content`,
    price: pricing.price,
    priceCurrency: pricing.currency || "USD",
    availability: "https://schema.org/InStock",
    seller: {
      "@type": "Person",
      name: creator.displayName,
      url: `${BASE_URL}/${creator.slug}`,
    },
    itemOffered: {
      "@type": "Service",
      name: `${creator.displayName} VIP Subscription`,
      description: `Access to exclusive photos, videos, and VIP content from ${creator.displayName}`,
    },
  };
}

// ImageGallery schema for gallery pages
export function generateImageGallerySchema(
  creator: Creator,
  imageCount: number,
  videoCount: number
) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: `${creator.displayName}'s Gallery`,
    description: `Exclusive photo and video gallery featuring ${imageCount} photos and ${videoCount} videos from ${creator.displayName}`,
    url: `${BASE_URL}/${creator.slug}/gallery`,
    author: {
      "@type": "Person",
      name: creator.displayName,
      url: `${BASE_URL}/${creator.slug}`,
    },
    numberOfItems: imageCount + videoCount,
    isAccessibleForFree: false,
  };
}

// Product schema for credits purchase
export function generateCreditsProductSchema(credits: number, price: number) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${credits.toLocaleString()} VipOnly Credits`,
    description: `Purchase ${credits.toLocaleString()} credits to unlock exclusive content and send tips on VipOnly`,
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "VipOnly",
      },
    },
  };
}

// FAQPage schema for FAQ sections
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// Breadcrumb schema generator
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
