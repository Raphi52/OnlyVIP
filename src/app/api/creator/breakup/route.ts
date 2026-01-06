import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/creator/breakup - Creator requests to leave agency (instant)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { creatorSlug } = body;

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Find creator and verify ownership
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      include: { agency: { select: { id: true, name: true } } },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Verify the user is the original owner of this creator
    if (creator.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only request breakup for your own creator profile" },
        { status: 403 }
      );
    }

    // Verify creator is currently agency-managed
    if (!creator.isAgencyManaged || !creator.agencyId) {
      return NextResponse.json(
        { error: "Creator is not currently managed by an agency" },
        { status: 400 }
      );
    }

    const previousAgencyName = creator.agency?.name || "Unknown Agency";

    // Instant breakup - remove agency and management flags
    await prisma.creator.update({
      where: { slug: creatorSlug },
      data: {
        agencyId: null,
        isAgencyManaged: false,
        agencyManagedAt: null,
        // Keep originalOwnerId for audit trail
      },
    });

    console.log(`[Breakup] Creator ${creatorSlug} left agency ${previousAgencyName} (user: ${session.user.id})`);

    return NextResponse.json({
      success: true,
      message: `You have successfully left ${previousAgencyName}. You now have full control of your profile.`,
      previousAgency: previousAgencyName,
    });
  } catch (error) {
    console.error("Error processing breakup:", error);
    return NextResponse.json(
      { error: "Failed to process breakup request" },
      { status: 500 }
    );
  }
}

// GET /api/creator/breakup?creator=slug - Check breakup eligibility
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creator");

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      include: { agency: { select: { id: true, name: true } } },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const isOwner = creator.userId === session.user.id;
    const canBreakup = isOwner && creator.isAgencyManaged && creator.agencyId !== null;

    return NextResponse.json({
      canBreakup,
      isAgencyManaged: creator.isAgencyManaged,
      agencyName: creator.agency?.name || null,
      agencyManagedAt: creator.agencyManagedAt,
    });
  } catch (error) {
    console.error("Error checking breakup eligibility:", error);
    return NextResponse.json(
      { error: "Failed to check breakup eligibility" },
      { status: 500 }
    );
  }
}
