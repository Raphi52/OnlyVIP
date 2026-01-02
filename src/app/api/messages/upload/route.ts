import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

// Magic bytes signatures for file type validation
const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  "image/jpeg": [{ bytes: [0xFF, 0xD8, 0xFF] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  "image/webp": [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }],
  "image/gif": [{ bytes: [0x47, 0x49, 0x46, 0x38] }],
  "video/mp4": [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
  "video/webm": [{ bytes: [0x1A, 0x45, 0xDF, 0xA3] }],
  "audio/mpeg": [{ bytes: [0xFF, 0xFB] }, { bytes: [0xFF, 0xFA] }, { bytes: [0x49, 0x44, 0x33] }],
  "audio/wav": [{ bytes: [0x52, 0x49, 0x46, 0x46] }],
};

// Safe extensions for each MIME type
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

// POST /api/messages/upload - Upload media for chat messages
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Detect actual MIME type from magic bytes
    const detectedMime = detectMimeType(buffer);
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "audio/mpeg", "audio/wav"];

    if (!detectedMime || !allowedTypes.includes(detectedMime)) {
      console.warn(`Upload rejected: detected=${detectedMime}, claimed=${file.type}, name=${file.name}`);
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    // Get safe extension based on detected type
    const safeExt = SAFE_EXTENSIONS[detectedMime];
    if (!safeExt) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", "chat");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename with safe extension
    const hash = crypto.randomBytes(16).toString("hex");
    const filename = `${hash}.${safeExt}`;

    // Save file
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/chat/${filename}`;
    const mediaType = detectedMime.startsWith("video") ? "VIDEO" :
                      detectedMime.startsWith("audio") ? "AUDIO" : "PHOTO";

    return NextResponse.json({
      url,
      previewUrl: mediaType === "VIDEO" ? null : url,
      thumbnailUrl: url,
      type: mediaType,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
