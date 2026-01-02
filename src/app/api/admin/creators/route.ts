import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";

// Magic bytes for image validation
const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  "image/jpeg": [{ bytes: [0xFF, 0xD8, 0xFF] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  "image/webp": [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }],
  "image/gif": [{ bytes: [0x47, 0x49, 0x46, 0x38] }],
};

const SAFE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
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

// GET /api/admin/creators - Get creators (all for admin, own for creators)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = (session.user as any)?.role === "ADMIN";

    // Admin sees all creators, regular users only see their own
    const creators = await prisma.creator.findMany({
      where: isAdmin ? {} : { userId: session.user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Get actual counts from MediaContent and Subscription tables
    const creatorSlugs = creators.map((c) => c.slug);

    // Count media per creator
    const mediaCounts = await prisma.mediaContent.groupBy({
      by: ["creatorSlug", "type"],
      where: { creatorSlug: { in: creatorSlugs } },
      _count: { id: true },
    });

    // Count subscribers per creator
    const subscriberCounts = await prisma.subscription.groupBy({
      by: ["creatorSlug"],
      where: {
        creatorSlug: { in: creatorSlugs },
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      _count: { id: true },
    });

    // Build lookup maps
    const mediaCountMap: Record<string, { photos: number; videos: number }> = {};
    for (const count of mediaCounts) {
      if (!mediaCountMap[count.creatorSlug]) {
        mediaCountMap[count.creatorSlug] = { photos: 0, videos: 0 };
      }
      if (count.type === "PHOTO") {
        mediaCountMap[count.creatorSlug].photos = count._count.id;
      } else if (count.type === "VIDEO") {
        mediaCountMap[count.creatorSlug].videos = count._count.id;
      }
    }

    const subscriberCountMap: Record<string, number> = {};
    for (const count of subscriberCounts) {
      subscriberCountMap[count.creatorSlug] = count._count.id;
    }

    // Transform for frontend compatibility with real counts
    const transformedCreators = creators.map((creator) => ({
      ...creator,
      socialLinks: JSON.parse(creator.socialLinks || "{}"),
      theme: JSON.parse(creator.theme || "{}"),
      photoCount: mediaCountMap[creator.slug]?.photos || 0,
      videoCount: mediaCountMap[creator.slug]?.videos || 0,
      subscriberCount: subscriberCountMap[creator.slug] || 0,
      stats: {
        photos: mediaCountMap[creator.slug]?.photos || 0,
        videos: mediaCountMap[creator.slug]?.videos || 0,
        subscribers: subscriberCountMap[creator.slug] || 0,
      },
    }));

    return NextResponse.json({ creators: transformedCreators });
  } catch (error) {
    console.error("Error fetching creators:", error);
    return NextResponse.json(
      { error: "Failed to fetch creators" },
      { status: 500 }
    );
  }
}

// POST /api/admin/creators - Create new creator
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    let slug: string;
    let name: string;
    let displayName: string;
    let bio: string | null = null;
    let socialLinks: any = {};
    let avatarUrl: string | null = null;
    let coverImageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      name = formData.get("name") as string;
      displayName = formData.get("displayName") as string || name;
      slug = (formData.get("slug") as string) || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
      bio = formData.get("bio") as string | null;

      const instagram = formData.get("instagram") as string;
      const twitter = formData.get("twitter") as string;
      const tiktok = formData.get("tiktok") as string;

      if (instagram || twitter || tiktok) {
        socialLinks = { instagram, twitter, tiktok };
      }

      // Handle avatar upload with magic bytes validation
      const avatarFile = formData.get("avatar") as File | null;
      if (avatarFile && avatarFile.size > 0) {
        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const detectedMime = detectMimeType(buffer);
        const safeExt = detectedMime ? SAFE_EXTENSIONS[detectedMime] : null;

        if (safeExt) {
          const uploadDir = join(process.cwd(), "public", "uploads", "creators");
          await mkdir(uploadDir, { recursive: true });

          const hash = crypto.randomBytes(8).toString("hex");
          const filename = `${slug}_avatar_${hash}.${safeExt}`;
          await writeFile(join(uploadDir, filename), buffer);
          avatarUrl = `/uploads/creators/${filename}`;
        }
      }

      // Handle cover image upload with magic bytes validation
      const coverFile = formData.get("coverImage") as File | null;
      if (coverFile && coverFile.size > 0) {
        const bytes = await coverFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const detectedMime = detectMimeType(buffer);
        const safeExt = detectedMime ? SAFE_EXTENSIONS[detectedMime] : null;

        if (safeExt) {
          const uploadDir = join(process.cwd(), "public", "uploads", "creators");
          await mkdir(uploadDir, { recursive: true });

          const hash = crypto.randomBytes(8).toString("hex");
          const filename = `${slug}_cover_${hash}.${safeExt}`;
          await writeFile(join(uploadDir, filename), buffer);
          coverImageUrl = `/uploads/creators/${filename}`;
        }
      }
    } else {
      const body = await request.json();
      name = body.name;
      displayName = body.displayName || name;
      slug = body.slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
      bio = body.bio;
      socialLinks = body.socialLinks || {};
      avatarUrl = body.avatar;
      coverImageUrl = body.coverImage;
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await prisma.creator.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A creator with this slug already exists" },
        { status: 400 }
      );
    }

    const creator = await prisma.creator.create({
      data: {
        slug,
        name,
        displayName,
        bio,
        avatar: avatarUrl,
        coverImage: coverImageUrl,
        socialLinks: JSON.stringify(socialLinks),
        theme: JSON.stringify({}),
        userId: session.user.id, // Link creator to the current user
        isActive: true,
      },
    });

    // Also mark the user as a creator if not already
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isCreator: true },
    });

    return NextResponse.json({
      creator: {
        ...creator,
        socialLinks: JSON.parse(creator.socialLinks),
        theme: JSON.parse(creator.theme),
        stats: { photos: 0, videos: 0, subscribers: 0 },
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating creator:", error);
    return NextResponse.json(
      { error: "Failed to create creator" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/creators - Update creator
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = (session.user as any)?.role === "ADMIN";

    const contentType = request.headers.get("content-type") || "";
    let id: string;
    let updateData: any = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      id = formData.get("id") as string;

      const name = formData.get("name") as string;
      const displayName = formData.get("displayName") as string;
      const bio = formData.get("bio") as string;
      const instagram = formData.get("instagram") as string;
      const twitter = formData.get("twitter") as string;
      const tiktok = formData.get("tiktok") as string;
      const aiEnabled = formData.get("aiEnabled") as string;

      if (name) updateData.name = name;
      if (displayName) updateData.displayName = displayName;
      if (bio !== undefined) updateData.bio = bio || null;
      if (aiEnabled !== null) updateData.aiEnabled = aiEnabled === "true";

      if (instagram !== undefined || twitter !== undefined || tiktok !== undefined) {
        updateData.socialLinks = JSON.stringify({ instagram, twitter, tiktok });
      }

      // Get existing creator for slug
      const existing = await prisma.creator.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "Creator not found" }, { status: 404 });
      }

      // Handle avatar upload
      const avatarFile = formData.get("avatar") as File | null;
      if (avatarFile && avatarFile.size > 0) {
        const uploadDir = join(process.cwd(), "public", "uploads", "creators");
        await mkdir(uploadDir, { recursive: true });

        const ext = avatarFile.name.split(".").pop() || "jpg";
        const hash = crypto.randomBytes(8).toString("hex");
        const filename = `${existing.slug}_avatar_${hash}.${ext}`;

        const bytes = await avatarFile.arrayBuffer();
        await writeFile(join(uploadDir, filename), Buffer.from(bytes));
        updateData.avatar = `/uploads/creators/${filename}`;
      }

      // Handle cover image upload
      const coverFile = formData.get("coverImage") as File | null;
      if (coverFile && coverFile.size > 0) {
        const uploadDir = join(process.cwd(), "public", "uploads", "creators");
        await mkdir(uploadDir, { recursive: true });

        const ext = coverFile.name.split(".").pop() || "jpg";
        const hash = crypto.randomBytes(8).toString("hex");
        const filename = `${existing.slug}_cover_${hash}.${ext}`;

        const bytes = await coverFile.arrayBuffer();
        await writeFile(join(uploadDir, filename), Buffer.from(bytes));
        updateData.coverImage = `/uploads/creators/${filename}`;
      }
    } else {
      const body = await request.json();
      id = body.id;

      if (body.name) updateData.name = body.name;
      if (body.displayName) updateData.displayName = body.displayName;
      if (body.bio !== undefined) updateData.bio = body.bio;
      if (body.avatar) updateData.avatar = body.avatar;
      if (body.coverImage) updateData.coverImage = body.coverImage;
      if (body.socialLinks) updateData.socialLinks = JSON.stringify(body.socialLinks);
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    }

    if (!id) {
      return NextResponse.json({ error: "Creator ID is required" }, { status: 400 });
    }

    // Verify ownership - only allow updating creators the user owns
    const existingCreator = await prisma.creator.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingCreator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Admin can update any creator, regular users can only update their own
    if (!isAdmin && existingCreator.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only update your own creators" }, { status: 403 });
    }

    const creator = await prisma.creator.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      creator: {
        ...creator,
        socialLinks: JSON.parse(creator.socialLinks),
        theme: JSON.parse(creator.theme),
        stats: {
          photos: creator.photoCount,
          videos: creator.videoCount,
          subscribers: creator.subscriberCount,
        },
      },
    });
  } catch (error) {
    console.error("Error updating creator:", error);
    return NextResponse.json(
      { error: "Failed to update creator" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/creators - Delete creator
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = (session.user as any)?.role === "ADMIN";
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const deleteMedia = searchParams.get("deleteMedia") === "true";

    if (!id && !slug) {
      return NextResponse.json(
        { error: "Creator ID or slug is required" },
        { status: 400 }
      );
    }

    // Find the creator
    const creator = await prisma.creator.findFirst({
      where: id ? { id } : { slug: slug! },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Admin can delete any creator, regular users can only delete their own
    if (!isAdmin && creator.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only delete your own creators" }, { status: 403 });
    }

    // Count associated data
    const [mediaCount, conversationCount, paymentCount, subscriptionCount] = await Promise.all([
      prisma.mediaContent.count({ where: { creatorSlug: creator.slug } }),
      prisma.conversation.count({ where: { creatorSlug: creator.slug } }),
      prisma.payment.count({ where: { creatorSlug: creator.slug } }),
      prisma.subscription.count({ where: { creatorSlug: creator.slug } }),
    ]);

    if (deleteMedia) {
      // Delete all associated data
      await prisma.$transaction([
        // Delete media
        prisma.mediaContent.deleteMany({ where: { creatorSlug: creator.slug } }),
        // Delete conversations and messages
        prisma.conversation.deleteMany({ where: { creatorSlug: creator.slug } }),
        // Delete payments
        prisma.payment.deleteMany({ where: { creatorSlug: creator.slug } }),
        // Delete subscriptions
        prisma.subscription.deleteMany({ where: { creatorSlug: creator.slug } }),
        // Delete creator
        prisma.creator.delete({ where: { id: creator.id } }),
      ]);
    } else {
      // Just delete the creator, keep the data
      await prisma.creator.delete({ where: { id: creator.id } });
    }

    return NextResponse.json({
      success: true,
      deleted: {
        creator: creator.slug,
        mediaDeleted: deleteMedia ? mediaCount : 0,
        conversationsDeleted: deleteMedia ? conversationCount : 0,
        paymentsDeleted: deleteMedia ? paymentCount : 0,
        subscriptionsDeleted: deleteMedia ? subscriptionCount : 0,
      },
    });
  } catch (error) {
    console.error("Error deleting creator:", error);
    return NextResponse.json(
      { error: "Failed to delete creator" },
      { status: 500 }
    );
  }
}
