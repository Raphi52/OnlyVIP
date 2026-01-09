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
        avatar: dbCreator.avatar || defaultCreators[slug.toLowerCase()]?.avatar || null,
        cardImage: dbCreator.cardImage || null,
        coverImage: dbCreator.coverImage || defaultCreators[slug.toLowerCase()]?.coverImage || null,
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
        // AI Settings (for authenticated creators)
        aiResponseDelayMin: dbCreator.aiResponseDelayMin,
        aiResponseDelayMax: dbCreator.aiResponseDelayMax,
        aiPauseDurationMin: dbCreator.aiPauseDurationMin,
        aiPauseDurationMax: dbCreator.aiPauseDurationMax,
        aiPauseIntervalMin: dbCreator.aiPauseIntervalMin,
        aiPauseIntervalMax: dbCreator.aiPauseIntervalMax,
        aiPersonality: dbCreator.aiPersonality,
        // AI Provider Settings
        aiProvider: dbCreator.aiProvider,
        aiModel: dbCreator.aiModel,
        aiUseCustomKey: dbCreator.aiUseCustomKey,
        aiApiKeyHash: dbCreator.aiApiKeyHash, // Masked key, not actual key
        // AI Media Settings
        aiMediaEnabled: dbCreator.aiMediaEnabled,
        aiMediaFrequency: dbCreator.aiMediaFrequency,
        aiPPVRatio: dbCreator.aiPPVRatio,
        aiTeasingEnabled: dbCreator.aiTeasingEnabled,
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
