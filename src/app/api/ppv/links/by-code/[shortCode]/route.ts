import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Resolve short code to PPV link info (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;

    const link = await prisma.pPVLink.findUnique({
      where: { shortCode },
      select: {
        id: true,
        mediaId: true,
        creatorSlug: true,
        isActive: true,
        shortCode: true,
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (!link.isActive) {
      return NextResponse.json({ error: "Link is inactive" }, { status: 410 });
    }

    // Get media info
    const media = await prisma.mediaContent.findUnique({
      where: { id: link.mediaId },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        thumbnailUrl: true,
        previewUrl: true,
        ppvPriceCredits: true,
        tagPPV: true,
      },
    });

    if (!media || !media.tagPPV) {
      return NextResponse.json({ error: "Content not available" }, { status: 404 });
    }

    // Get creator info
    const creator = await prisma.creator.findUnique({
      where: { slug: link.creatorSlug },
      select: {
        slug: true,
        displayName: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      link,
      media,
      creator,
    });
  } catch (error) {
    console.error("Error resolving PPV link:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
