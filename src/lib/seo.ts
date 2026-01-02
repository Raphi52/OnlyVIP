// SEO utilities for generating JSON-LD structured data
// Schema.org compliant structured data for better search engine visibility

import type { Creator } from "@/lib/creators";

const BASE_URL = "https://viponly.fun";
const BRAND_NAME = "VIPOnly";

// Organization schema for the homepage
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: BRAND_NAME,
    alternateName: ["VIPOnly", "viponly", "Vip Only", "viponly.fun"],
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/icon.svg`,
      width: 512,
      height: 512,
    },
    description: "VIPOnly is the premium exclusive content platform where creators share photos, videos, and VIP content with subscribers. Join VIPOnly today - the best creator subscription platform.",
    foundingDate: "2024",
    slogan: "VIPOnly - Exclusive Content Platform",
    sameAs: [
      "https://twitter.com/VIPOnly",
      "https://instagram.com/VIPOnly",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@viponly.fun",
      contactType: "customer support",
      availableLanguage: ["English", "French", "Spanish", "Portuguese", "German", "Italian", "Chinese", "Japanese", "Korean", "Arabic", "Russian", "Hindi"],
    },
  };
}

// Website schema for the homepage
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: BRAND_NAME,
    alternateName: ["VIPOnly", "viponly", "viponly.fun", "Vip Only"],
    url: BASE_URL,
    description: "VIPOnly - The premium exclusive content platform for creators and fans. Subscribe to your favorite VIPOnly creators and access exclusive photos, videos, and messages on viponly.fun",
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/en/creators?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      {
        "@type": "ReadAction",
        target: `${BASE_URL}/en/creators`,
      },
    ],
    inLanguage: ["en", "es", "pt", "fr", "de", "it", "zh", "ja", "ko", "ar", "ru", "hi"],
  };
}

// WebPage schema for homepage
export function generateHomePageSchema(locale: string = 'en') {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/${locale}/#webpage`,
    url: `${BASE_URL}/${locale}`,
    name: `VIPOnly - Exclusive Content Platform | viponly.fun`,
    description: "VIPOnly is THE premium platform for exclusive content creators. Join VIPOnly to share exclusive photos and videos, chat with your fans and monetize your content on viponly.fun",
    isPartOf: {
      "@id": `${BASE_URL}/#website`,
    },
    about: {
      "@id": `${BASE_URL}/#organization`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${BASE_URL}/api/og?title=VIPOnly`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "VIPOnly Home",
          item: `${BASE_URL}/${locale}`,
        },
      ],
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".description"],
    },
  };
}

// SoftwareApplication schema for VIPOnly as a platform
export function generateSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND_NAME,
    alternateName: "viponly.fun",
    applicationCategory: "SocialNetworkingApplication",
    operatingSystem: "Web",
    url: BASE_URL,
    description: "VIPOnly is a premium content subscription platform where creators share exclusive photos, videos and content with their VIPOnly subscribers.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to join VIPOnly. VIPOnly creators set their own subscription prices.",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1000",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

// Person/Creator schema for creator pages
export function generateCreatorSchema(creator: Creator) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${BASE_URL}/${creator.slug}/#person`,
    name: creator.displayName,
    alternateName: creator.name,
    url: `${BASE_URL}/${creator.slug}`,
    image: creator.avatar || creator.cardImage,
    description: creator.bio || `${creator.displayName} on VIPOnly - Exclusive content creator`,
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
    worksFor: {
      "@id": `${BASE_URL}/#organization`,
    },
  };
}

// ProfilePage schema for creator profile
export function generateProfilePageSchema(creator: Creator, locale: string = 'en') {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${BASE_URL}/${locale}/${creator.slug}/#profilepage`,
    name: `${creator.displayName} on VIPOnly | Exclusive Content`,
    url: `${BASE_URL}/${locale}/${creator.slug}`,
    description: creator.bio || `Subscribe to ${creator.displayName} on VIPOnly for exclusive photos, videos and content`,
    mainEntity: {
      "@id": `${BASE_URL}/${creator.slug}/#person`,
    },
    isPartOf: {
      "@id": `${BASE_URL}/#website`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "VIPOnly",
          item: `${BASE_URL}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Creators",
          item: `${BASE_URL}/${locale}/creators`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: creator.displayName,
          item: `${BASE_URL}/${locale}/${creator.slug}`,
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
    name: `${pricing.name} - ${creator.displayName} VIPOnly Subscription`,
    description: pricing.description || `Subscribe to ${creator.displayName}'s exclusive VIPOnly content`,
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
      name: `${creator.displayName} VIPOnly Subscription`,
      description: `Access to exclusive photos, videos, and VIP content from ${creator.displayName} on VIPOnly`,
      provider: {
        "@id": `${BASE_URL}/#organization`,
      },
    },
  };
}

