import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get agency creators and available creators
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.isAgencyOwner) {
      return NextResponse.json({ error: "Not an agency owner" }, { status: 403 });
    }

    // Get user's agency
    const agency = await prisma.agency.findFirst({
      where: { ownerId: user.id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Get creators in this agency
    const creators = await prisma.creator.findMany({
      where: { agencyId: agency.id },
      select: {
        id: true,
        slug: true,
        name: true,
        displayName: true,
        avatar: true,
        isActive: true,
        aiEnabled: true,
        agencyId: true,
        subscriberCount: true,
        photoCount: true,
        videoCount: true,
      },
    });

    // Get available creators (not in any agency, owned by user)
    const availableCreators = await prisma.creator.findMany({
      where: {
        agencyId: null,
        userId: user.id,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        displayName: true,
        avatar: true,
        isActive: true,
        aiEnabled: true,
        agencyId: true,
        subscriberCount: true,
        photoCount: true,
        videoCount: true,
      },
    });

    // Format creators
    const formatCreator = (creator: any) => ({
      id: creator.id,
      slug: creator.slug,
      name: creator.name,
      displayName: creator.displayName,
      avatar: creator.avatar,
      isActive: creator.isActive,
      aiEnabled: creator.aiEnabled,
      agencyId: creator.agencyId,
      subscriberCount: creator.subscriberCount || 0,
      photoCount: creator.photoCount || 0,
      videoCount: creator.videoCount || 0,
    });

    return NextResponse.json({
      agency,
      creators: creators.map(formatCreator),
      availableCreators: availableCreators.map(formatCreator),
    });
  } catch (error) {
    console.error("[AGENCY CREATORS GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add existing creator to agency OR create new creator
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.isAgencyOwner) {
      return NextResponse.json({ error: "Not an agency owner" }, { status: 403 });
    }

    const body = await req.json();
    const { action, creatorId, agencyId, slug, displayName } = body;

    // Get user's agency
    const agency = await prisma.agency.findFirst({
      where: { id: agencyId || undefined, ownerId: user.id },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // CREATE NEW CREATOR
    if (action === "create") {
      // Validate slug
      if (!slug || slug.length < 3 || slug.length > 30) {
        return NextResponse.json(
          { error: "Slug must be between 3 and 30 characters" },
          { status: 400 }
        );
      }

      const slugRegex = /^[a-z0-9-]+$/;
      const cleanSlug = slug.toLowerCase().trim();
      if (!slugRegex.test(cleanSlug)) {
        return NextResponse.json(
          { error: "Slug can only contain lowercase letters, numbers, and hyphens" },
          { status: 400 }
        );
      }

      // Reserved slugs
      const reservedSlugs = ["admin", "api", "auth", "dashboard", "gallery", "checkout", "membership", "settings", "billing", "messages"];
      if (reservedSlugs.includes(cleanSlug)) {
        return NextResponse.json(
          { error: "This URL is reserved. Please choose another one." },
          { status: 400 }
        );
      }

      // Check if slug is taken
      const existingCreator = await prisma.creator.findUnique({
        where: { slug: cleanSlug },
      });

      if (existingCreator) {
        return NextResponse.json(
          { error: "This URL is already taken. Please choose another one." },
          { status: 400 }
        );
      }

      // Create creator profile in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Ensure user is marked as creator
        if (!user.isCreator) {
          await tx.user.update({
            where: { id: session.user.id },
            data: { isCreator: true },
          });
        }

        // Create creator profile assigned to agency
        const creator = await tx.creator.create({
          data: {
            slug: cleanSlug,
            name: displayName || cleanSlug,
            displayName: displayName || cleanSlug,
            userId: session.user.id,
            agencyId: agency.id,
            isActive: true,
          },
        });

        // Create default site settings
        await tx.siteSettings.create({
          data: {
            creatorSlug: cleanSlug,
            siteName: displayName || cleanSlug,
          },
        });

        return creator;
      });

      return NextResponse.json({
        success: true,
        creator: {
          id: result.id,
          slug: result.slug,
          name: result.name,
          displayName: result.displayName,
          avatar: result.avatar,
          isActive: result.isActive,
          aiEnabled: result.aiEnabled,
          agencyId: result.agencyId,
          subscriberCount: 0,
          photoCount: 0,
          videoCount: 0,
        },
      });
    }

    // ADD EXISTING CREATOR
    if (!creatorId) {
      return NextResponse.json(
        { error: "Creator ID required" },
        { status: 400 }
      );
    }

    // Verify creator ownership
    const creator = await prisma.creator.findFirst({
      where: {
        id: creatorId,
        userId: user.id,
        agencyId: null,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found or already in an agency" },
        { status: 404 }
      );
    }

    // Add creator to agency
    await prisma.creator.update({
      where: { id: creatorId },
      data: { agencyId: agency.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AGENCY CREATORS POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove creator from agency
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.isAgencyOwner) {
      return NextResponse.json({ error: "Not an agency owner" }, { status: 403 });
    }

    const { creatorId } = await req.json();

    if (!creatorId) {
      return NextResponse.json({ error: "Creator ID required" }, { status: 400 });
    }

    // Get user's agency
    const agency = await prisma.agency.findFirst({
      where: { ownerId: user.id },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Verify creator belongs to this agency
    const creator = await prisma.creator.findFirst({
      where: {
        id: creatorId,
        agencyId: agency.id,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found in this agency" },
        { status: 404 }
      );
    }

    // Remove creator from agency
    await prisma.creator.update({
      where: { id: creatorId },
      data: { agencyId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AGENCY CREATORS DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
