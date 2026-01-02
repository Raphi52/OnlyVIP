import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// GET - Get current verification status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's creator profile
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    // Get verification status
    const verification = await prisma.creatorVerification.findUnique({
      where: { creatorId: creator.id },
    });

    if (!verification) {
      return NextResponse.json({ status: "NONE" });
    }

    return NextResponse.json({
      status: verification.status,
      rejectionReason: verification.rejectionReason,
      verifiedAt: verification.verifiedAt,
      expiresAt: verification.expiresAt,
    });
  } catch (error) {
    console.error("Get verification status error:", error);
    return NextResponse.json(
      { error: "Failed to get verification status" },
      { status: 500 }
    );
  }
}

// POST - Submit verification documents
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's creator profile
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    // Check if already verified
    const existingVerification = await prisma.creatorVerification.findUnique({
      where: { creatorId: creator.id },
    });

    if (existingVerification?.status === "APPROVED") {
      return NextResponse.json(
        { error: "Already verified" },
        { status: 400 }
      );
    }

    if (existingVerification?.status === "PENDING") {
      return NextResponse.json(
        { error: "Verification already pending" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const documentType = formData.get("documentType") as string;
    const documentFront = formData.get("documentFront") as File;
    const documentBack = formData.get("documentBack") as File | null;
    const selfie = formData.get("selfie") as File;
    const fullName = formData.get("fullName") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;

    // Validate required fields
    if (!documentType || !documentFront || !selfie || !fullName || !dateOfBirth) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate age (must be 18+)
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (age < 18) {
      return NextResponse.json(
        { error: "You must be at least 18 years old" },
        { status: 400 }
      );
    }

    // Create verification directory
    const verificationDir = path.join(process.cwd(), "public", "uploads", "verification", creator.id);
    await mkdir(verificationDir, { recursive: true });

    // Save files with secure random names
    const saveFile = async (file: File, prefix: string): Promise<string> => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${prefix}-${crypto.randomBytes(16).toString("hex")}.${ext}`;
      const filepath = path.join(verificationDir, filename);
      await writeFile(filepath, buffer);
      return `/uploads/verification/${creator.id}/${filename}`;
    };

    const documentFrontUrl = await saveFile(documentFront, "front");
    const documentBackUrl = documentBack ? await saveFile(documentBack, "back") : null;
    const selfieUrl = await saveFile(selfie, "selfie");

    // Create or update verification record
    const verification = await prisma.creatorVerification.upsert({
      where: { creatorId: creator.id },
      create: {
        creatorId: creator.id,
        creatorSlug: creator.slug,
        documentType,
        documentFrontUrl,
        documentBackUrl,
        selfieUrl,
        fullName,
        dateOfBirth: dob,
        status: "PENDING",
      },
      update: {
        documentType,
        documentFrontUrl,
        documentBackUrl,
        selfieUrl,
        fullName,
        dateOfBirth: dob,
        status: "PENDING",
        rejectionReason: null,
      },
    });

    // TODO: Send notification to admin about new verification request
    // TODO: Optionally integrate with verification service like Jumio or Veriff

    return NextResponse.json({
      success: true,
      message: "Verification submitted successfully",
      status: "PENDING",
    });
  } catch (error) {
    console.error("Submit verification error:", error);
    return NextResponse.json(
      { error: "Failed to submit verification" },
      { status: 500 }
    );
  }
}
