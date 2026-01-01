import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency/listing - Get current agency's listing
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find agency owned by user
    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
      include: { listing: true },
    });

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    if (!agency.listing) {
      return NextResponse.json({ listing: null, agency: { id: agency.id, name: agency.name, logo: agency.logo } });
    }

    // Parse JSON fields
    const listing = {
      ...agency.listing,
      lookingFor: agency.listing.lookingFor ? JSON.parse(agency.listing.lookingFor) : [],
      contentTypes: agency.listing.contentTypes ? JSON.parse(agency.listing.contentTypes) : [],
    };

    return NextResponse.json({ listing, agency: { id: agency.id, name: agency.name, logo: agency.logo } });
  } catch (error) {
    console.error("Error fetching agency listing:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

// POST /api/agency/listing - Create agency listing
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
      include: { listing: true },
    });

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    if (agency.listing) {
      return NextResponse.json(
        { error: "Listing already exists. Use PATCH to update." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      headline,
      description,
      lookingFor,
      contentTypes,
      requirements,
      minRevenueShare,
      maxRevenueShare,
      providesContent,
      providesChatting,
      providesMarketing,
      location,
      acceptsRemote,
    } = body;

    const listing = await prisma.agencyListing.create({
      data: {
        agencyId: agency.id,
        headline: headline || null,
        description: description || null,
        lookingFor: lookingFor ? JSON.stringify(lookingFor) : null,
        contentTypes: contentTypes ? JSON.stringify(contentTypes) : null,
        requirements: requirements || null,
        minRevenueShare: minRevenueShare ?? 50,
        maxRevenueShare: maxRevenueShare ?? 70,
        providesContent: providesContent ?? false,
        providesChatting: providesChatting ?? true,
        providesMarketing: providesMarketing ?? true,
        location: location || null,
        acceptsRemote: acceptsRemote ?? true,
        isActive: true,
      },
    });

    return NextResponse.json({
      listing: {
        ...listing,
        lookingFor: listing.lookingFor ? JSON.parse(listing.lookingFor) : [],
        contentTypes: listing.contentTypes ? JSON.parse(listing.contentTypes) : [],
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating agency listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}

// PATCH /api/agency/listing - Update agency listing
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
      include: { listing: true },
    });

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    if (!agency.listing) {
      return NextResponse.json(
        { error: "No listing found. Create one first." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      headline,
      description,
      lookingFor,
      contentTypes,
      requirements,
      minRevenueShare,
      maxRevenueShare,
      providesContent,
      providesChatting,
      providesMarketing,
      location,
      acceptsRemote,
      isActive,
    } = body;

    const updateData: any = {};
    if (headline !== undefined) updateData.headline = headline;
    if (description !== undefined) updateData.description = description;
    if (lookingFor !== undefined) updateData.lookingFor = JSON.stringify(lookingFor);
    if (contentTypes !== undefined) updateData.contentTypes = JSON.stringify(contentTypes);
    if (requirements !== undefined) updateData.requirements = requirements;
    if (minRevenueShare !== undefined) updateData.minRevenueShare = minRevenueShare;
    if (maxRevenueShare !== undefined) updateData.maxRevenueShare = maxRevenueShare;
    if (providesContent !== undefined) updateData.providesContent = providesContent;
    if (providesChatting !== undefined) updateData.providesChatting = providesChatting;
    if (providesMarketing !== undefined) updateData.providesMarketing = providesMarketing;
    if (location !== undefined) updateData.location = location;
    if (acceptsRemote !== undefined) updateData.acceptsRemote = acceptsRemote;
    if (isActive !== undefined) updateData.isActive = isActive;

    const listing = await prisma.agencyListing.update({
      where: { id: agency.listing.id },
      data: updateData,
    });

    return NextResponse.json({
      listing: {
        ...listing,
        lookingFor: listing.lookingFor ? JSON.parse(listing.lookingFor) : [],
        contentTypes: listing.contentTypes ? JSON.parse(listing.contentTypes) : [],
      },
    });
  } catch (error) {
    console.error("Error updating agency listing:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

// DELETE /api/agency/listing - Delete agency listing
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
      include: { listing: true },
    });

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    if (!agency.listing) {
      return NextResponse.json({ error: "No listing found" }, { status: 404 });
    }

    await prisma.agencyListing.delete({
      where: { id: agency.listing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting agency listing:", error);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}
