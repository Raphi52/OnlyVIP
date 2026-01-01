import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/find-agency/[agencyId]/apply - Apply to an agency
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agencyId } = await params;
    const body = await request.json();
    const { message } = body;

    // Get creator's listing
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
      include: { modelListing: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "You must be a creator first" }, { status: 403 });
    }

    if (!creator.modelListing) {
      return NextResponse.json({ error: "You must create a listing first" }, { status: 400 });
    }

    // Check if creator is already part of this agency
    if (creator.agencyId === agencyId) {
      return NextResponse.json({ error: "You are already part of this agency" }, { status: 400 });
    }

    // Check if agency exists and is public
    const agency = await prisma.agency.findFirst({
      where: {
        id: agencyId,
        publicVisible: true,
        status: "ACTIVE",
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Check if application already exists
    const existingApplication = await prisma.agencyApplication.findUnique({
      where: {
        modelListingId_agencyId: {
          modelListingId: creator.modelListing.id,
          agencyId: agencyId,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json({
        error: "Application already exists",
        status: existingApplication.status,
      }, { status: 400 });
    }

    // Create application
    const application = await prisma.agencyApplication.create({
      data: {
        modelListingId: creator.modelListing.id,
        agencyId: agencyId,
        initiatedBy: "MODEL",
        status: "PENDING",
        message: message || null,
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Error applying to agency:", error);
    return NextResponse.json(
      { error: "Failed to apply to agency" },
      { status: 500 }
    );
  }
}
