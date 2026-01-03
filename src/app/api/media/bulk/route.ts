import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/media/bulk - Bulk actions on media items
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids, data } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: action and ids required" },
        { status: 400 }
      );
    }

    // Check user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isCreator: true },
    });

    const isAdmin = user?.role === "ADMIN";

    // Get creator slugs the user has access to
    let allowedSlugs: string[] = [];
    if (!isAdmin) {
      const creators = await prisma.creator.findMany({
        where: { userId: session.user.id },
        select: { slug: true },
      });
      allowedSlugs = creators.map((c) => c.slug);

      if (allowedSlugs.length === 0) {
        return NextResponse.json(
          { error: "No creator access" },
          { status: 403 }
        );
      }
    }

    // Build where clause
    const whereClause: any = {
      id: { in: ids },
    };

    if (!isAdmin) {
      whereClause.creatorSlug = { in: allowedSlugs };
    }

    // Verify all IDs belong to accessible creators
    const mediaCount = await prisma.mediaContent.count({ where: whereClause });
    if (mediaCount !== ids.length) {
      return NextResponse.json(
        { error: "Some media items not found or not accessible" },
        { status: 403 }
      );
    }

    let updated = 0;

    switch (action) {
      case "delete":
        // Delete related records first
        await prisma.$transaction(async (tx) => {
          await tx.mediaPurchase.deleteMany({
            where: { mediaId: { in: ids } },
          });
          await tx.messageMedia.deleteMany({
            where: { mediaId: { in: ids } },
          });
          const result = await tx.mediaContent.deleteMany({
            where: whereClause,
          });
          updated = result.count;
        });
        break;

      case "publish":
        const publishResult = await prisma.mediaContent.updateMany({
          where: whereClause,
          data: {
            isPublished: true,
            publishedAt: new Date(),
          },
        });
        updated = publishResult.count;
        break;

      case "unpublish":
        const unpublishResult = await prisma.mediaContent.updateMany({
          where: whereClause,
          data: {
            isPublished: false,
          },
        });
        updated = unpublishResult.count;
        break;

      case "update":
        if (!data || typeof data !== "object") {
          return NextResponse.json(
            { error: "Data required for update action" },
            { status: 400 }
          );
        }

        // Build update data
        const updateData: any = {};

        if (typeof data.tagGallery === "boolean") {
          updateData.tagGallery = data.tagGallery;
        }
        if (typeof data.tagPPV === "boolean") {
          updateData.tagPPV = data.tagPPV;
          // Clear price if PPV is disabled
          if (!data.tagPPV) {
            updateData.ppvPriceCredits = null;
          }
        }
        if (typeof data.tagAI === "boolean") {
          updateData.tagAI = data.tagAI;
        }
        if (typeof data.tagFree === "boolean") {
          updateData.tagFree = data.tagFree;
        }
        if (typeof data.tagVIP === "boolean") {
          updateData.tagVIP = data.tagVIP;
        }
        if (data.ppvPriceCredits !== undefined) {
          updateData.ppvPriceCredits = data.ppvPriceCredits;
        }

        if (Object.keys(updateData).length === 0) {
          return NextResponse.json(
            { error: "No valid update fields provided" },
            { status: 400 }
          );
        }

        const updateResult = await prisma.mediaContent.updateMany({
          where: whereClause,
          data: updateData,
        });
        updated = updateResult.count;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      updated,
      action,
    });
  } catch (error) {
    console.error("[MEDIA BULK]", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
