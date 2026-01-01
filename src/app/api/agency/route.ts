import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency - Get current user's agency(ies)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencies = await prisma.agency.findMany({
      where: { ownerId: session.user.id },
      include: {
        _count: {
          select: {
            creators: true,
            chatters: true,
            aiPersonalities: true,
            scripts: true,
          },
        },
        creators: {
          select: {
            slug: true,
            name: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Get stats for each agency
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const agenciesWithStats = await Promise.all(
      agencies.map(async (agency) => {
        const creatorSlugs = agency.creators.map((c) => c.slug);

        // Total revenue
        const totalRevenue = await prisma.creatorEarning.aggregate({
          where: { creatorSlug: { in: creatorSlugs } },
          _sum: { grossAmount: true },
        });

        // Revenue last 30 days
        const revenue30d = await prisma.creatorEarning.aggregate({
          where: {
            creatorSlug: { in: creatorSlugs },
            createdAt: { gte: thirtyDaysAgo },
          },
          _sum: { grossAmount: true },
        });

        // Chatter revenue (attributed)
        const chatterRevenue = await prisma.chatterEarning.aggregate({
          where: {
            chatter: { agencyId: agency.id },
            createdAt: { gte: thirtyDaysAgo },
          },
          _sum: { grossAmount: true },
        });

        // AI revenue (attributed)
        const aiRevenue = await prisma.aiPersonalityEarning.aggregate({
          where: {
            aiPersonality: { agencyId: agency.id },
            createdAt: { gte: thirtyDaysAgo },
          },
          _sum: { grossAmount: true },
        });

        return {
          ...agency,
          // Parse JSON fields
          services: agency.services ? JSON.parse(agency.services) : [],
          specialties: agency.specialties ? JSON.parse(agency.specialties) : [],
          socialLinks: agency.socialLinks ? JSON.parse(agency.socialLinks) : {},
          portfolioImages: agency.portfolioImages ? JSON.parse(agency.portfolioImages) : [],
          languages: agency.languages ? JSON.parse(agency.languages) : [],
          stats: {
            totalRevenue: totalRevenue._sum.grossAmount || 0,
            revenue30d: revenue30d._sum.grossAmount || 0,
            chatterRevenue30d: chatterRevenue._sum.grossAmount || 0,
            aiRevenue30d: aiRevenue._sum.grossAmount || 0,
            creatorsCount: agency._count.creators,
            chattersCount: agency._count.chatters,
            aiPersonalitiesCount: agency._count.aiPersonalities,
            scriptsCount: agency._count.scripts,
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

// POST /api/agency - Create a new agency (become agency owner)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, logo } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Agency name is required" },
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
        logo: logo || null,
        ownerId: session.user.id,
        aiEnabled: false, // Disabled by default, admin must enable
      },
    });

    // Mark user as agency owner
    await prisma.user.update({
      where: { id: session.user.id },
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

// PATCH /api/agency - Update agency (owner only)
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
      logo,
      website,
      description,
      tagline,
      services,
      specialties,
      minRevenueShare,
      maxRevenueShare,
      socialLinks,
      portfolioImages,
      location,
      languages,
      yearsInBusiness,
      publicVisible,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Agency ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const agency = await prisma.agency.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!agency || agency.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this agency" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (logo !== undefined) updateData.logo = logo;
    if (website !== undefined) updateData.website = website;
    if (description !== undefined) updateData.description = description;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (services !== undefined) updateData.services = JSON.stringify(services);
    if (specialties !== undefined) updateData.specialties = JSON.stringify(specialties);
    if (minRevenueShare !== undefined) updateData.minRevenueShare = minRevenueShare;
    if (maxRevenueShare !== undefined) updateData.maxRevenueShare = maxRevenueShare;
    if (socialLinks !== undefined) updateData.socialLinks = JSON.stringify(socialLinks);
    if (portfolioImages !== undefined) updateData.portfolioImages = JSON.stringify(portfolioImages);
    if (location !== undefined) updateData.location = location;
    if (languages !== undefined) updateData.languages = JSON.stringify(languages);
    if (yearsInBusiness !== undefined) updateData.yearsInBusiness = yearsInBusiness;
    if (publicVisible !== undefined) updateData.publicVisible = publicVisible;

    const updatedAgency = await prisma.agency.update({
      where: { id },
      data: updateData,
    });

    // Parse JSON fields for response
    const responseAgency = {
      ...updatedAgency,
      services: updatedAgency.services ? JSON.parse(updatedAgency.services) : [],
      specialties: updatedAgency.specialties ? JSON.parse(updatedAgency.specialties) : [],
      socialLinks: updatedAgency.socialLinks ? JSON.parse(updatedAgency.socialLinks) : {},
      portfolioImages: updatedAgency.portfolioImages ? JSON.parse(updatedAgency.portfolioImages) : [],
      languages: updatedAgency.languages ? JSON.parse(updatedAgency.languages) : [],
    };

    return NextResponse.json({ agency: responseAgency });
  } catch (error) {
    console.error("Error updating agency:", error);
    return NextResponse.json(
      { error: "Failed to update agency" },
      { status: 500 }
    );
  }
}
