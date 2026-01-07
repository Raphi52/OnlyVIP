import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendFollowWelcomeEmail } from "@/lib/email";

// POST /api/creators/[slug]/follow - Follow a creator
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Check if creator exists
    const creator = await prisma.creator.findUnique({
      where: { slug },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Can't follow yourself
    if (creator.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if already following
    const existingMember = await prisma.creatorMember.findUnique({
      where: {
        creatorSlug_userId: {
          creatorSlug: slug,
          userId: session.user.id,
        },
      },
    });

    // Already following - return early without sending email
    if (existingMember) {
      return NextResponse.json({
        success: true,
        following: true,
        member: existingMember,
        alreadyFollowing: true,
      });
    }

    // New follow - create member record with race condition protection
    let member;
    let isNewFollow = false;
    try {
      member = await prisma.creatorMember.create({
        data: {
          creatorSlug: slug,
          userId: session.user.id,
          isVip: false,
          isBlocked: false,
        },
      });
      isNewFollow = true;
    } catch (error: any) {
      // Unique constraint violation - already following (race condition)
      if (error?.code === "P2002") {
        const existing = await prisma.creatorMember.findUnique({
          where: {
            creatorSlug_userId: {
              creatorSlug: slug,
              userId: session.user.id,
            },
          },
        });
        return NextResponse.json({
          success: true,
          following: true,
          member: existing,
          alreadyFollowing: true,
        });
      }
      throw error;
    }

    // Send welcome email ONLY for genuinely new followers
    if (isNewFollow && session.user.email) {
      sendFollowWelcomeEmail(
        session.user.email,
        session.user.name || "",
        {
          creatorName: creator.displayName,
          creatorSlug: creator.slug,
          creatorAvatar: creator.avatar,
        }
      ).catch((err) => console.error("[Follow] Failed to send welcome email:", err));
    }

    return NextResponse.json({
      success: true,
      following: true,
      member
    });
  } catch (error) {
    console.error("Error following creator:", error);
    return NextResponse.json(
      { error: "Failed to follow creator" },
      { status: 500 }
    );
  }
}

// DELETE /api/creators/[slug]/follow - Unfollow a creator
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Delete member record (only if not VIP - can't unfollow if VIP)
    const member = await prisma.creatorMember.findUnique({
      where: {
        creatorSlug_userId: {
          creatorSlug: slug,
          userId: session.user.id,
        },
      },
    });

    if (member?.isVip) {
      return NextResponse.json(
        { error: "Cannot unfollow while VIP. Contact creator to remove VIP first." },
        { status: 400 }
      );
    }

    await prisma.creatorMember.deleteMany({
      where: {
        creatorSlug: slug,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      following: false
    });
  } catch (error) {
    console.error("Error unfollowing creator:", error);
    return NextResponse.json(
      { error: "Failed to unfollow creator" },
      { status: 500 }
    );
  }
}

// GET /api/creators/[slug]/follow - Check if following
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ following: false, isVip: false });
    }

    const { slug } = await params;

    const member = await prisma.creatorMember.findUnique({
      where: {
        creatorSlug_userId: {
          creatorSlug: slug,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      following: !!member,
      isVip: member?.isVip || false,
      isBlocked: member?.isBlocked || false,
    });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json({ following: false, isVip: false });
  }
}
