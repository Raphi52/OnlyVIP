import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

// POST /api/creator/apply - Submit application to become a creator
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is already a creator
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isCreator: true },
    });

    if (user?.isCreator) {
      return NextResponse.json(
        { error: "You are already a creator" },
        { status: 400 }
      );
    }

    // Check for existing pending application
    const existingApplication = await prisma.creatorApplication.findFirst({
      where: {
        userId,
        status: "PENDING",
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You already have a pending application" },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string | null;
    const documentType = (formData.get("documentType") as string) || "ID_CARD";
    const documentFile = formData.get("document") as File;

    if (!displayName || !documentFile) {
      return NextResponse.json(
        { error: "Display name and identity document are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(documentFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPG, PNG, WebP, or PDF file" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (documentFile.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Save the document file
    const uploadDir = path.join(process.cwd(), "public", "uploads", "applications");
    await mkdir(uploadDir, { recursive: true });

    const fileExt = documentFile.name.split(".").pop() || "jpg";
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await documentFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const documentUrl = `/uploads/applications/${fileName}`;

    // Check if auto-accept is enabled
    const siteSettings = await prisma.siteSettings.findFirst({
      where: { creatorSlug: null },
      select: { autoAcceptCreators: true },
    });

    const autoAccept = siteSettings?.autoAcceptCreators === true;

    if (autoAccept) {
      // Auto-approve: Create creator profile directly
      let baseSlug = generateSlug(displayName);
      let slug = baseSlug;
      let counter = 1;

      // Check for slug conflicts
      while (await prisma.creator.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create everything in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the application as approved
        const application = await tx.creatorApplication.create({
          data: {
            userId,
            displayName,
            bio: bio || null,
            documentUrl,
            documentType,
            status: "APPROVED",
            reviewedAt: new Date(),
          },
        });

        // Create the creator profile
        const creator = await tx.creator.create({
          data: {
            slug,
            name: displayName,
            displayName,
            bio: bio || null,
            userId,
            isActive: true,
          },
        });

        // Update user to be a creator
        await tx.user.update({
          where: { id: userId },
          data: { isCreator: true },
        });

        // Update application with creator ID
        await tx.creatorApplication.update({
          where: { id: application.id },
          data: { createdCreatorId: creator.id },
        });

        return { application, creator };
      });

      return NextResponse.json({
        success: true,
        applicationId: result.application.id,
        autoApproved: true,
        creatorSlug: result.creator.slug,
        message: "Your creator profile has been created! You can now start posting content.",
      });
    }

    // Normal flow: Create pending application
    const application = await prisma.creatorApplication.create({
      data: {
        userId,
        displayName,
        bio: bio || null,
        documentUrl,
        documentType,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: "Your application has been submitted. We will review it shortly.",
    });
  } catch (error) {
    console.error("Error submitting creator application:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

// GET /api/creator/apply - Get current user's application status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's applications
    const applications = await prisma.creatorApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        displayName: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        reviewedAt: true,
      },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching application status:", error);
    return NextResponse.json(
      { error: "Failed to fetch application status" },
      { status: 500 }
    );
  }
}
