import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/creator/settings?creator=slug - Get creator settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creator");

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Find creator and verify ownership
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Check if user owns this creator profile or is admin
    const user = session.user as { id: string; role?: string };
    const isAdmin = user.role === "ADMIN";
    if (creator.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get site settings for this creator
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { creatorSlug },
    });

    // Parse JSON fields from Creator
    const socialLinks = JSON.parse(creator.socialLinks || "{}");
    const categories = JSON.parse(creator.categories || "[]");
    const theme = JSON.parse(creator.theme || "{}");

    // Parse JSON fields from SiteSettings
    const pricing = siteSettings ? JSON.parse(siteSettings.pricing || "{}") : {};

    return NextResponse.json({
      creatorSlug: creator.slug,
      creatorName: creator.displayName,
      creatorImage: creator.avatar,
      coverImage: creator.coverImage,
      cardImage: creator.cardImage,
      creatorBio: creator.bio,
      categories,
      instagram: socialLinks.instagram || "",
      twitter: socialLinks.twitter || "",
      tiktok: socialLinks.tiktok || "",
      siteName: siteSettings?.siteName || "",
      siteDescription: siteSettings?.siteDescription || "",
      welcomeMessage: siteSettings?.welcomeMessage || "",
      welcomeMediaId: siteSettings?.welcomeMediaId,
      welcomeMediaUrl: siteSettings?.welcomeMediaUrl,
      chatEnabled: siteSettings?.chatEnabled ?? true,
      tipsEnabled: siteSettings?.tipsEnabled ?? true,
      ppvEnabled: siteSettings?.ppvEnabled ?? true,
      walletEth: creator.walletEth || "",
      walletBtc: creator.walletBtc || "",
      pricing: pricing,
      theme,
    });
  } catch (error) {
    console.error("Error fetching creator settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/creator/settings - Update creator settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      creatorSlug,
      newSlug,
      creatorName,
      creatorImage,
      coverImage,
      cardImage,
      creatorBio,
      categories,
      instagram,
      twitter,
      tiktok,
      siteName,
      siteDescription,
      welcomeMessage,
      welcomeMediaId,
      welcomeMediaUrl,
      chatEnabled,
      tipsEnabled,
      ppvEnabled,
      walletEth,
      walletBtc,
      pricing,
    } = body;

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Find creator and verify ownership
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Check if user owns this creator profile or is admin
    const user = session.user as { id: string; role?: string };
    const isAdmin = user.role === "ADMIN";
    if (creator.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if new slug is available
    if (newSlug && newSlug !== creatorSlug) {
      const existing = await prisma.creator.findUnique({
        where: { slug: newSlug },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This slug is already taken" },
          { status: 400 }
        );
      }
    }

    // Prepare social links
    const socialLinks = JSON.stringify({
      instagram: instagram || null,
      twitter: twitter || null,
      tiktok: tiktok || null,
    });

    // Update creator
    const updatedCreator = await prisma.creator.update({
      where: { slug: creatorSlug },
      data: {
        slug: newSlug || creatorSlug,
        displayName: creatorName,
        avatar: creatorImage,
        coverImage,
        cardImage,
        bio: creatorBio,
        categories: JSON.stringify(categories || []),
        socialLinks,
        walletEth,
        walletBtc,
      },
    });

    // Upsert site settings
    await prisma.siteSettings.upsert({
      where: { creatorSlug: updatedCreator.slug },
      create: {
        creatorSlug: updatedCreator.slug,
        siteName,
        siteDescription,
        welcomeMessage,
        welcomeMediaId,
        welcomeMediaUrl,
        chatEnabled: chatEnabled ?? true,
        tipsEnabled: tipsEnabled ?? true,
        ppvEnabled: ppvEnabled ?? true,
        pricing: pricing ? JSON.stringify(pricing) : "{}",
      },
      update: {
        siteName,
        siteDescription,
        welcomeMessage,
        welcomeMediaId,
        welcomeMediaUrl,
        chatEnabled: chatEnabled ?? true,
        tipsEnabled: tipsEnabled ?? true,
        ppvEnabled: ppvEnabled ?? true,
        ...(pricing && { pricing: JSON.stringify(pricing) }),
      },
    });

    return NextResponse.json({ success: true, slug: updatedCreator.slug });
  } catch (error) {
    console.error("Error updating creator settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
