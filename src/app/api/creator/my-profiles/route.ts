import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user?.id;
    const isCreator = (session.user as any)?.isCreator;

    if (!isCreator) {
      return NextResponse.json({ creators: [] });
    }

    const creators = await prisma.creator.findMany({
      where: { userId },
      select: {
        id: true,
        slug: true,
        name: true,
        displayName: true,
        avatar: true,
        coverImage: true,
      },
    });

    // Get actual counts from MediaContent and Subscription tables
    const creatorSlugs = creators.map((c) => c.slug);

    // Count media per creator
    const mediaCounts = await prisma.mediaContent.groupBy({
      by: ["creatorSlug", "type"],
      where: { creatorSlug: { in: creatorSlugs } },
      _count: { id: true },
    });

    // Count subscribers per creator
    const subscriberCounts = await prisma.subscription.groupBy({
      by: ["creatorSlug"],
      where: {
        creatorSlug: { in: creatorSlugs },
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      _count: { id: true },
    });

    // Build lookup maps
    const mediaCountMap: Record<string, { photos: number; videos: number }> = {};
    for (const count of mediaCounts) {
      if (!mediaCountMap[count.creatorSlug]) {
        mediaCountMap[count.creatorSlug] = { photos: 0, videos: 0 };
      }
      if (count.type === "PHOTO") {
        mediaCountMap[count.creatorSlug].photos = count._count.id;
      } else if (count.type === "VIDEO") {
        mediaCountMap[count.creatorSlug].videos = count._count.id;
      }
    }

    const subscriberCountMap: Record<string, number> = {};
    for (const count of subscriberCounts) {
      subscriberCountMap[count.creatorSlug] = count._count.id;
    }

    // Format the response with real counts
    const formattedCreators = creators.map((creator) => ({
      id: creator.id,
      slug: creator.slug,
      name: creator.name,
      displayName: creator.displayName,
      avatar: creator.avatar,
      coverImage: creator.coverImage,
      stats: {
        photos: mediaCountMap[creator.slug]?.photos || 0,
        videos: mediaCountMap[creator.slug]?.videos || 0,
        subscribers: subscriberCountMap[creator.slug] || 0,
      },
    }));

    return NextResponse.json({ creators: formattedCreators });
  } catch (error) {
    console.error("Error fetching creator profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}
