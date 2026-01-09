import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";

// POST - Track a click on a PPV link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get visitor info
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const referrer = headersList.get("referer") || null;

    // Parse user agent
    const parser = new UAParser(userAgent);
    const device = parser.getDevice().type || "desktop";
    const browser = parser.getBrowser().name || null;
    const os = parser.getOS().name || null;

    // Get country from request (Vercel/Cloudflare headers)
    const country =
      headersList.get("x-vercel-ip-country") ||
      headersList.get("cf-ipcountry") ||
      null;

    // Get body data
    const body = await request.json().catch(() => ({}));
    const { visitorId } = body;

    if (!visitorId) {
      return NextResponse.json({ error: "Visitor ID required" }, { status: 400 });
    }

    // Find the PPV link
    const link = await prisma.pPVLink.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (!link.isActive) {
      return NextResponse.json({ error: "Link is inactive" }, { status: 410 });
    }

    // Get user session if logged in
    const session = await auth();
    const userId = session?.user?.id || null;

    // Check if this visitor already clicked (for unique count)
    const existingClick = await prisma.pPVLinkClick.findFirst({
      where: {
        ppvLinkId: id,
        visitorId,
      },
    });

    const isUnique = !existingClick;

    // Create click record
    await prisma.pPVLinkClick.create({
      data: {
        ppvLinkId: id,
        visitorId,
        userId,
        userAgent,
        device,
        browser,
        os,
        country,
        referrer,
      },
    });

    // Update link stats
    await prisma.pPVLink.update({
      where: { id },
      data: {
        totalClicks: { increment: 1 },
        uniqueClicks: isUnique ? { increment: 1 } : undefined,
      },
    });

    return NextResponse.json({ success: true, isUnique });
  } catch (error) {
    console.error("Error tracking PPV link click:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
