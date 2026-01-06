import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

// POST /api/admin/creator-applications/[id]/approve - Approve an application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adminUserId = session.user?.id;

    // Get the application
    const application = await prisma.creatorApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "PENDING") {
      return NextResponse.json(
        { error: "Application has already been processed" },
        { status: 400 }
      );
    }

    // Generate a unique slug
    let baseSlug = application.slug || generateSlug(application.displayName);
    let slug = baseSlug;
    let counter = 1;

    // Check for slug conflicts
    while (await prisma.creator.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the creator profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the creator
      const creator = await tx.creator.create({
        data: {
          slug,
          name: application.displayName,
          displayName: application.displayName,
          bio: application.bio,
          userId: application.userId,
          isActive: true,
        },
      });

      // Update user to be a creator
      await tx.user.update({
        where: { id: application.userId },
        data: { isCreator: true },
      });

      // Update the application
      await tx.creatorApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: adminUserId,
          createdCreatorId: creator.id,
        },
      });

      return creator;
    });

    return NextResponse.json({
      success: true,
      message: "Application approved successfully",
      creator: {
        id: result.id,
        slug: result.slug,
        displayName: result.displayName,
      },
    });
  } catch (error) {
    console.error("Error approving application:", error);
    return NextResponse.json(
      { error: "Failed to approve application" },
      { status: 500 }
    );
  }
}
