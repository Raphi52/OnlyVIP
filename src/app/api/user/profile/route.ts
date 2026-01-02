import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

// Magic bytes for avatar validation
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
        if (buffer[offset + i] !== sig.bytes[i]) { matches = false; break; }
      }
      if (matches) return mimeType;
    }
  }
  return null;
}

// GET /api/user/profile - Get current user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    // Handle form data (with file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      const name = formData.get("name") as string | null;

      const updateData: { name?: string; image?: string } = {};

      if (name) {
        updateData.name = name;
      }

      if (file) {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "File too large. Maximum size is 5MB." },
            { status: 400 }
          );
        }

        // Read file and detect actual type from magic bytes
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const detectedMime = detectMimeType(buffer);

        if (!detectedMime) {
          return NextResponse.json(
            { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
            { status: 400 }
          );
        }

        // Get safe extension based on detected type
        const safeExt = SAFE_EXTENSIONS[detectedMime];
        if (!safeExt) {
          return NextResponse.json(
            { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
            { status: 400 }
          );
        }

        // Generate unique filename with safe extension
        const hash = crypto.randomBytes(16).toString("hex");
        const filename = `${hash}.${safeExt}`;

        // Save file
        const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
        await mkdir(uploadDir, { recursive: true });
        const filePath = join(uploadDir, filename);
        await writeFile(filePath, buffer);

        updateData.image = `/uploads/avatars/${filename}`;
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: "No data to update" },
          { status: 400 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      });

      return NextResponse.json(updatedUser);
    }

    // Handle JSON data
    const body = await request.json();
    const { name, image } = body;

    const updateData: { name?: string; image?: string } = {};
    if (name) updateData.name = name;
    if (image) updateData.image = image;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No data to update" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
