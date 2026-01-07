import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/media/view - Increment view count for a media
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaId } = body;

    if (!mediaId) {
      return NextResponse.json(
        { error: "Media ID required" },
        { status: 400 }
      );
    }

    // Increment view count
    const media = await prisma.mediaContent.update({
      where: { id: mediaId },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({ viewCount: media.viewCount });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return NextResponse.json(
      { error: "Failed to increment view count" },
      { status: 500 }
    );
  }
}
