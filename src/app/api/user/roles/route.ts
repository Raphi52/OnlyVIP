import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/user/roles - Get current user's roles and what can be changed
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        isCreator: true,
        isAgencyOwner: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has creator profiles
    const creatorCount = await prisma.creator.count({
      where: { userId: session.user.id },
    });

    // Check if user has an agency
    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      role: user.role,
      isCreator: user.isCreator,
      isAgencyOwner: user.isAgencyOwner,
      canDisableCreator: creatorCount === 0,
      canDisableAgency: !agency,
      hasCreatorProfiles: creatorCount,
      hasAgency: !!agency,
      agencyName: agency?.name || null,
    });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user roles" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/roles - Update user's roles
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        isCreator: true,
        isAgencyOwner: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (action) {
      case "enableCreator": {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { isCreator: true },
        });
        return NextResponse.json({ success: true, message: "Creator mode enabled" });
      }

      case "disableCreator": {
        // Check if user has any creator profiles
        const creatorCount = await prisma.creator.count({
          where: { userId: session.user.id },
        });

        if (creatorCount > 0) {
          return NextResponse.json(
            { error: "You must delete all your creator profiles first" },
            { status: 400 }
          );
        }

        // Also disable agency if enabled
        await prisma.user.update({
          where: { id: session.user.id },
          data: { isCreator: false, isAgencyOwner: false },
        });
        return NextResponse.json({ success: true, message: "Creator mode disabled" });
      }

      case "enableAgency": {
        if (!user.isCreator) {
          return NextResponse.json(
            { error: "You must be a creator first to become an agency owner" },
            { status: 400 }
          );
        }

        // Check if user already has an agency
        const existingAgency = await prisma.agency.findFirst({
          where: { ownerId: session.user.id },
        });

        if (existingAgency) {
          return NextResponse.json(
            { error: "You already have an agency" },
            { status: 400 }
          );
        }

        await prisma.user.update({
          where: { id: session.user.id },
          data: { isAgencyOwner: true },
        });
        return NextResponse.json({
          success: true,
          message: "Agency mode enabled",
          redirectTo: "/dashboard/agency"
        });
      }

      case "disableAgency": {
        // Check if user has an agency
        const agency = await prisma.agency.findFirst({
          where: { ownerId: session.user.id },
        });

        if (agency) {
          return NextResponse.json(
            { error: "You must delete your agency first" },
            { status: 400 }
          );
        }

        await prisma.user.update({
          where: { id: session.user.id },
          data: { isAgencyOwner: false },
        });
        return NextResponse.json({ success: true, message: "Agency mode disabled" });
      }

      case "resignAdmin": {
        if (user.role !== "ADMIN") {
          return NextResponse.json(
            { error: "You are not an admin" },
            { status: 400 }
          );
        }

        await prisma.user.update({
          where: { id: session.user.id },
          data: { role: "USER" },
        });
        return NextResponse.json({
          success: true,
          message: "Admin privileges removed. You will need another admin to restore them."
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error updating user roles:", error);
    return NextResponse.json(
      { error: "Failed to update user roles" },
      { status: 500 }
    );
  }
}
