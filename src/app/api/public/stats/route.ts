import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public stats for homepage - no auth required
export async function GET() {
  try {
    const [photoCount, videoCount, userCount] = await Promise.all([
      prisma.mediaContent.count({
        where: { type: "PHOTO", isPublished: true },
      }),
      prisma.mediaContent.count({
        where: { type: "VIDEO", isPublished: true },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json(
      {
        photos: photoCount,
        videos: videoCount,
        members: userCount,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching public stats:", error);
    return NextResponse.json(
      { photos: 0, videos: 0, members: 0 },
      { status: 200 }
    );
  }
}
