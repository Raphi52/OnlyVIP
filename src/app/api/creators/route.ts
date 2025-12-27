import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/creators - List all active creators
export async function GET(request: NextRequest) {
  try {
    const creators = await prisma.creator.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        displayName: true,
        avatar: true,
        cardImage: true,
        bio: true,
        photoCount: true,
        videoCount: true,
        subscriberCount: true,
        createdAt: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { subscriberCount: "desc" },
      ],
    });

    return NextResponse.json({ creators });
  } catch (error) {
    console.error("Error fetching creators:", error);
    return NextResponse.json(
      { error: "Failed to fetch creators" },
      { status: 500 }
    );
  }
}
