import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CREATOR_CATEGORIES } from "@/lib/categories";
import { JsonLd } from "@/components/seo/JsonLd";
import { prisma } from "@/lib/prisma";

// SEO metadata mapping for each category
const CATEGORY_SEO: Record<
  string,
  {
    title: string;
    h1: string;
    description: string;
    keywords: string[];
  }
> = {
  latina: {
    title: "Best Latina OnlyFans Models & Creators 2025",
    h1: "Latina Models",
    description:
      "Discover the hottest Latina OnlyFans models and content creators on VipOnly. Browse exclusive Latina creator profiles with photos, videos, and premium content. Pay with crypto.",
    keywords: [
      "latina onlyfans",
      "best latina models",
      "latina creators",
      "hot latina onlyfans",
      "latina content creators",
      "spanish models onlyfans",
    ],
  },
  asian: {
    title: "Best Asian OnlyFans Models & Creators 2025",
    h1: "Asian Models",
    description:
      "Find the best Asian OnlyFans models and content creators on VipOnly. Exclusive Asian creator profiles with premium photos and videos. Crypto payments accepted.",
    keywords: [
      "asian onlyfans",
      "best asian models",
      "asian creators",
      "japanese onlyfans",
      "korean models onlyfans",
      "asian content creators",
    ],
  },
  mature: {
    title: "Best MILF OnlyFans Models & Mature Creators 2025",
    h1: "MILF & Mature Models",
    description:
      "Discover the best MILF and mature OnlyFans models on VipOnly. Exclusive mature creator content with photos and videos. Lower fees than OnlyFans.",
    keywords: [
      "milf onlyfans",
      "mature onlyfans",
      "best milf models",
      "mature creators",
      "milf content creators",
      "mature women onlyfans",
    ],
  },
  cosplay: {
    title: "Best Cosplay OnlyFans Models & Creators 2025",
    h1: "Cosplay Models",
    description:
      "Find the best cosplay OnlyFans models and content creators on VipOnly. Exclusive cosplay content, anime characters, and gaming costumes.",
    keywords: [
      "cosplay onlyfans",
      "best cosplay models",
      "anime cosplay onlyfans",
      "cosplay creators",
      "gaming cosplay models",
      "cosplay content creators",
    ],
  },
  feet: {
    title: "Best Feet OnlyFans Models & Creators 2025",
    h1: "Feet Models",
    description:
      "Discover the best feet OnlyFans models and foot content creators on VipOnly. Exclusive feet content with premium photos and videos.",
    keywords: [
      "feet onlyfans",
      "best feet models",
      "foot fetish onlyfans",
      "feet creators",
      "feet content creators",
      "foot models onlyfans",
    ],
  },
  curvy: {
    title: "Best BBW & Curvy OnlyFans Models 2025",
    h1: "BBW & Curvy Models",
    description:
      "Find the best BBW and curvy OnlyFans models on VipOnly. Exclusive curvy creator content with photos and videos. Crypto payments accepted.",
    keywords: [
      "bbw onlyfans",
      "curvy onlyfans",
      "best bbw models",
      "curvy creators",
      "thick models onlyfans",
      "plus size onlyfans",
    ],
  },
  ebony: {
    title: "Best Ebony OnlyFans Models & Creators 2025",
    h1: "Ebony Models",
    description:
      "Discover the best Ebony OnlyFans models and content creators on VipOnly. Exclusive Ebony creator profiles with premium content.",
    keywords: [
      "ebony onlyfans",
      "best ebony models",
      "black onlyfans models",
      "ebony creators",
      "ebony content creators",
    ],
  },
  blonde: {
    title: "Best Blonde OnlyFans Models & Creators 2025",
    h1: "Blonde Models",
    description:
      "Find the hottest blonde OnlyFans models and content creators on VipOnly. Exclusive blonde creator profiles with photos and videos.",
    keywords: [
      "blonde onlyfans",
      "best blonde models",
      "blonde creators",
      "hot blonde onlyfans",
      "blonde content creators",
    ],
  },
  brunette: {
    title: "Best Brunette OnlyFans Models & Creators 2025",
    h1: "Brunette Models",
    description:
      "Discover the best brunette OnlyFans models and content creators on VipOnly. Exclusive brunette creator content with premium photos and videos.",
    keywords: [
      "brunette onlyfans",
      "best brunette models",
      "brunette creators",
      "dark hair onlyfans",
      "brunette content creators",
    ],
  },
  petite: {
    title: "Best Petite OnlyFans Models & Creators 2025",
    h1: "Petite Models",
    description:
      "Find the best petite OnlyFans models and content creators on VipOnly. Exclusive petite creator profiles with premium content.",
    keywords: [
      "petite onlyfans",
      "best petite models",
      "petite creators",
      "small onlyfans models",
      "petite content creators",
    ],
  },
};

// Generate static params for all categories
export async function generateStaticParams() {
  return Object.keys(CATEGORY_SEO).map((category) => ({
    category,
  }));
}

interface Props {
  params: Promise<{ category: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, locale } = await params;
  const seo = CATEGORY_SEO[category];
  const categoryData = CREATOR_CATEGORIES.find((c) => c.id === category);

  if (!seo || !categoryData) {
    return {
      title: "Category Not Found | VipOnly",
    };
  }

  return {
    title: seo.title + " | VipOnly",
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `https://viponly.fun/${locale}/creators/${category}`,
      type: "website",
      images: [
        {
          url: `https://viponly.fun/api/og?title=${encodeURIComponent(seo.h1)}&subtitle=Exclusive%20Content%20Creators`,
          width: 1200,
          height: 630,
          alt: seo.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
    alternates: {
      canonical: `https://viponly.fun/creators/${category}`,
      languages: {
        en: `https://viponly.fun/en/creators/${category}`,
        es: `https://viponly.fun/es/creators/${category}`,
        fr: `https://viponly.fun/fr/creators/${category}`,
        pt: `https://viponly.fun/pt/creators/${category}`,
        de: `https://viponly.fun/de/creators/${category}`,
      },
    },
  };
}

export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ category: string; locale: string }>;
}) {
  const { category, locale } = await params;
  const seo = CATEGORY_SEO[category];
  const categoryData = CREATOR_CATEGORIES.find((c) => c.id === category);

  if (!seo || !categoryData) {
    notFound();
  }

  // Fetch creators for this category
  const creators = await prisma.creator.findMany({
    where: {
      isActive: true,
      categories: {
        contains: category,
      },
    },
    orderBy: { subscriberCount: "desc" },
    take: 10,
    select: {
      slug: true,
      displayName: true,
      avatar: true,
      cardImage: true,
    },
  });

  return (
    <>
      {/* CollectionPage Schema */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: seo.title,
          description: seo.description,
          url: `https://viponly.fun/${locale}/creators/${category}`,
          isPartOf: {
            "@id": "https://viponly.fun/#website",
          },
          about: {
            "@type": "Thing",
            name: categoryData.label,
          },
          mainEntity: {
            "@type": "ItemList",
            name: `${categoryData.label} Models on VipOnly`,
            numberOfItems: creators.length,
            itemListElement: creators.map((creator, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `https://viponly.fun/${locale}/${creator.slug}`,
              name: creator.displayName,
              image: creator.cardImage || creator.avatar,
            })),
          },
        }}
      />
      {/* BreadcrumbList Schema */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "VipOnly",
              item: `https://viponly.fun/${locale}`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Creators",
              item: `https://viponly.fun/${locale}/creators`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: categoryData.label,
              item: `https://viponly.fun/${locale}/creators/${category}`,
            },
          ],
        }}
      />
      {children}
    </>
  );
}
