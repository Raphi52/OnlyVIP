import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendAgencyOfferEmail } from "@/lib/email";

// POST /api/find-model/[listingId]/contact - Contact a model
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId } = await params;
    const body = await request.json();
    const { message } = body;

    // Check if user is an agency owner
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.isAgencyOwner) {
      return NextResponse.json({ error: "You must be an agency owner" }, { status: 403 });
    }

    // Get user's agency
    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Check if listing exists and is active
    const listing = await prisma.modelListing.findFirst({
      where: {
        id: listingId,
        isActive: true,
      },
      include: {
        creator: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Check if creator is already part of this agency
    if (listing.creator.agencyId === agency.id) {
      return NextResponse.json({ error: "This creator is already part of your agency" }, { status: 400 });
    }

    // Check if application already exists
    const existingApplication = await prisma.agencyApplication.findUnique({
      where: {
        modelListingId_agencyId: {
          modelListingId: listingId,
          agencyId: agency.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json({
        error: "Contact request already exists",
        status: existingApplication.status,
      }, { status: 400 });
    }

    // Create application (initiated by agency)
    const application = await prisma.agencyApplication.create({
      data: {
        modelListingId: listingId,
        agencyId: agency.id,
        initiatedBy: "AGENCY",
        status: "PENDING",
        message: message || null,
      },
    });

    // Send email notification to creator
    if (listing.creator.user?.email) {
      await sendAgencyOfferEmail(
        listing.creator.user.email,
        listing.creator.displayName,
        {
          agencyName: agency.name,
          agencySlug: agency.slug,
          message: message || null,
        }
      );
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Error contacting model:", error);
    return NextResponse.json(
      { error: "Failed to contact model" },
      { status: 500 }
    );
  }
}
