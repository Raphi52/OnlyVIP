import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/creator/members - Get all members (followers + subscribers) for creator's profiles
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isCreator: true },
    });

    if (!user?.isCreator) {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 });
    }

    // Get creator filter from query params
    const { searchParams } = new URL(request.url);
    const creatorSlugParam = searchParams.get("creator");

    // Get creator profiles owned by this user
    const creators = await prisma.creator.findMany({
      where: { userId },
      select: { slug: true },
    });

    const ownedSlugs = creators.map((c) => c.slug);

    // If a specific creator is requested, verify ownership and use only that one
    let creatorSlugs: string[];
    if (creatorSlugParam) {
      if (!ownedSlugs.includes(creatorSlugParam)) {
        return NextResponse.json({ error: "Not authorized for this creator" }, { status: 403 });
      }
      creatorSlugs = [creatorSlugParam];
    } else {
      creatorSlugs = ownedSlugs;
    }

    // Get all followers/members for these creators
    const memberRecords = await prisma.creatorMember.findMany({
      where: {
        creatorSlug: { in: creatorSlugs },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get user details for all members
    const memberUserIds = memberRecords.map((m) => m.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: memberUserIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    // Create user map for quick lookup
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Get active subscriptions for these members
    const subscriptions = await prisma.subscription.findMany({
      where: {
        creatorSlug: { in: creatorSlugs },
        userId: { in: memberUserIds },
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      include: {
        plan: {
          select: {
            name: true,
            accessTier: true,
          },
        },
      },
    });

    // Create subscription map
    const subMap = new Map(
      subscriptions.map((s) => [`${s.creatorSlug}-${s.userId}`, s])
    );

    // Transform data - include all followers
    const members = memberRecords.map((member) => {
      const userData = userMap.get(member.userId);
      const subscription = subMap.get(`${member.creatorSlug}-${member.userId}`);

      return {
        id: member.userId,
        name: userData?.name || null,
        email: userData?.email || "Unknown",
        image: userData?.image || null,
        isCreatorVip: member.isVip,
        isBlocked: member.isBlocked,
        notes: member.notes,
        creatorSlug: member.creatorSlug,
        // Subscription info (if any)
        hasSubscription: !!subscription,
        subscriptionId: subscription?.id || null,
        planName: subscription?.plan.name || "Follower",
        accessTier: subscription?.plan.accessTier || "FREE",
        followedAt: member.createdAt,
        subscribedAt: subscription?.createdAt || null,
        expiresAt: subscription?.currentPeriodEnd || null,
      };
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// PATCH /api/creator/members - Update member status (VIP/block)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isCreator: true },
    });

    if (!user?.isCreator) {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, creatorSlug, isVip, isBlocked, notes } = body;

    if (!memberId || !creatorSlug) {
      return NextResponse.json(
        { error: "Missing memberId or creatorSlug" },
        { status: 400 }
      );
    }

    // Verify creator owns this profile
    const creator = await prisma.creator.findFirst({
      where: {
        slug: creatorSlug,
        userId,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Not authorized for this creator" },
        { status: 403 }
      );
    }

    // Upsert member record
    const memberRecord = await prisma.creatorMember.upsert({
      where: {
        creatorSlug_userId: {
          creatorSlug,
          userId: memberId,
        },
      },
      update: {
        ...(isVip !== undefined && { isVip }),
        ...(isBlocked !== undefined && { isBlocked }),
        ...(notes !== undefined && { notes }),
      },
      create: {
        creatorSlug,
        userId: memberId,
        isVip: isVip || false,
        isBlocked: isBlocked || false,
        notes: notes || null,
      },
    });

    return NextResponse.json({ member: memberRecord });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
