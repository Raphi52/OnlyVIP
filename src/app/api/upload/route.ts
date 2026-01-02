import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import { auth } from "@/lib/auth";

// In production, use S3, Cloudinary, or another cloud storage
// This is a simple local file upload for development

// Magic bytes signatures for file type validation
const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  "image/jpeg": [{ bytes: [0xFF, 0xD8, 0xFF] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  "image/webp": [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }],
  "image/gif": [{ bytes: [0x47, 0x49, 0x46, 0x38] }],
  "video/mp4": [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }], // ftyp at offset 4
  "video/webm": [{ bytes: [0x1A, 0x45, 0xDF, 0xA3] }],
  "audio/mpeg": [{ bytes: [0xFF, 0xFB] }, { bytes: [0xFF, 0xFA] }, { bytes: [0x49, 0x44, 0x33] }], // MP3 or ID3
  "audio/wav": [{ bytes: [0x52, 0x49, 0x46, 0x46] }], // RIFF
};

// Safe extensions for each MIME type (we force these, ignore client extension)
const SAFE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

// Validate file content by checking magic bytes
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

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
    if (matches) return true;
  }
  return false;
}

// Detect actual MIME type from buffer
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

async function canUpload(): Promise<boolean> {
  // Check admin token (old admin panel)
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_token");
  if (adminToken?.value) return true;

  // Check NextAuth session (creators, admins, and agency owners)
  const session = await auth();
  if (session?.user) {
    // Allow if user is admin, creator, or agency owner
    const user = session.user as { role?: string; isCreator?: boolean; isAgencyOwner?: boolean };
    if (user.role === "ADMIN" || user.isCreator || user.isAgencyOwner) {
      return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Check auth (admin token or NextAuth session)
    const authorized = await canUpload();

    if (!authorized) {
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
      if (file.size > maxSize) {
        continue; // Skip files that are too large
      }

      // Read file content first
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Detect actual MIME type from file content (magic bytes)
      const detectedMime = detectMimeType(buffer);

      // Reject if we can't detect the type or it's not in allowed list
      if (!detectedMime || !allowed.includes(detectedMime)) {
        console.warn(`Upload rejected: detected=${detectedMime}, claimed=${file.type}, name=${file.name}`);
        continue;
      }

      // Force safe extension based on detected type (ignore client extension)
      const safeExt = SAFE_EXTENSIONS[detectedMime];
      if (!safeExt) {
        continue; // Unknown type, skip
      }

      // Generate unique filename with safe extension
      const hash = crypto.randomBytes(16).toString("hex");
      const filename = `${hash}.${safeExt}`;

      // Save file
      const filePath = join(uploadDir, filename);
      await writeFile(filePath, buffer);

      const url = `/uploads/${uploadType}/${filename}`;

      // Determine media type for database (use detected MIME, not client-provided)
      let mediaType: "PHOTO" | "VIDEO" | "AUDIO" = "PHOTO";
      if (detectedMime.startsWith("video/")) {
        mediaType = "VIDEO";
      } else if (detectedMime.startsWith("audio/")) {
        mediaType = "AUDIO";
      }

      uploadedFiles.push({
        url,
        thumbnailUrl: url,
        previewUrl: url,
        filename,
        mimeType: detectedMime, // Use detected type, not client-provided
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
