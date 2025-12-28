import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/user/become-creator - Upgrade existing user to creator
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { slug, displayName } = body;

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

    // Check if user is already a creator
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, isCreator: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.isCreator) {
      return NextResponse.json(
        { error: "You are already a creator" },
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

    // Create creator profile and update user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user to creator
      await tx.user.update({
        where: { id: session.user.id },
        data: { isCreator: true },
      });

      // Create creator profile
      const creator = await tx.creator.create({
        data: {
          slug: cleanSlug,
          name: displayName || user.name || cleanSlug,
          displayName: displayName || user.name || cleanSlug,
          userId: session.user.id,
          isActive: true,
        },
      });

      // Create default site settings
      await tx.siteSettings.create({
        data: {
          creatorSlug: cleanSlug,
          siteName: displayName || user.name || cleanSlug,
        },
      });

      return creator;
    });

    return NextResponse.json({
      success: true,
      message: "You are now a creator!",
      creatorSlug: result.slug,
    });
  } catch (error) {
    console.error("Become creator error:", error);
    return NextResponse.json(
      { error: "Failed to create creator profile. Please try again." },
      { status: 500 }
    );
  }
}

// GET /api/user/become-creator?slug=xxx - Check slug availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter required" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim();

    // Reserved slugs
    const reservedSlugs = ["admin", "api", "auth", "dashboard", "gallery", "checkout", "membership", "settings", "billing", "messages"];
    if (reservedSlugs.includes(cleanSlug)) {
      return NextResponse.json({ available: false, reason: "reserved" });
    }

    const existingCreator = await prisma.creator.findUnique({
      where: { slug: cleanSlug },
    });

    return NextResponse.json({
      available: !existingCreator,
      reason: existingCreator ? "taken" : null,
    });
  } catch (error) {
    console.error("Slug check error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
