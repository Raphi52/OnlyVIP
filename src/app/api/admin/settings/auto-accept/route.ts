import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch auto-accept setting
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create site settings
    let settings = await prisma.siteSettings.findFirst({
      where: { creatorSlug: null },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { creatorSlug: null },
      });
    }

    return NextResponse.json({
      autoAcceptCreators: settings.autoAcceptCreators || false,
    });
  } catch (error) {
    console.error("Error fetching auto-accept setting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update auto-accept setting
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { autoAcceptCreators } = await req.json();

    // Get or create site settings
    let settings = await prisma.siteSettings.findFirst({
      where: { creatorSlug: null },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          creatorSlug: null,
          autoAcceptCreators: autoAcceptCreators === true,
        },
      });
    } else {
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: { autoAcceptCreators: autoAcceptCreators === true },
      });
    }

    return NextResponse.json({
      autoAcceptCreators: settings.autoAcceptCreators,
    });
  } catch (error) {
    console.error("Error updating auto-accept setting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
