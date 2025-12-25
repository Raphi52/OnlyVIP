import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

// In production, use S3, Cloudinary, or another cloud storage
// This is a simple local file upload for development

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  return !!token?.value;
}

export async function POST(request: NextRequest) {
  try {
    // Check admin auth (for now, only admin can upload)
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    // Support both single file and multiple files
    const singleFile = formData.get("file") as File | null;
    const multipleFiles = formData.getAll("files") as File[];
    const type = formData.get("type") as string | null; // media, chat, avatar

    const filesToUpload = singleFile ? [singleFile] : multipleFiles;

    if (!filesToUpload || filesToUpload.length === 0) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes: Record<string, string[]> = {
      media: ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "audio/mpeg", "audio/wav"],
      chat: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"],
      avatar: ["image/jpeg", "image/png", "image/webp"],
    };

    const uploadType = type || "chat";
    const allowed = allowedTypes[uploadType] || allowedTypes.chat;

    // Validate file size (50MB max for media, 10MB for chat, 5MB for avatar)
    const maxSizes: Record<string, number> = {
      media: 50 * 1024 * 1024,
      chat: 10 * 1024 * 1024,
      avatar: 5 * 1024 * 1024,
    };

    const maxSize = maxSizes[uploadType] || maxSizes.chat;

    // Process all files
    const uploadedFiles = [];
    const { mkdir } = await import("fs/promises");
    const uploadDir = join(process.cwd(), "public", "uploads", uploadType);
    await mkdir(uploadDir, { recursive: true });

    for (const file of filesToUpload) {
      if (!allowed.includes(file.type)) {
        continue; // Skip invalid file types
      }

      if (file.size > maxSize) {
        continue; // Skip files that are too large
      }

      // Generate unique filename
      const ext = file.name.split(".").pop();
      const hash = crypto.randomBytes(16).toString("hex");
      const filename = `${hash}.${ext}`;

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = join(uploadDir, filename);
      await writeFile(filePath, buffer);

      const url = `/uploads/${uploadType}/${filename}`;

      // Determine media type for database
      let mediaType: "PHOTO" | "VIDEO" | "AUDIO" = "PHOTO";
      if (file.type.startsWith("video/")) {
        mediaType = "VIDEO";
      } else if (file.type.startsWith("audio/")) {
        mediaType = "AUDIO";
      }

      uploadedFiles.push({
        url,
        thumbnailUrl: url,
        previewUrl: url,
        filename,
        mimeType: file.type,
        size: file.size,
        type: mediaType,
      });
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: "No valid files uploaded" },
        { status: 400 }
      );
    }

    // Return single file format for backward compatibility, or array for multiple
    if (singleFile) {
      return NextResponse.json(uploadedFiles[0]);
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
