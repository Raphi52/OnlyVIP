import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

// GET - Serve verification image (admin only)
export async function GET(request: NextRequest) {
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

    // Get file path from query
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "File path required" }, { status: 400 });
    }

    // Security: ensure path is within verification directory
    if (!filePath.startsWith("private/verification/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Prevent path traversal attacks
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const fullPath = path.join(process.cwd(), normalizedPath);

    try {
      const fileBuffer = await readFile(fullPath);

      // Determine content type
      const ext = path.extname(fullPath).toLowerCase();
      const contentTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
      };

      const contentType = contentTypes[ext] || "application/octet-stream";

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Serve verification image error:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
