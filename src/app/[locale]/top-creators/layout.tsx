import { Metadata } from "next";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateCreatorsListSchema,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Best OnlyFans Models & Top Creators 2025 | VipOnly",
    description:
      "Discover the best OnlyFans alternative models and top creators on VipOnly. Browse trending models, rising stars, and exclusive content creators. Lower fees, crypto payments accepted.",
    keywords: [
      "best onlyfans models",
      "top onlyfans creators",
      "onlyfans alternative",
      "best models 2025",
      "trending creators",
      "exclusive content creators",
      "viponly models",
      "onlyfans stars",
      "popular onlyfans",
      "rising onlyfans models",
    ],
    openGraph: {
      title: "Best OnlyFans Models & Top Creators 2025 | VipOnly",
      description:
        "Discover the best models and top creators on VipOnly - the #1 OnlyFans alternative with crypto payments and lower fees.",
      url: "https://viponly.fun/top-creators",
      type: "website",
      images: [
        {
          url: "https://viponly.fun/api/og?title=Best%20Models%20%26%20Top%20Creators&subtitle=Discover%20Exclusive%20Content",
          width: 1200,
          height: 630,
          alt: "VipOnly - Best Models & Top Creators",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Best OnlyFans Models & Top Creators 2025",
      description:
        "Discover the best models and top creators on VipOnly - the #1 OnlyFans alternative.",
    },
    alternates: {
      canonical: "https://viponly.fun/top-creators",
      languages: {
        en: "https://viponly.fun/en/top-creators",
        es: "https://viponly.fun/es/top-creators",
        fr: "https://viponly.fun/fr/top-creators",
        pt: "https://viponly.fun/pt/top-creators",
        de: "https://viponly.fun/de/top-creators",
      },
    },
  };
}

export default async function TopCreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch top creators for structured data
  const creators = await prisma.creator.findMany({
    where: { isActive: true },
    orderBy: { subscriberCount: "desc" },
    take: 10,
    select: {
      slug: true,
      displayName: true,
      avatar: true,
      cardImage: true,
    },
  });

  const creatorsForSchema = creators.map((c) => ({
    slug: c.slug,
    displayName: c.displayName,
    avatar: c.avatar,
    cardImage: c.cardImage,
    name: c.displayName,
  }));

  return (
    <>
      <JsonLd data={generateOrganizationSchema()} />
      <JsonLd data={generateWebsiteSchema()} />
      <JsonLd data={generateCreatorsListSchema(creatorsForSchema as any, "en")} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Best OnlyFans Models & Top Creators",
          description:
            "Curated collection of the best models and top content creators on VipOnly",
          url: "https://viponly.fun/top-creators",
          isPartOf: {
            "@id": "https://viponly.fun/#website",
          },
          mainEntity: {
            "@type": "ItemList",
            name: "Top Creators on VipOnly",
            numberOfItems: creators.length,
            itemListElement: creators.map((creator, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `https://viponly.fun/${creator.slug}`,
              name: creator.displayName,
            })),
          },
        }}
      />
      {children}
    </>
  );
}
