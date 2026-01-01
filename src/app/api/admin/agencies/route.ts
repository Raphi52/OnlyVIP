import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/agencies - List all agencies (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            creators: true,
            chatters: true,
            aiPersonalities: true,
          },
        },
      },
    });

    // Get revenue stats for each agency (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const agenciesWithStats = await Promise.all(
      agencies.map(async (agency) => {
        const creatorSlugs = await prisma.creator.findMany({
          where: { agencyId: agency.id },
          select: { slug: true },
        });

        const revenue = await prisma.creatorEarning.aggregate({
          where: {
            creatorSlug: { in: creatorSlugs.map((c) => c.slug) },
            createdAt: { gte: thirtyDaysAgo },
          },
          _sum: { grossAmount: true },
        });

        return {
          ...agency,
          stats: {
            creators: agency._count.creators,
            chatters: agency._count.chatters,
            aiPersonalities: agency._count.aiPersonalities,
            revenue30d: revenue._sum.grossAmount || 0,
          },
        };
      })
    );

    return NextResponse.json({ agencies: agenciesWithStats });
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return NextResponse.json(
      { error: "Failed to fetch agencies" },
      { status: 500 }
    );
  }
}

// POST /api/admin/agencies - Create new agency (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, ownerEmail, aiEnabled, platformFee } = body;

    if (!name || !ownerEmail) {
      return NextResponse.json(
        { error: "Name and owner email are required" },
        { status: 400 }
      );
    }

    // Find or create owner user
    let owner = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (!owner) {
      return NextResponse.json(
        { error: "User with this email not found" },
        { status: 404 }
      );
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug exists
    const existing = await prisma.agency.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "An agency with this name already exists" },
        { status: 400 }
      );
    }

    // Create agency
    const agency = await prisma.agency.create({
      data: {
        name,
        slug,
        ownerId: owner.id,
        aiEnabled: aiEnabled || false,
        platformFee: platformFee || 0.1,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Mark user as agency owner
    await prisma.user.update({
      where: { id: owner.id },
      data: { isAgencyOwner: true },
    });

    return NextResponse.json({ agency }, { status: 201 });
  } catch (error) {
    console.error("Error creating agency:", error);
    return NextResponse.json(
      { error: "Failed to create agency" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/agencies - Update agency settings (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, aiEnabled, platformFee, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Agency ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (aiEnabled !== undefined) updateData.aiEnabled = aiEnabled;
    if (platformFee !== undefined) updateData.platformFee = platformFee;
    if (status !== undefined) updateData.status = status;

    const agency = await prisma.agency.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            creators: true,
            chatters: true,
          },
        },
      },
    });

    return NextResponse.json({ agency });
  } catch (error) {
    console.error("Error updating agency:", error);
    return NextResponse.json(
      { error: "Failed to update agency" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/agencies - Delete agency (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Agency ID is required" },
        { status: 400 }
      );
    }

    // Delete agency (cascades to chatters, ai personalities, scripts)
    await prisma.agency.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting agency:", error);
    return NextResponse.json(
      { error: "Failed to delete agency" },
      { status: 500 }
    );
  }
}