// ImageGallery schema for gallery pages
export function generateImageGallerySchema(
  creator: Creator,
  imageCount: number,
  videoCount: number,
  locale: string = 'en'
) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: `${creator.displayName}'s VIPOnly Gallery`,
    description: `Exclusive photo and video gallery featuring ${imageCount} photos and ${videoCount} videos from ${creator.displayName} on VIPOnly`,
    url: `${BASE_URL}/${locale}/${creator.slug}/gallery`,
    author: {
      "@id": `${BASE_URL}/${creator.slug}/#person`,
    },
    isPartOf: {
      "@id": `${BASE_URL}/#website`,
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
    name: `${credits.toLocaleString()} VIPOnly Credits`,
    description: `Purchase ${credits.toLocaleString()} VIPOnly credits to unlock exclusive content and send tips on viponly.fun`,
    brand: {
      "@type": "Brand",
      name: BRAND_NAME,
    },
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: {
        "@id": `${BASE_URL}/#organization`,
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

// VIPOnly specific FAQ schema
export function generateVIPOnlyFAQSchema() {
  return generateFAQSchema([
    {
      question: "What is VIPOnly?",
      answer: "VIPOnly is a premium exclusive content platform where creators share photos, videos, and VIP content with their subscribers. VIPOnly allows creators to monetize their content through subscriptions, tips, and pay-per-view messages.",
    },
    {
      question: "How do I join VIPOnly?",
      answer: "You can join VIPOnly for free by creating an account at viponly.fun. Once registered, you can subscribe to your favorite VIPOnly creators and access their exclusive content.",
    },
    {
      question: "How much does VIPOnly cost?",
      answer: "VIPOnly is free to join. Each VIPOnly creator sets their own subscription price. You can also purchase VIPOnly credits to unlock pay-per-view content and send tips.",
    },
    {
      question: "What payment methods does VIPOnly accept?",
      answer: "VIPOnly accepts credit cards, debit cards, and cryptocurrency payments. VIPOnly supports multiple payment processors for your convenience.",
    },
    {
      question: "How do VIPOnly creators get paid?",
      answer: "VIPOnly creators receive 95% of their earnings (only 5% platform fee). New VIPOnly creators get 100% of earnings for their first month with 0% fees.",
    },
  ]);
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

// Category collection page schema
export function generateCategoryCollectionSchema(
  category: { id: string; label: string },
  creators: Array<{ slug: string; displayName: string; avatar?: string | null; cardImage?: string | null }>,
  locale: string = 'en'
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best ${category.label} OnlyFans Models & Creators`,
    description: `Discover the best ${category.label.toLowerCase()} content creators on VIPOnly - the #1 OnlyFans alternative with crypto payments and lower fees.`,
    url: `${BASE_URL}/${locale}/creators/${category.id}`,
    isPartOf: {
      "@id": `${BASE_URL}/#website`,
    },
    about: {
      "@type": "Thing",
      name: category.label,
    },
    mainEntity: {
      "@type": "ItemList",
      name: `${category.label} Models on VIPOnly`,
      numberOfItems: creators.length,
      itemListElement: creators.slice(0, 10).map((creator, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${BASE_URL}/${locale}/${creator.slug}`,
        name: creator.displayName,
        image: creator.cardImage || creator.avatar,
      })),
    },
  };
}

// Top creators / Best models page schema
export function generateTopCreatorsSchema(
  creators: Array<{ slug: string; displayName: string; avatar?: string | null; cardImage?: string | null }>,
  locale: string = 'en'
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Best OnlyFans Models & Top Creators 2025",
    description: "Discover the best models and top content creators on VIPOnly - the #1 OnlyFans alternative with crypto payments and lower fees.",
    url: `${BASE_URL}/${locale}/top-creators`,
    isPartOf: {
      "@id": `${BASE_URL}/#website`,
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Top Creators on VIPOnly",
      numberOfItems: creators.length,
      itemListElement: creators.slice(0, 10).map((creator, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${BASE_URL}/${locale}/${creator.slug}`,
        name: creator.displayName,
        image: creator.cardImage || creator.avatar,
      })),
    },
  };
}

// ItemList schema for creators directory
export function generateCreatorsListSchema(creators: Creator[], locale: string = 'en') {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "VIPOnly Creators",
    description: "Browse all VIPOnly creators and subscribe to exclusive content",
    url: `${BASE_URL}/${locale}/creators`,
    numberOfItems: creators.length,
    itemListElement: creators.slice(0, 10).map((creator, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/${locale}/${creator.slug}`,
      name: creator.displayName,
      image: creator.avatar || creator.cardImage,
    })),
  };
}
