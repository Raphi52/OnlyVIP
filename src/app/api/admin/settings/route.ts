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
      newSlug,
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
      welcomeMediaId,
      welcomeMediaUrl,
      welcomeMediaType,
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

    // Handle slug change
    let finalSlug = creatorSlug;
    if (newSlug && newSlug !== creatorSlug) {
      // Validate new slug format
      if (!/^[a-z0-9-]+$/.test(newSlug)) {
        return NextResponse.json({
          error: "Invalid slug format. Only lowercase letters, numbers, and hyphens allowed."
        }, { status: 400 });
      }

      if (newSlug.length < 2) {
        return NextResponse.json({
          error: "Slug must be at least 2 characters"
        }, { status: 400 });
      }

      // Check if new slug is already taken
      const existingCreator = await prisma.creator.findUnique({
        where: { slug: newSlug },
      });

      if (existingCreator) {
        return NextResponse.json({
          error: "This slug is already taken"
        }, { status: 400 });
      }

      finalSlug = newSlug;
    }

    // Update or create creator info
    const socialLinks = JSON.stringify({
      instagram: instagram || null,
      twitter: twitter || null,
      tiktok: tiktok || null,
    });

    // Use transaction if slug is changing
    const isSlugChanging = finalSlug !== creatorSlug;

    if (isSlugChanging) {
      // Update both creator and site settings in a transaction
      await prisma.$transaction(async (tx) => {
        // First update the Creator slug
        await tx.creator.update({
          where: { slug: creatorSlug },
          data: {
            slug: finalSlug,
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

        // Update SiteSettings creatorSlug
        await tx.siteSettings.updateMany({
          where: { creatorSlug },
          data: {
            creatorSlug: finalSlug,
            siteName: siteName || null,
            siteDescription: siteDescription || null,
            welcomeMessage: welcomeMessage || null,
            welcomeMediaId: welcomeMediaId || null,
            welcomeMediaUrl: welcomeMediaUrl || null,
            primaryColor: primaryColor || null,
            accentColor: accentColor || null,
            pricing: pricing ? JSON.stringify(pricing) : "{}",
            chatEnabled: chatEnabled ?? true,
            tipsEnabled: tipsEnabled ?? true,
            ppvEnabled: ppvEnabled ?? true,
          },
        });
      });

      console.log("[Settings PUT] Slug changed from", creatorSlug, "to", finalSlug);
    } else {
      // Normal update without slug change
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
    }

    console.log("[Settings PUT] Creator updated, now updating SiteSettings...");

    // Update or create site settings (only if slug didn't change, otherwise it was updated in transaction)
    let settings;
    if (!isSlugChanging) {
      settings = await prisma.siteSettings.upsert({
        where: { creatorSlug: finalSlug },
        update: {
          siteName: siteName || null,
          siteDescription: siteDescription || null,
          welcomeMessage: welcomeMessage || null,
          welcomeMediaId: welcomeMediaId || null,
          welcomeMediaUrl: welcomeMediaUrl || null,
          primaryColor: primaryColor || null,
          accentColor: accentColor || null,
          pricing: pricing ? JSON.stringify(pricing) : "{}",
          chatEnabled: chatEnabled ?? true,
          tipsEnabled: tipsEnabled ?? true,
          ppvEnabled: ppvEnabled ?? true,
        },
        create: {
          creatorSlug: finalSlug,
          siteName: siteName || null,
          siteDescription: siteDescription || null,
          welcomeMessage: welcomeMessage || null,
          welcomeMediaId: welcomeMediaId || null,
          welcomeMediaUrl: welcomeMediaUrl || null,
          primaryColor: primaryColor || null,
          accentColor: accentColor || null,
          pricing: pricing ? JSON.stringify(pricing) : "{}",
          chatEnabled: chatEnabled ?? true,
          tipsEnabled: tipsEnabled ?? true,
          ppvEnabled: ppvEnabled ?? true,
        },
      });
    } else {
      settings = await prisma.siteSettings.findUnique({
        where: { creatorSlug: finalSlug },
      });
    }

    console.log("[Settings PUT] Settings saved:", settings);

    return NextResponse.json({
      success: true,
      newSlug: isSlugChanging ? finalSlug : undefined,
      settings: {
        ...settings,
        pricing: settings ? JSON.parse(settings.pricing || "{}") : {},
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
