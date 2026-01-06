import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { spawn } from "child_process";
import { auth } from "@/lib/auth";
import { notifyFollowersOfNewContent } from "@/lib/email";

// Get ffmpeg/ffprobe paths - use system binaries in Docker
function getFfmpegPath(): string {
  return "ffmpeg";
}

function getFfprobePath(): string {
  return "ffprobe";
}

// Generate video thumbnail using ffmpeg
async function generateVideoThumbnail(
  videoPath: string,
  thumbnailPath: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpegPath = getFfmpegPath();
    console.log("Using ffmpeg at:", ffmpegPath);

    const args = [
      "-i", videoPath,
      "-ss", "00:00:01",
      "-vframes", "1",
      "-vf", "scale=640:-1",
      "-y",
      thumbnailPath,
    ];

    const proc = spawn(ffmpegPath, args);

    proc.stderr.on("data", (data) => {
      console.log("ffmpeg:", data.toString());
    });

    proc.on("close", (code) => {
      console.log("ffmpeg exited with code:", code);
      resolve(code === 0);
    });

    proc.on("error", (err) => {
      console.error("Thumbnail generation error:", err);
      resolve(false);
    });
  });
}

// Get video duration in seconds using ffprobe
async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve) => {
    const ffprobePath = getFfprobePath();
    console.log("Using ffprobe at:", ffprobePath);

    const args = [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ];

    const proc = spawn(ffprobePath, args);
    let output = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.on("close", () => {
      const duration = parseFloat(output.trim());
      console.log("Video duration:", duration);
      resolve(isNaN(duration) ? 0 : Math.round(duration));
    });

    proc.on("error", (err) => {
      console.error("ffprobe error:", err);
      resolve(0);
    });
  });
}

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  return !!token?.value;
}

async function isCreator(): Promise<{ isCreator: boolean; userId?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { isCreator: false };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isCreator: true },
  });
  return { isCreator: user?.isCreator === true, userId: session.user.id };
}

