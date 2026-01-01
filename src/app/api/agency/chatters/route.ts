import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Helper to verify agency ownership
async function verifyAgencyOwnership(userId: string, agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { ownerId: true },
  });
  return agency?.ownerId === userId;
}

// GET /api/agency/chatters - List chatters for an agency
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
      return NextResponse.json(
        { error: "Agency ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyAgencyOwnership(session.user.id, agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const chatters = await prisma.chatter.findMany({
      where: { agencyId },
      include: {
        assignedCreators: {
          select: { creatorSlug: true },
        },
        _count: {
          select: {
            earnings: true,
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get stats for each chatter
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const chattersWithStats = await Promise.all(
      chatters.map(async (chatter) => {
        // Revenue last 30 days
        const earnings = await prisma.chatterEarning.aggregate({
          where: {
            chatterId: chatter.id,
            createdAt: { gte: thirtyDaysAgo },
          },
          _sum: { grossAmount: true, commissionAmount: true },
          _count: true,
        });

        // Messages last 30 days
        const messageCount = await prisma.message.count({
          where: {
            chatterId: chatter.id,
            createdAt: { gte: thirtyDaysAgo },
          },
        });

        // Calculate conversion rate
        const conversationCount = await prisma.message.findMany({
          where: {
            chatterId: chatter.id,
            createdAt: { gte: thirtyDaysAgo },
          },
          select: { conversationId: true },
          distinct: ["conversationId"],
        });

        const conversionRate =
          conversationCount.length > 0
            ? (earnings._count / conversationCount.length) * 100
            : 0;

        // Calculate out-of-shift percentage
        const outsideShiftPercent =
          chatter.totalMessages > 0
            ? Math.round((chatter.messagesOutsideShift / chatter.totalMessages) * 100)
            : 0;

        return {
          ...chatter,
          passwordHash: undefined, // Don't expose password
          schedule: chatter.schedule ? JSON.parse(chatter.schedule) : null,
          stats: {
            revenue30d: earnings._sum.grossAmount || 0,
            commission30d: earnings._sum.commissionAmount || 0,
            sales30d: earnings._count,
            messages30d: messageCount,
            conversations30d: conversationCount.length,
            conversionRate: Math.round(conversionRate * 100) / 100,
            messagesOutsideShift: chatter.messagesOutsideShift,
            outsideShiftPercent,
          },
        };
      })
    );

    return NextResponse.json({ chatters: chattersWithStats });
  } catch (error) {
    console.error("Error fetching chatters:", error);
    return NextResponse.json(
      { error: "Failed to fetch chatters" },
      { status: 500 }
    );
  }
}

// POST /api/agency/chatters - Create a new chatter
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      agencyId,
      email,
      password,
      name,
      commissionEnabled,
      commissionRate,
      assignedCreators,
      schedule,
    } = body;

    if (!agencyId || !email || !password || !name) {
      return NextResponse.json(
        { error: "Agency ID, email, password, and name are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyAgencyOwnership(session.user.id, agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if email already exists
    const existing = await prisma.chatter.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A chatter with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create chatter
    const chatter = await prisma.chatter.create({
      data: {
        agencyId,
        email,
        passwordHash,
        name,
        commissionEnabled: commissionEnabled || false,
        commissionRate: commissionRate || 0.1,
        schedule: schedule ? JSON.stringify(schedule) : null,
        assignedCreators: assignedCreators
          ? {
              create: assignedCreators.map((slug: string) => ({
                creatorSlug: slug,
              })),
            }
          : undefined,
      },
      include: {
        assignedCreators: true,
      },
    });

    return NextResponse.json(
      { chatter: { ...chatter, passwordHash: undefined } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating chatter:", error);
    return NextResponse.json(
      { error: "Failed to create chatter" },
      { status: 500 }
    );
  }
}

// PATCH /api/agency/chatters - Update a chatter
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      email,
      password,
      commissionEnabled,
      commissionRate,
      isActive,
      assignedCreators,
      schedule,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Chatter ID is required" },
        { status: 400 }
      );
    }

    // Get chatter and verify agency ownership
    const chatter = await prisma.chatter.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!chatter) {
      return NextResponse.json({ error: "Chatter not found" }, { status: 404 });
    }

    if (!(await verifyAgencyOwnership(session.user.id, chatter.agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
    if (commissionEnabled !== undefined)
      updateData.commissionEnabled = commissionEnabled;
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (schedule !== undefined) updateData.schedule = schedule ? JSON.stringify(schedule) : null;

    // Update chatter
    const updatedChatter = await prisma.chatter.update({
      where: { id },
      data: updateData,
    });

    // Update assigned creators if provided
    if (assignedCreators !== undefined) {
      // Delete existing assignments
      await prisma.chatterCreatorAssignment.deleteMany({
        where: { chatterId: id },
      });

      // Create new assignments
      if (assignedCreators.length > 0) {
        await prisma.chatterCreatorAssignment.createMany({
          data: assignedCreators.map((slug: string) => ({
            chatterId: id,
            creatorSlug: slug,
          })),
        });
      }
    }

    return NextResponse.json({
      chatter: { ...updatedChatter, passwordHash: undefined },
    });
  } catch (error) {
    console.error("Error updating chatter:", error);
    return NextResponse.json(
      { error: "Failed to update chatter" },
      { status: 500 }
    );
  }
}

// DELETE /api/agency/chatters - Delete a chatter
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Chatter ID is required" },
        { status: 400 }
      );
    }

    // Get chatter and verify agency ownership
    const chatter = await prisma.chatter.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!chatter) {
      return NextResponse.json({ error: "Chatter not found" }, { status: 404 });
    }

    if (!(await verifyAgencyOwnership(session.user.id, chatter.agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.chatter.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chatter:", error);
    return NextResponse.json(
      { error: "Failed to delete chatter" },
      { status: 500 }
    );
  }
}
