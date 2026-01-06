import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single media item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const media = await prisma.mediaContent.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.mediaContent.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Check if user has access to content
    let hasAccess = false;
    let hasPurchased = false;
    const isAdmin = (session?.user as any)?.role === "ADMIN";

    // Free content is always accessible
    if (media.tagFree === true) {
      hasAccess = true;
    }

    if (session?.user?.id && !hasAccess) {
      // Check if purchased
      const purchase = await prisma.mediaPurchase.findUnique({
        where: {
          userId_mediaId: {
            userId: session.user.id,
            mediaId: id,
          },
        },
      });
      hasPurchased = !!purchase;

      if (hasPurchased) {
        hasAccess = true;
      } else {
        // Get user subscription
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: session.user.id,
            status: "ACTIVE",
          },
          include: {
            plan: true,
          },
        });

        const tierOrder = ["FREE", "BASIC", "PREMIUM", "VIP"];
        const userTierIndex = subscription ? tierOrder.indexOf(subscription.plan.accessTier) : 0;
        const isVIP = subscription?.plan?.accessTier === "VIP";

        // VIP-only content requires VIP subscription
        if (media.tagVIP === true) {
          hasAccess = isVIP;
        }
        // PPV content requires purchase (not subscription)
        else if (media.tagPPV === true) {
          hasAccess = false; // Must be purchased, already checked above
        }
        // Regular tier-based access
        else {
          const mediaTierIndex = tierOrder.indexOf(media.accessTier);
          hasAccess = userTierIndex >= mediaTierIndex;
        }
      }
    }

    // Security: For photos, thumbnailUrl = contentUrl so we MUST hide both for locked content
    const LOCKED_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23d4af37'/%3E%3Cstop offset='50%25' style='stop-color:%23b8860b'/%3E%3Cstop offset='100%25' style='stop-color:%23996515'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='400' height='400'/%3E%3C/svg%3E";

    const userHasAccess = hasAccess || hasPurchased;
    const isPhoto = media.type === "PHOTO";
    const isPPV = media.tagPPV === true;
    const isVIPOnly = media.tagVIP === true;
    const shouldHideThumbnail = !userHasAccess && !isAdmin && (isPhoto || isPPV || isVIPOnly);

    // Prepare response
    const response: any = {
      id: media.id,
      title: media.title,
      slug: media.slug,
      description: media.description,
      type: media.type,
      accessTier: media.accessTier,
      thumbnailUrl: shouldHideThumbnail ? LOCKED_PLACEHOLDER : media.thumbnailUrl,
      previewUrl: shouldHideThumbnail ? LOCKED_PLACEHOLDER : media.previewUrl,
      isPurchaseable: media.isPurchaseable,
      price: media.price,
      viewCount: media.viewCount,
      createdAt: media.createdAt,
      hasAccess: userHasAccess,
      hasPurchased,
      // New tag fields
      tagGallery: media.tagGallery,
      tagPPV: media.tagPPV,
      tagAI: media.tagAI,
      tagFree: media.tagFree,
      tagVIP: media.tagVIP,
      ppvPriceCredits: media.ppvPriceCredits,
    };

    // Include content URL only if user has access or is admin
    if (userHasAccess || isAdmin) {
      response.contentUrl = media.contentUrl;
    }

    // Include purchase count for admins
    if (isAdmin) {
      response.purchaseCount = media._count.purchases;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get media error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// PATCH - Update media (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      accessTier,
      thumbnailUrl,
      previewUrl,
      contentUrl,
      isPurchaseable,
      price,
      // Tag fields
      tagGallery,
      tagPPV,
      tagAI,
      tagFree,
      tagVIP,
      ppvPriceCredits,
    } = body;

    const media = await prisma.mediaContent.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // Check authorization: must be admin or media owner
    const user = session.user as { role?: string };
    const isAdmin = user.role === "ADMIN";

    // Find creator by slug to check ownership
    const creator = await prisma.creator.findUnique({
      where: { slug: media.creatorSlug },
      select: { userId: true },
    });
    const isOwner = creator?.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "You can only edit your own media" },
        { status: 403 }
      );
    }

    // Update slug if title changed
    let slug = media.slug;
    if (title && title !== media.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const existing = await prisma.mediaContent.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const updatedMedia = await prisma.mediaContent.update({
      where: { id },
      data: {
        title: title ?? media.title,
        slug,
        description: description ?? media.description,
        type: type ?? media.type,
        accessTier: accessTier ?? media.accessTier,
        thumbnailUrl: thumbnailUrl ?? media.thumbnailUrl,
        previewUrl: previewUrl ?? media.previewUrl,
        contentUrl: contentUrl ?? media.contentUrl,
        isPurchaseable: isPurchaseable ?? media.isPurchaseable,
        price: isPurchaseable ? (price ?? media.price) : null,
        // Tag fields
        tagGallery: tagGallery ?? media.tagGallery,
        tagPPV: tagPPV ?? media.tagPPV,
        tagAI: tagAI ?? media.tagAI,
        tagFree: tagFree ?? media.tagFree,
        tagVIP: tagVIP ?? media.tagVIP,
        ppvPriceCredits: tagPPV === true ? (ppvPriceCredits ?? media.ppvPriceCredits) : tagPPV === false ? null : media.ppvPriceCredits,
      },
    });

    return NextResponse.json({ media: updatedMedia });
  } catch (error) {
    console.error("Update media error:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE - Delete media (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const media = await prisma.mediaContent.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // Check authorization: must be admin or media owner
    const user = session.user as { role?: string };
    const isAdmin = user.role === "ADMIN";

    // Find creator by slug to check ownership
    const creator = await prisma.creator.findUnique({
      where: { slug: media.creatorSlug },
      select: { userId: true },
    });
    const isOwner = creator?.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "You can only delete your own media" },
        { status: 403 }
      );
    }

    // Delete related records first
    await prisma.mediaPurchase.deleteMany({
      where: { mediaId: id },
    });

    await prisma.messageMedia.deleteMany({
      where: { mediaId: id },
    });

    // Delete media
    await prisma.mediaContent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete media error:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
