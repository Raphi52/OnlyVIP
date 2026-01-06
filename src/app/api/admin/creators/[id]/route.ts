import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to determine if a string is a cuid (id) or slug
function isCuid(str: string): boolean {
  // cuids are typically 25 characters and start with 'c'
  return str.length === 25 && str.startsWith("c") && /^[a-z0-9]+$/.test(str);
}

// GET /api/admin/creators/[id] - Get a specific creator (supports both ID and slug)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Try to find by id first if it looks like a cuid, otherwise by slug
    const creator = isCuid(id)
      ? await prisma.creator.findUnique({ where: { id } })
      : await prisma.creator.findUnique({ where: { slug: id } });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Verify ownership - only allow viewing creators the user owns
    if (creator.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only view your own creators" }, { status: 403 });
    }

    return NextResponse.json({
      ...creator,
      socialLinks: JSON.parse(creator.socialLinks || "{}"),
      theme: JSON.parse(creator.theme || "{}"),
      stats: {
        photos: creator.photoCount,
        videos: creator.videoCount,
        subscribers: creator.subscriberCount,
      },
    });
  } catch (error) {
    console.error("Error fetching creator:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/creators/[id] - Update a specific creator (supports both ID and slug)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Find creator by id or slug
    const existingCreator = isCuid(id)
      ? await prisma.creator.findUnique({ where: { id }, select: { id: true, userId: true } })
      : await prisma.creator.findUnique({ where: { slug: id }, select: { id: true, userId: true } });

    if (!existingCreator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Admin can update any creator (no ownership check needed)

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.cardImage !== undefined) updateData.cardImage = body.cardImage;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.socialLinks !== undefined) {
      updateData.socialLinks = JSON.stringify(body.socialLinks);
    }

    // AI Girlfriend Mode fields
    if (body.aiResponseDelay !== undefined) updateData.aiResponseDelay = body.aiResponseDelay;
    if (body.aiPersonality !== undefined) updateData.aiPersonality = body.aiPersonality;

    const creator = await prisma.creator.update({
      where: { id: existingCreator.id },
      data: updateData,
    });

    return NextResponse.json({
      creator: {
        ...creator,
        socialLinks: JSON.parse(creator.socialLinks || "{}"),
        theme: JSON.parse(creator.theme || "{}"),
        stats: {
          photos: creator.photoCount,
          videos: creator.videoCount,
          subscribers: creator.subscriberCount,
        },
      },
    });
  } catch (error) {
    console.error("Error updating creator:", error);
    return NextResponse.json(
      { error: "Failed to update creator" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/creators/[id] - Delete a specific creator (supports both ID and slug)
// Admin can delete any creator - cleans up ALL related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the creator by id or slug
    const creator = isCuid(id)
      ? await prisma.creator.findUnique({ where: { id } })
      : await prisma.creator.findUnique({ where: { slug: id } });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Delete all associated data in proper order (respecting foreign keys)
    console.log(`[Admin] Deleting creator ${creator.slug} (${creator.id})`);

    try {
      // Use sequential transaction to ensure proper order
      await prisma.$transaction(async (tx) => {
        // 1. Delete earnings attributions first (they reference CreatorEarning)
        await tx.chatterEarning.deleteMany({
          where: { creatorEarning: { creatorSlug: creator.slug } }
        });
        await tx.aiPersonalityEarning.deleteMany({
          where: { creatorEarning: { creatorSlug: creator.slug } }
        });

        // 2. Delete creator earnings
        await tx.creatorEarning.deleteMany({ where: { creatorSlug: creator.slug } });

        // 3. Delete AI response queue
        await tx.aiResponseQueue.deleteMany({ where: { creatorSlug: creator.slug } });

        // 4. Delete agency-related assignments and AI personalities
        await tx.chatterCreatorAssignment.deleteMany({ where: { creatorSlug: creator.slug } });
        await tx.creatorAiPersonality.deleteMany({ where: { creatorSlug: creator.slug } });
        await tx.script.deleteMany({ where: { creatorSlug: creator.slug } });

        // 5. Delete model listing (AgencyApplication will cascade)
        await tx.modelListing.deleteMany({ where: { creatorId: creator.id } });

        // 6. Delete member management
        await tx.creatorMember.deleteMany({ where: { creatorSlug: creator.slug } });

        // 7. Delete site settings
        await tx.siteSettings.deleteMany({ where: { creatorSlug: creator.slug } });

        // 8. Delete conversations (messages, media, reactions will cascade)
        await tx.conversation.deleteMany({ where: { creatorSlug: creator.slug } });

        // 9. Delete payments
        await tx.payment.deleteMany({ where: { creatorSlug: creator.slug } });

        // 10. Delete subscriptions
        await tx.subscription.deleteMany({ where: { creatorSlug: creator.slug } });

        // 11. Delete media content (purchases will cascade)
        await tx.mediaContent.deleteMany({ where: { creatorSlug: creator.slug } });

        // 12. Finally delete the creator
        await tx.creator.delete({ where: { id: creator.id } });
      }, {
        timeout: 30000, // 30 second timeout for large deletions
      });

      console.log(`[Admin] Successfully deleted creator ${creator.slug}`);
    } catch (txError: any) {
      console.error(`[Admin] Transaction error deleting creator:`, txError);
      // Log more details about the error
      if (txError.code) {
        console.error(`[Admin] Error code: ${txError.code}`);
      }
      if (txError.meta) {
        console.error(`[Admin] Error meta:`, txError.meta);
      }
      throw txError;
    }

    // Check if user has no more creator profiles, update isCreator flag
    if (creator.userId) {
      const remainingProfiles = await prisma.creator.count({
        where: { userId: creator.userId }
      });
      if (remainingProfiles === 0) {
        await prisma.user.update({
          where: { id: creator.userId },
          data: { isCreator: false }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting creator:", error);
    return NextResponse.json(
      { error: "Failed to delete creator" },
      { status: 500 }
    );
  }
}
