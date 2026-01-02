/**
 * API: Bundles CRUD
 *
 * GET /api/agency/bundles?agencyId=xxx - List bundles
 * POST /api/agency/bundles - Create bundle
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to verify agency ownership
async function verifyAgencyOwnership(userId: string, agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { ownerId: true },
  });
  return agency?.ownerId === userId;
}

// Get all bundles for agency
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const agencyId = searchParams.get("agencyId");
    const creatorSlug = searchParams.get("creatorSlug");
    const isActive = searchParams.get("isActive");

    if (!agencyId) {
      return NextResponse.json({ error: "agencyId required" }, { status: 400 });
    }

    // Verify ownership
    const isOwner = await verifyAgencyOwnership(session.user.id, agencyId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build query
    const where: Record<string, unknown> = {
      agencyId,
    };

    if (creatorSlug) {
      where.creatorSlug = creatorSlug;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const bundles = await prisma.bundle.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Parse mediaIds and add stats
    const bundlesWithStats = bundles.map((b) => ({
      ...b,
      mediaIds: JSON.parse(b.mediaIds),
      mediaCount: JSON.parse(b.mediaIds).length,
    }));

    return NextResponse.json({ bundles: bundlesWithStats });
  } catch (error) {
    console.error("Get bundles error:", error);
    return NextResponse.json(
      { error: "Failed to get bundles" },
      { status: 500 }
    );
  }
}

// Create new bundle
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      agencyId,
      creatorSlug,
      name,
      description,
      mediaIds,
      originalPrice,
      bundlePrice,
      availableFor,
    } = body;

    // Validate
    if (!agencyId || !creatorSlug || !name || !mediaIds || !originalPrice || !bundlePrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: "mediaIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (bundlePrice >= originalPrice) {
      return NextResponse.json(
        { error: "bundlePrice must be less than originalPrice" },
        { status: 400 }
      );
    }

    // Verify ownership
    const isOwner = await verifyAgencyOwnership(session.user.id, agencyId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Calculate discount percent
    const discountPercent = Math.round(
      ((originalPrice - bundlePrice) / originalPrice) * 100
    );

    // Create bundle
    const bundle = await prisma.bundle.create({
      data: {
        agencyId,
        creatorSlug,
        name,
        description,
        mediaIds: JSON.stringify(mediaIds),
        originalPrice,
        bundlePrice,
        discountPercent,
        availableFor: availableFor || "all",
      },
    });

    return NextResponse.json({
      success: true,
      bundle: {
        ...bundle,
        mediaIds: JSON.parse(bundle.mediaIds),
      },
    });
  } catch (error) {
    console.error("Create bundle error:", error);
    return NextResponse.json(
      { error: "Failed to create bundle" },
      { status: 500 }
    );
  }
}
