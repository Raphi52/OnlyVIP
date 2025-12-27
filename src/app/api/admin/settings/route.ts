import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/admin/settings?creator=slug - Get settings for a creator
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === "ADMIN";
    const isCreator = (session?.user as any)?.isCreator === true;

    if (!session || (!isAdmin && !isCreator)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creator");

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Get creator info
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Get or create settings for this creator
    let settings = await prisma.siteSettings.findUnique({
      where: { creatorSlug },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          creatorSlug,
          siteName: creator.displayName,
        },
      });
    }

    // Combine creator info with settings
    const response = {
      // From Creator model
      creatorName: creator.displayName,
      creatorImage: creator.avatar,
      cardImage: creator.cardImage,
      coverImage: creator.coverImage,
      creatorBio: creator.bio,
      instagram: JSON.parse(creator.socialLinks || "{}").instagram || null,
      twitter: JSON.parse(creator.socialLinks || "{}").twitter || null,
      tiktok: JSON.parse(creator.socialLinks || "{}").tiktok || null,
      walletEth: creator.walletEth || null,
      walletBtc: creator.walletBtc || null,
      // From SiteSettings model
      ...settings,
      pricing: JSON.parse(settings.pricing || "{}"),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update settings for a creator
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const isAdminUser = (session?.user as any)?.role === "ADMIN";
    const isCreator = (session?.user as any)?.isCreator === true;

    console.log("[Settings PUT] session:", session?.user?.email, "isAdmin:", isAdminUser, "isCreator:", isCreator);

    if (!session || (!isAdminUser && !isCreator)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[Settings PUT] Body received:", body);
    const {
      creatorSlug,
      // Creator fields
      creatorName,
      creatorImage,
      cardImage,
      coverImage,
      creatorBio,
      instagram,
      twitter,
      tiktok,
      // Site settings fields
      siteName,
      siteDescription,
      welcomeMessage,
      primaryColor,
      accentColor,
      pricing,
      chatEnabled,
      tipsEnabled,
      ppvEnabled,
      walletEth,
      walletBtc,
    } = body;

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Update or create creator info
    const socialLinks = JSON.stringify({
      instagram: instagram || null,
      twitter: twitter || null,
      tiktok: tiktok || null,
    });

    await prisma.creator.upsert({
      where: { slug: creatorSlug },
      update: {
        displayName: creatorName || "Creator",
        name: creatorName || "Creator",
        avatar: creatorImage || null,
        cardImage: cardImage || null,
        coverImage: coverImage || null,
        bio: creatorBio || null,
        socialLinks,
        walletEth: walletEth || null,
        walletBtc: walletBtc || null,
      },
      create: {
        slug: creatorSlug,
        displayName: creatorName || "Creator",
        name: creatorName || "Creator",
        avatar: creatorImage || null,
        cardImage: cardImage || null,
        coverImage: coverImage || null,
        bio: creatorBio || null,
        socialLinks,
        walletEth: walletEth || null,
        walletBtc: walletBtc || null,
      },
    });

    console.log("[Settings PUT] Creator updated, now updating SiteSettings...");

    // Update or create site settings
    const settings = await prisma.siteSettings.upsert({
      where: { creatorSlug },
      update: {
        siteName: siteName || null,
        siteDescription: siteDescription || null,
        welcomeMessage: welcomeMessage || null,
        primaryColor: primaryColor || null,
        accentColor: accentColor || null,
        pricing: pricing ? JSON.stringify(pricing) : "{}",
        chatEnabled: chatEnabled ?? true,
        tipsEnabled: tipsEnabled ?? true,
        ppvEnabled: ppvEnabled ?? true,
      },
      create: {
        creatorSlug,
        siteName: siteName || null,
        siteDescription: siteDescription || null,
        welcomeMessage: welcomeMessage || null,
        primaryColor: primaryColor || null,
        accentColor: accentColor || null,
        pricing: pricing ? JSON.stringify(pricing) : "{}",
        chatEnabled: chatEnabled ?? true,
        tipsEnabled: tipsEnabled ?? true,
        ppvEnabled: ppvEnabled ?? true,
      },
    });

    console.log("[Settings PUT] Settings saved:", settings);

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        pricing: JSON.parse(settings.pricing || "{}"),
      },
    });
  } catch (error) {
    console.error("[Settings PUT] Error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
