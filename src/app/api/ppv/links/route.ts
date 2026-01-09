import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";

// Generate a short unique code for PPV links
function generateShortCode(): string {
  return nanoid(8);
}

// GET - List PPV links for creator
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creatorSlug");

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Verify user has access to this creator
    const creator = await prisma.creator.findFirst({
      where: {
        slug: creatorSlug,
        OR: [
          { userId: session.user.id },
          { agency: { ownerId: session.user.id } },
        ],
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Not authorized for this creator" }, { status: 403 });
    }

    // Get PPV links with stats
    const links = await prisma.pPVLink.findMany({
      where: { creatorSlug },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { clicks: true },
        },
      },
    });

    // Get media info for each link
    const mediaIds = links.map((l) => l.mediaId);
    const mediaList = await prisma.mediaContent.findMany({
      where: { id: { in: mediaIds } },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        type: true,
        ppvPriceCredits: true,
      },
    });

    const mediaMap = new Map(mediaList.map((m) => [m.id, m]));

    const linksWithMedia = links.map((link) => ({
      ...link,
      media: mediaMap.get(link.mediaId) || null,
    }));

    return NextResponse.json({ links: linksWithMedia });
  } catch (error) {
    console.error("Error fetching PPV links:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new PPV link
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { creatorSlug, mediaId, name, source, campaign } = body;

    if (!creatorSlug || !mediaId) {
      return NextResponse.json(
        { error: "Creator slug and media ID required" },
        { status: 400 }
      );
    }

    // Verify user has access to this creator
    const creator = await prisma.creator.findFirst({
      where: {
        slug: creatorSlug,
        OR: [
          { userId: session.user.id },
          { agency: { ownerId: session.user.id } },
        ],
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Not authorized for this creator" }, { status: 403 });
    }

    // Verify media exists and is PPV
    const media = await prisma.mediaContent.findFirst({
      where: {
        id: mediaId,
        creatorSlug,
        tagPPV: true,
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Media not found or not PPV content" },
        { status: 404 }
      );
    }

    // Generate unique short code
    let shortCode = generateShortCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.pPVLink.findUnique({
        where: { shortCode },
      });
      if (!existing) break;
      shortCode = generateShortCode();
      attempts++;
    }

    // Create PPV link
    const ppvLink = await prisma.pPVLink.create({
      data: {
        creatorSlug,
        mediaId,
        shortCode,
        name: name || null,
        source: source || null,
        campaign: campaign || null,
      },
    });

    return NextResponse.json({
      success: true,
      link: ppvLink,
      url: `${process.env.NEXTAUTH_URL || "https://viponly.fun"}/${creatorSlug}/ppv/${shortCode}`,
    });
  } catch (error) {
    console.error("Error creating PPV link:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
