import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { unlink, rm } from "fs/promises";
import path from "path";

// GET - List all pending verifications (admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get all verifications
    const verifications = await prisma.creatorVerification.findMany({
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ verifications });
  } catch (error) {
    console.error("Get verifications error:", error);
    return NextResponse.json(
      { error: "Failed to get verifications" },
      { status: 500 }
    );
  }
}

// POST - Approve or reject verification (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { verificationId, action, rejectionReason } = await request.json();

    if (!verificationId || !action) {
      return NextResponse.json(
        { error: "Missing verificationId or action" },
        { status: 400 }
      );
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE or REJECT" },
        { status: 400 }
      );
    }

    // Get the verification
    const verification = await prisma.creatorVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    // Delete uploaded files (GDPR compliance)
    const deleteFiles = async () => {
      const filesToDelete = [
        verification.documentFrontUrl,
        verification.documentBackUrl,
        verification.selfieUrl,
      ].filter(Boolean) as string[];

      for (const fileUrl of filesToDelete) {
        try {
          const filePath = path.join(process.cwd(), fileUrl);
          await unlink(filePath);
        } catch (error) {
          console.error(`Failed to delete file ${fileUrl}:`, error);
        }
      }

      // Try to remove the creator's verification directory
      try {
        const creatorDir = path.join(process.cwd(), "private", "verification", verification.creatorId);
        await rm(creatorDir, { recursive: true, force: true });
      } catch (error) {
        console.error("Failed to remove verification directory:", error);
      }
    };

    if (action === "APPROVE") {
      // Update verification status
      await prisma.creatorVerification.update({
        where: { id: verificationId },
        data: {
          status: "APPROVED",
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
          // Clear file URLs since files will be deleted
          documentFrontUrl: "[DELETED]",
          documentBackUrl: null,
          selfieUrl: "[DELETED]",
        },
      });

      // Delete files after approval
      await deleteFiles();

      return NextResponse.json({
        success: true,
        message: "Verification approved. Documents have been permanently deleted.",
      });
    } else {
      // REJECT
      if (!rejectionReason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }

      // Update verification status
      await prisma.creatorVerification.update({
        where: { id: verificationId },
        data: {
          status: "REJECTED",
          rejectionReason,
          verifiedBy: session.user.id,
          // Clear file URLs since files will be deleted
          documentFrontUrl: "[DELETED]",
          documentBackUrl: null,
          selfieUrl: "[DELETED]",
        },
      });

      // Delete files after rejection too
      await deleteFiles();

      return NextResponse.json({
        success: true,
        message: "Verification rejected. Documents have been permanently deleted.",
      });
    }
  } catch (error) {
    console.error("Process verification error:", error);
    return NextResponse.json(
      { error: "Failed to process verification" },
      { status: 500 }
    );
  }
}