// GET /api/media - Get all media
export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();
    const creator = await isCreator();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const tier = searchParams.get("tier");
    const search = searchParams.get("search");
    const creatorSlug = searchParams.get("creator");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Tag filters
    const tagGallery = searchParams.get("tagGallery");
    const tagPPV = searchParams.get("tagPPV");
    const tagAI = searchParams.get("tagAI");
    const tagFree = searchParams.get("tagFree");
    const tagVIP = searchParams.get("tagVIP");

    const where: any = {};

    // Filter by creator
    if (creatorSlug) {
      where.creatorSlug = creatorSlug;
    }

    if (type && type !== "all") {
      where.type = type;
    }

    if (tier && tier !== "all") {
      where.accessTier = tier;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Tag filters
    if (tagGallery === "true") {
      where.tagGallery = true;
    } else if (tagGallery === "false") {
      where.tagGallery = false;
    }

    if (tagPPV === "true") {
      where.tagPPV = true;
    } else if (tagPPV === "false") {
      where.tagPPV = false;
    }

    if (tagAI === "true") {
      where.tagAI = true;
    } else if (tagAI === "false") {
      where.tagAI = false;
    }

    if (tagFree === "true") {
      where.tagFree = true;
    } else if (tagFree === "false") {
      where.tagFree = false;
    }

    if (tagVIP === "true") {
      where.tagVIP = true;
    } else if (tagVIP === "false") {
      where.tagVIP = false;
    }

    // Get current user session for access control
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Get user's subscription tier and purchases if logged in
    let userTier = "FREE";
    let purchasedMediaIds: Set<string> = new Set();

    if (currentUserId) {
      const [subscription, purchases] = await Promise.all([
        prisma.subscription.findFirst({
          where: { userId: currentUserId, status: "ACTIVE" },
          include: { plan: { select: { accessTier: true } } },
        }),
        prisma.mediaPurchase.findMany({
          where: { userId: currentUserId },
          select: { mediaId: true },
        }),
      ]);
      userTier = subscription?.plan?.accessTier || "FREE";
      purchasedMediaIds = new Set(purchases.map(p => p.mediaId));
    }

    const tierOrder = ["FREE", "BASIC", "VIP"];
    const userTierIndex = tierOrder.indexOf(userTier);
    const isVIP = userTier === "VIP";

    const [mediaRaw, total, photosCount, videosCount] = await Promise.all([
      prisma.mediaContent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
        },
      }),
      prisma.mediaContent.count({ where }),
      prisma.mediaContent.count({ where: { ...where, type: "PHOTO" } }),
      prisma.mediaContent.count({ where: { ...where, type: "VIDEO" } }),
    ]);

    // Filter contentUrl AND thumbnailUrl based on access - NEVER expose real URLs for locked content
    // Security: For photos, thumbnailUrl = contentUrl so we MUST hide both
    const LOCKED_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23d4af37'/%3E%3Cstop offset='50%25' style='stop-color:%23b8860b'/%3E%3Cstop offset='100%25' style='stop-color:%23996515'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='400' height='400'/%3E%3C/svg%3E";

    const media = mediaRaw.map(item => {
      const isPurchased = purchasedMediaIds.has(item.id);
      const isFree = item.tagFree === true;
      const isPPV = item.tagPPV === true;
      const isVIPOnly = item.tagVIP === true;
      const mediaTierIndex = tierOrder.indexOf(item.accessTier);

      // Determine if user has access
      let hasAccess = false;
      if (isFree) hasAccess = true;
      else if (isPurchased) hasAccess = true;
      else if (isVIPOnly && isVIP) hasAccess = true;
      else if (!isPPV && !isVIPOnly && userTierIndex >= mediaTierIndex) hasAccess = true;

      // For photos, thumbnail IS the content - must hide both for locked content
      // For videos, thumbnail is a separate generated frame - still need to protect for PPV
      const isPhoto = item.type === "PHOTO";
      const shouldHideThumbnail = !hasAccess && (isPhoto || isPPV || isVIPOnly);

      // Only return real URLs if user has access
      return {
        ...item,
        contentUrl: hasAccess ? item.contentUrl : null,
        thumbnailUrl: shouldHideThumbnail ? LOCKED_PLACEHOLDER : item.thumbnailUrl,
        previewUrl: shouldHideThumbnail ? LOCKED_PLACEHOLDER : item.previewUrl,
        hasAccess,
        hasPurchased: isPurchased,
      };
    });

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        photos: photosCount,
        videos: videosCount,
      },
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// POST /api/media - Create new media with file upload
export async function POST(request: NextRequest) {
  try {
    console.log("[Media POST] Starting upload...");
    const admin = await isAdmin();
    const creator = await isCreator();

    console.log("[Media POST] Auth check - admin:", admin, "creator:", creator);

    // Allow both admins and creators to upload
    if (!admin && !creator.isCreator) {
      console.log("[Media POST] Unauthorized - no admin or creator rights");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    console.log("[Media POST] Content-Type:", contentType);

    // Handle FormData upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      console.log("[Media POST] FormData parsed");

      const title = formData.get("title") as string;
      const description = formData.get("description") as string | null;
      const type = formData.get("type") as string || "PHOTO";
      const accessTier = formData.get("accessTier") as string || "FREE";
      const isPurchaseable = formData.get("isPurchaseable") === "true";
      const price = formData.get("price") as string | null;
      const creatorSlug = formData.get("creatorSlug") as string || "miacosta";
      const files = formData.getAll("files") as File[];

      // New tag fields
      const tagGallery = formData.get("tagGallery") === "true";
      const tagPPV = formData.get("tagPPV") === "true";
      const tagAI = formData.get("tagAI") === "true";
      const tagFree = formData.get("tagFree") === "true";
      const tagVIP = formData.get("tagVIP") === "true";
      const ppvPriceCreditsStr = formData.get("ppvPriceCredits") as string | null;
      const ppvPriceCredits = ppvPriceCreditsStr ? parseInt(ppvPriceCreditsStr) : null;

      console.log("[Media POST] Form data:", { title, type, accessTier, creatorSlug, filesCount: files.length, tagGallery, tagPPV, tagFree, tagVIP });

      if (!title) {
        console.log("[Media POST] Error: No title");
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }

      if (!files || files.length === 0) {
        console.log("[Media POST] Error: No files");
        return NextResponse.json({ error: "No files provided" }, { status: 400 });
      }

      // Create upload directory
      const uploadDir = join(process.cwd(), "public", "uploads", "media");
      console.log("[Media POST] Upload dir:", uploadDir);
      await mkdir(uploadDir, { recursive: true });

      // Process first file (main content)
      const file = files[0];
      console.log("[Media POST] Processing file:", file.name, "size:", file.size, "type:", file.type);

      const ext = file.name.split(".").pop() || "jpg";
      const hash = crypto.randomBytes(16).toString("hex");
      const filename = `${hash}.${ext}`;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = join(uploadDir, filename);

      console.log("[Media POST] Writing file to:", filePath);
      await writeFile(filePath, buffer);
      console.log("[Media POST] File written successfully");

      const contentUrl = `/uploads/media/${filename}`;
      let thumbnailUrl = contentUrl;
      let duration: number | null = null;

      // Generate thumbnail for videos
      if (type === "VIDEO") {
        const thumbFilename = `${hash}_thumb.jpg`;
        const thumbPath = join(uploadDir, thumbFilename);

        // Get video duration
        duration = await getVideoDuration(filePath);

        // Generate thumbnail at 1 second mark
        const success = await generateVideoThumbnail(filePath, thumbPath);
        if (success) {
          thumbnailUrl = `/uploads/media/${thumbFilename}`;
        }
      }

      // Generate slug from title
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const uniqueSlug = `${baseSlug}-${crypto.randomBytes(4).toString("hex")}`;

      console.log("[Media POST] Creating DB entry with slug:", uniqueSlug);

      // Create media entry
      const media = await prisma.mediaContent.create({
        data: {
          title,
          slug: uniqueSlug,
          description: description || null,
          type: type as any,
          accessTier: accessTier as any,
          isPurchaseable,
          price: isPurchaseable && price ? parseFloat(price) : null,
          thumbnailUrl,
          previewUrl: thumbnailUrl,
          contentUrl,
          fileSize: file.size,
          mimeType: file.type,
          duration,
          creatorSlug,
          // New tag fields
          tagGallery,
          tagPPV,
          tagAI,
          tagFree,
          tagVIP,
          ppvPriceCredits: tagPPV ? ppvPriceCredits : null,
        },
      });

      console.log("[Media POST] Media created:", media.id);

      // Send notification emails to followers for new content with tagGallery
      if (tagGallery && creatorSlug) {
        // Run in background, don't block the response
        notifyFollowersOfNewContent(
          creatorSlug,
          {
            title,
            type,
            thumbnailUrl,
            accessTier,
          },
          prisma
        ).catch((err) => console.error("[Media] Failed to send notifications:", err));
      }

      return NextResponse.json({ media }, { status: 201 });
    }

    // Handle JSON body (for updates without file)
    const body = await request.json();
    const {
      title,
      description,
      type,
      accessTier,
      thumbnailUrl,
      previewUrl,
      contentUrl,
      isPurchaseable,
      price,
      // Tag fields
      tagGallery,
      tagPPV,
      tagAI,
      tagFree,
      tagVIP,
      ppvPriceCredits,
      creatorSlug,
    } = body;

    if (!title || !type || !contentUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const uniqueSlug = `${baseSlug}-${crypto.randomBytes(4).toString("hex")}`;

    const media = await prisma.mediaContent.create({
      data: {
        title,
        slug: uniqueSlug,
        description,
        type,
        accessTier: accessTier || "FREE",
        thumbnailUrl,
        previewUrl,
        contentUrl,
        isPurchaseable: isPurchaseable || false,
        price: isPurchaseable ? price : null,
        creatorSlug: creatorSlug || "miacosta",
        // Tag fields
        tagGallery: tagGallery || false,
        tagPPV: tagPPV || false,
        tagAI: tagAI || false,
        tagFree: tagFree || false,
        tagVIP: tagVIP || false,
        ppvPriceCredits: tagPPV ? ppvPriceCredits : null,
      },
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error: any) {
    console.error("[Media POST] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create media" },
      { status: 500 }
    );
  }
}

// DELETE /api/media - Delete media
export async function DELETE(request: NextRequest) {
  try {
    const admin = await isAdmin();
    const creator = await isCreator();

    if (!admin && !creator.isCreator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 });
    }

    await prisma.mediaContent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete media error:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}

// PATCH /api/media - Update media
export async function PATCH(request: NextRequest) {
  try {
    const admin = await isAdmin();
    const creator = await isCreator();

    if (!admin && !creator.isCreator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 });
    }

    const media = await prisma.mediaContent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ media });
  } catch (error) {
    console.error("Update media error:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}
