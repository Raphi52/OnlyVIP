import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/chatter/scripts - Get scripts from agency
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const agencyId = (session.user as any).agencyId;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID not found" }, { status: 400 });
    }

    // Verify chatter is active
    const chatter = await prisma.chatter.findUnique({
      where: { id: chatterId },
      select: {
        isActive: true,
        assignedCreators: {
          select: { creatorSlug: true },
        },
      },
    });

    if (!chatter || !chatter.isActive) {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 });
    }

    const assignedSlugs = chatter.assignedCreators.map((a) => a.creatorSlug);

    // Build query
    const whereClause: any = {
      agencyId,
      isActive: true,
      OR: [
        { creatorSlug: null }, // Agency-wide scripts
        { creatorSlug: { in: assignedSlugs } }, // Creator-specific scripts
      ],
    };

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (search) {
      whereClause.AND = [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Get scripts
    const scripts = await prisma.script.findMany({
      where: whereClause,
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        content: true,
        category: true,
        creatorSlug: true,
        usageCount: true,
        salesGenerated: true,
        conversionRate: true,
      },
    });

    // Group by category
    const categories = ["GREETING", "PPV_PITCH", "FOLLOW_UP", "CLOSING", "CUSTOM"];
    const byCategory = categories.reduce(
      (acc, cat) => {
        acc[cat] = scripts.filter((s) => s.category === cat);
        return acc;
      },
      {} as Record<string, typeof scripts>
    );

    return NextResponse.json({
      scripts,
      byCategory,
      categories: categories.map((cat) => ({
        value: cat,
        label: cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        count: byCategory[cat]?.length || 0,
      })),
      total: scripts.length,
    });
  } catch (error) {
    console.error("Error fetching chatter scripts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}

// POST /api/chatter/scripts/:id/use - Track script usage
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scriptId } = await request.json();

    if (!scriptId) {
      return NextResponse.json({ error: "Script ID required" }, { status: 400 });
    }

    // Increment usage count
    await prisma.script.update({
      where: { id: scriptId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking script usage:", error);
    return NextResponse.json(
      { error: "Failed to track usage" },
      { status: 500 }
    );
  }
}
