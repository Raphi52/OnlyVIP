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
        photoCount: true,
        videoCount: true,
        subscriberCount: true,
      },
    });

    // Format the response
    const formattedCreators = creators.map((creator) => ({
      id: creator.id,
      slug: creator.slug,
      name: creator.name,
      displayName: creator.displayName,
      avatar: creator.avatar,
      coverImage: creator.coverImage,
      stats: {
        photos: creator.photoCount,
        videos: creator.videoCount,
        subscribers: creator.subscriberCount,
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
