import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Handle credit grant separately
    if (body.creditGrant && body.creditGrant > 0) {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { creditBalance: true, paidCredits: true, bonusCredits: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Determine credit type (default to PAID)
      const creditType = body.creditType === "BONUS" ? "BONUS" : "PAID";
      const isPaid = creditType === "PAID";

      const newTotal = (user.creditBalance || 0) + body.creditGrant;
      const newPaid = isPaid ? (user.paidCredits || 0) + body.creditGrant : (user.paidCredits || 0);
      const newBonus = !isPaid ? (user.bonusCredits || 0) + body.creditGrant : (user.bonusCredits || 0);

      // Calculate expiration (6 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 6);

      // Create transaction record
      await prisma.creditTransaction.create({
        data: {
          userId: id,
          amount: body.creditGrant,
          balance: newTotal,
          type: "ADMIN_GRANT",
          creditType,
          description: body.creditDescription || `Admin ${creditType.toLowerCase()} credit grant`,
          expiresAt,
        },
      });

      // Update user balances
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          creditBalance: newTotal,
          paidCredits: newPaid,
          bonusCredits: newBonus,
        },
      });

      return NextResponse.json({
        user: updatedUser,
        creditsAdded: body.creditGrant,
        creditType,
        newBalance: newTotal,
        newPaidCredits: newPaid,
        newBonusCredits: newBonus,
      });
    }

    const updateData: any = {};
    if (body.role !== undefined) updateData.role = body.role;
    if (body.isCreator !== undefined) updateData.isCreator = body.isCreator;
    if (body.isVip !== undefined) updateData.isVip = body.isVip;
    if (body.isAgencyOwner !== undefined) updateData.isAgencyOwner = body.isAgencyOwner;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.emailVerified !== undefined) {
      updateData.emailVerified = body.emailVerified ? new Date(body.emailVerified) : null;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete everything in a transaction for clean removal
    await prisma.$transaction(async (tx) => {
      // Delete messages sent or received by user
      await tx.message.deleteMany({
        where: { OR: [{ senderId: id }, { receiverId: id }] },
      });

      // Delete conversation participants
      await tx.conversationParticipant.deleteMany({
        where: { userId: id },
      });

      // Delete reactions
      await tx.messageReaction.deleteMany({
        where: { userId: id },
      });

      // Delete subscriptions
      await tx.subscription.deleteMany({
        where: { userId: id },
      });

      // Delete credit transactions
      await tx.creditTransaction.deleteMany({
        where: { userId: id },
      });

      // Delete accounts (OAuth)
      await tx.account.deleteMany({
        where: { userId: id },
      });

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId: id },
      });

      // Finally delete user (cascades remaining relations)
      await tx.user.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
