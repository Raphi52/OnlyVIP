import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency-applications - Get applications for current user (model or agency)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // "received" | "sent" | "all"

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // Get model's listing
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
      include: { modelListing: true },
    });

    // Get agency
    const agency = user?.isAgencyOwner
      ? await prisma.agency.findFirst({
          where: { ownerId: session.user.id },
        })
      : null;

    const applications: any[] = [];

    // Get applications for model
    if (creator?.modelListing) {
      const modelApps = await prisma.agencyApplication.findMany({
        where: {
          modelListingId: creator.modelListing.id,
          ...(type === "received" ? { initiatedBy: "AGENCY" } : {}),
          ...(type === "sent" ? { initiatedBy: "MODEL" } : {}),
        },
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              averageRating: true,
              reviewCount: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      for (const app of modelApps) {
        applications.push({
          ...app,
          perspective: "MODEL",
          otherParty: app.agency,
        });
      }
    }

    // Get applications for agency
    if (agency) {
      const agencyApps = await prisma.agencyApplication.findMany({
        where: {
          agencyId: agency.id,
          ...(type === "received" ? { initiatedBy: "MODEL" } : {}),
          ...(type === "sent" ? { initiatedBy: "AGENCY" } : {}),
        },
        include: {
          modelListing: {
            include: {
              creator: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  displayName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      for (const app of agencyApps) {
        // Avoid duplicates if user is both model and agency
        if (!applications.find(a => a.id === app.id)) {
          applications.push({
            ...app,
            perspective: "AGENCY",
            otherParty: app.modelListing
              ? {
                  id: app.modelListing.id,
                  creatorId: app.modelListing.creatorId,
                  creator: app.modelListing.creator,
                  photos: app.modelListing.photos,
                  revenueShare: app.modelListing.revenueShare,
                  chattingEnabled: app.modelListing.chattingEnabled,
                  averageRating: app.modelListing.averageRating,
                }
              : null,
          });
        }
      }
    }

    // Sort by date
    applications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Count pending applications
    const pendingReceived = applications.filter(
      a => a.status === "PENDING" &&
        ((a.perspective === "MODEL" && a.initiatedBy === "AGENCY") ||
         (a.perspective === "AGENCY" && a.initiatedBy === "MODEL"))
    ).length;

    return NextResponse.json({
      applications,
      pendingReceived,
      hasListing: !!creator?.modelListing,
      hasAgency: !!agency,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

// PATCH /api/agency-applications - Update application status
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, status } = body;

    if (!applicationId || !status) {
      return NextResponse.json({ error: "Application ID and status required" }, { status: 400 });
    }

    if (!["ACCEPTED", "REJECTED", "IGNORED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get application
    const application = await prisma.agencyApplication.findUnique({
      where: { id: applicationId },
      include: {
        modelListing: {
          include: { creator: true },
        },
        agency: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Verify ownership - only the receiver can update status
    const isModelReceiver =
      application.initiatedBy === "AGENCY" &&
      application.modelListing?.creator?.userId === session.user.id;

    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
    });
    const isAgencyReceiver =
      application.initiatedBy === "MODEL" &&
      agency?.id === application.agencyId;

    if (!isModelReceiver && !isAgencyReceiver) {
      return NextResponse.json({ error: "You can only respond to applications sent to you" }, { status: 403 });
    }

    // Update application and handle acceptance
    const updatedApplication = await prisma.$transaction(async (tx) => {
      // Update application status
      const updated = await tx.agencyApplication.update({
        where: { id: applicationId },
        data: { status },
      });

      // If ACCEPTED, link creator to agency
      if (status === "ACCEPTED" && application.modelListingId) {
        const listing = await tx.modelListing.findUnique({
          where: { id: application.modelListingId },
          select: { creatorId: true },
        });

        if (listing) {
          // Assign creator to agency
          await tx.creator.update({
            where: { id: listing.creatorId },
            data: { agencyId: application.agencyId },
          });

          console.log(
            `[Application] Creator ${listing.creatorId} joined agency ${application.agencyId}`
          );
        }
      }

      return updated;
    });

    return NextResponse.json({ application: updatedApplication });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
