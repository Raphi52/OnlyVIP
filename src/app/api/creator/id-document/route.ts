import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Magic bytes for image validation
const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  "image/jpeg": [{ bytes: [0xFF, 0xD8, 0xFF] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  "image/webp": [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }],
};

const SAFE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function detectMimeType(buffer: Buffer): string | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const sig of signatures) {
      const offset = sig.offset || 0;
      if (buffer.length < offset + sig.bytes.length) continue;

      let matches = true;
      for (let i = 0; i < sig.bytes.length; i++) {
        if (buffer[offset + i] !== sig.bytes[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return mimeType;
    }
  }
  return null;
}

// POST /api/creator/id-document - Upload ID document
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creator for this user
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
      select: { slug: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Max 10MB for ID documents
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 10MB" }, { status: 400 });
    }

    // Read and validate file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const detectedMime = detectMimeType(buffer);

    if (!detectedMime) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload JPG, PNG, or WebP" },
        { status: 400 }
      );
    }

    const safeExt = SAFE_EXTENSIONS[detectedMime];
    if (!safeExt) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload JPG, PNG, or WebP" },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", "id-documents");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename: creatorSlug_timestamp_random.ext
    const hash = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const filename = `${creator.slug}_${timestamp}_${hash}.${safeExt}`;
    const filePath = join(uploadDir, filename);

    // Save file
    await writeFile(filePath, buffer);

    const url = `/uploads/id-documents/${filename}`;

    // Update creator with ID document
    await prisma.creator.update({
      where: { slug: creator.slug },
      data: {
        idDocument: url,
        idDocumentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      idDocument: url,
      idDocumentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error uploading ID document:", error);
    return NextResponse.json(
      { error: "Failed to upload ID document" },
      { status: 500 }
    );
  }
}

// DELETE /api/creator/id-document - Remove ID document
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creator for this user
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
      select: { slug: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Remove ID document reference (don't delete file for audit trail)
    await prisma.creator.update({
      where: { slug: creator.slug },
      data: {
        idDocument: null,
        idDocumentAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing ID document:", error);
    return NextResponse.json(
      { error: "Failed to remove ID document" },
      { status: 500 }
    );
  }
}
