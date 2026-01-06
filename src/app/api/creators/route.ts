import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/creators - List all active creators
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featuredOnly = searchParams.get("featured") === "true";

    const creatorsRaw = await prisma.creator.findMany({
      where: {
        isActive: true,
        ...(featuredOnly && { isFeatured: true }),
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
        categories: true,
        createdAt: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { subscriberCount: "desc" },
      ],
    });

    // Parse categories JSON for each creator
    const creators = creatorsRaw.map((creator) => ({
      ...creator,
      categories: (() => {
        try {
          const parsed = JSON.parse(creator.categories || "[]");
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })(),
    }));

    // Return with no-cache headers to ensure fresh data
    return NextResponse.json(
      { creators },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching creators:", error);
    return NextResponse.json(
      { error: "Failed to fetch creators" },
      { status: 500 }
    );
  }
}
