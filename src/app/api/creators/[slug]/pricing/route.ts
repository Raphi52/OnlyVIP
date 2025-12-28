import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/creators/[slug]/pricing - Get creator's custom pricing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get creator's site settings
    const settings = await prisma.siteSettings.findUnique({
      where: { creatorSlug: slug },
    });

    if (!settings) {
      return NextResponse.json({ plans: [] });
    }

    // Parse pricing from JSON
    let pricing: any = {};
    try {
      pricing = JSON.parse(settings.pricing || "{}");
    } catch (e) {
      pricing = {};
    }

    // Return plans array
    return NextResponse.json({
      plans: pricing.plans || [],
    });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}
