import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { defaultCreators } from "@/lib/creators";

// GET /api/creators/[slug] - Get creator by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Try to get creator from database
    const dbCreator = await prisma.creator.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (dbCreator) {
      const socialLinks = JSON.parse(dbCreator.socialLinks || "{}");
      return NextResponse.json({
        slug: dbCreator.slug,
        name: dbCreator.name,
        displayName: dbCreator.displayName,
        avatar: dbCreator.avatar || defaultCreators[slug.toLowerCase()]?.avatar,
        cardImage: dbCreator.cardImage,
        coverImage: dbCreator.coverImage || defaultCreators[slug.toLowerCase()]?.coverImage,
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
      });
    }

    // Fallback to static data
    const staticCreator = defaultCreators[slug.toLowerCase()];
    if (staticCreator) {
      return NextResponse.json(staticCreator);
    }

    return NextResponse.json(
      { error: "Creator not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching creator:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator" },
      { status: 500 }
    );
  }
}
