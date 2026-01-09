import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;
    const session = await auth();

    // Fetch media
    const media = await prisma.mediaContent.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Check if media is PPV
    if (!media.tagPPV) {
      return NextResponse.json({ error: "This content is not available for purchase" }, { status: 400 });
    }

    // Fetch creator info separately
    const creator = await prisma.creator.findUnique({
      where: { slug: media.creatorSlug },
      select: {
        displayName: true,
        avatar: true,
        slug: true,
      },
    });

    // Check if user has purchased
    let hasPurchased = false;
    if (session?.user?.id) {
      const purchase = await prisma.mediaPurchase.findFirst({
        where: {
          userId: session.user.id,
          mediaId: mediaId,
        },
      });
      hasPurchased = !!purchase;
    }

    return NextResponse.json({
      id: media.id,
      title: media.title,
      type: media.type,
      thumbnailUrl: media.thumbnailUrl,
      contentUrl: hasPurchased ? media.contentUrl : null,
      ppvPriceCredits: media.ppvPriceCredits || 100,
      creatorSlug: media.creatorSlug,
      creator: {
        displayName: creator?.displayName || "Creator",
        avatar: creator?.avatar || null,
      },
      hasPurchased,
    });
  } catch (error) {
    console.error("Error fetching PPV media:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
