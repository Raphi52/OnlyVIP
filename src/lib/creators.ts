// Creators configuration
export interface Creator {
  slug: string;
  name: string;
  displayName: string;
  avatar: string;
  cardImage?: string;
  coverImage: string;
  bio: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  theme?: {
    primaryColor?: string;
    accentColor?: string;
  };
  stats?: {
    photos: number;
    videos: number;
    subscribers: number;
  };
}

// Default/fallback creators - database takes precedence
export const defaultCreators: Record<string, Creator> = {
  miacosta: {
    slug: "miacosta",
    name: "Mia Costa",
    displayName: "Mia Costa",
    avatar: "/media/preview/3039035234726006678_1.jpg",
    coverImage: "/media/preview/3036738115692549406_1.jpg",
    bio: "Welcome to my exclusive content. Join my VIP for the full experience.",
    socialLinks: {
      instagram: "https://instagram.com/miacosta",
      twitter: "https://twitter.com/miacosta",
    },
    stats: {
      photos: 450,
      videos: 25,
      subscribers: 2500,
    },
  },
  emmarose: {
    slug: "emmarose",
    name: "Emma Rose",
    displayName: "Emma Rose",
    avatar: "/media/preview/2885347102581834996_1.jpg",
    coverImage: "/media/preview/2872307818983487894_1.jpg",
    bio: "Hey loves! I'm Emma, your favorite girl next door. Subscribe for daily exclusive content and personal chats.",
    socialLinks: {
      instagram: "https://instagram.com/emmarose",
      twitter: "https://twitter.com/emmarose",
      tiktok: "https://tiktok.com/@emmarose",
    },
    stats: {
      photos: 320,
      videos: 18,
      subscribers: 1800,
    },
  },
};

// Keep 'creators' as alias for backward compatibility
export const creators = defaultCreators;

// Client-side functions use static data (fast, for initial render)
export function getCreator(slug: string): Creator | undefined {
  return defaultCreators[slug.toLowerCase()];
}

export function getAllCreators(): Creator[] {
  return Object.values(defaultCreators);
}

export function getAllCreatorSlugs(): string[] {
  return Object.keys(defaultCreators);
}

export function getDefaultCreator(): Creator {
  return defaultCreators.miacosta;
}

// Server-side function to get creator from database with fallback
// Use this in server components for fresh data
export async function getCreatorFromDB(slug: string): Promise<Creator | undefined> {
  try {
    // Dynamic import to avoid issues with client-side code
    const prisma = (await import("@/lib/prisma")).default;

    const dbCreator = await prisma.creator.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (dbCreator) {
      const socialLinks = JSON.parse(dbCreator.socialLinks || "{}");
      return {
        slug: dbCreator.slug,
        name: dbCreator.name,
        displayName: dbCreator.displayName,
        avatar: dbCreator.avatar || defaultCreators[slug.toLowerCase()]?.avatar || "/placeholder-avatar.jpg",
        cardImage: dbCreator.cardImage || undefined,
        coverImage: dbCreator.coverImage || defaultCreators[slug.toLowerCase()]?.coverImage || "/placeholder-cover.jpg",
        bio: dbCreator.bio || defaultCreators[slug.toLowerCase()]?.bio || "",
        socialLinks: {
          instagram: socialLinks.instagram || undefined,
          twitter: socialLinks.twitter || undefined,
          tiktok: socialLinks.tiktok || undefined,
        },
        stats: {
          photos: dbCreator.photoCount,
          videos: dbCreator.videoCount,
          subscribers: dbCreator.subscriberCount,
        },
      };
    }

    // Fallback to static data if not in database
    return defaultCreators[slug.toLowerCase()];
  } catch (error) {
    console.error("Error fetching creator from DB:", error);
    // Fallback to static data on error
    return defaultCreators[slug.toLowerCase()];
  }
}

// Server-side function to get default creator from database
export async function getDefaultCreatorFromDB(): Promise<Creator> {
  const creator = await getCreatorFromDB("miacosta");
  return creator || defaultCreators.miacosta;
}
