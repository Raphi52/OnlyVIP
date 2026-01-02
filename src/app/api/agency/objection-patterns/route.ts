/**
 * API: Objection Patterns CRUD
 *
 * GET /api/agency/objection-patterns?agencyId=xxx - List patterns
 * POST /api/agency/objection-patterns - Create pattern
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Default patterns to suggest
const DEFAULT_OBJECTION_PATTERNS = [
  {
    name: "Too Expensive",
    patterns: ["trop cher", "too expensive", "can't afford", "pas les moyens"],
    strategy: "discount_offer",
    discountPercent: 20,
    discountValidHours: 1,
  },
  {
    name: "Maybe Later",
    patterns: ["plus tard", "maybe later", "not now", "pas maintenant"],
    strategy: "urgency",
    discountPercent: null,
    discountValidHours: null,
  },
  {
    name: "No Money",
    patterns: ["j'ai pas d'argent", "no money", "broke", "fauché"],
    strategy: "scarcity",
    discountPercent: 30,
    discountValidHours: 2,
  },
  {
    name: "Free Elsewhere",
    patterns: ["gratuit ailleurs", "free elsewhere", "can get free"],
    strategy: "value_prop",
    discountPercent: null,
    discountValidHours: null,
  },
];

// Helper to verify agency ownership
async function verifyAgencyOwnership(userId: string, agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { ownerId: true },
  });
  return agency?.ownerId === userId;
}

// Get all objection patterns for agency
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
      return NextResponse.json({ error: "agencyId required" }, { status: 400 });
    }

    // Verify ownership
    const isOwner = await verifyAgencyOwnership(session.user.id, agencyId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get patterns
    const patterns = await prisma.objectionPattern.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
    });

    // If no patterns, return defaults as suggestions
    if (patterns.length === 0) {
      return NextResponse.json({
        patterns: [],
        suggestions: DEFAULT_OBJECTION_PATTERNS,
      });
    }

    // Add conversion rate to each pattern
    const patternsWithStats = patterns.map((p) => ({
      ...p,
      patterns: JSON.parse(p.patterns),
      conversionRate:
        p.timesTriggered > 0
          ? Math.round((p.timesConverted / p.timesTriggered) * 100)
          : 0,
    }));

    return NextResponse.json({ patterns: patternsWithStats });
  } catch (error) {
    console.error("Get objection patterns error:", error);
    return NextResponse.json(
      { error: "Failed to get patterns" },
      { status: 500 }
    );
  }
}

// Create new objection pattern
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      agencyId,
      name,
      patterns,
      strategy,
      responseTemplate,
      discountPercent,
      discountValidHours,
    } = body;

    // Validate
    if (!agencyId || !name || !patterns || !strategy || !responseTemplate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify ownership
    const isOwner = await verifyAgencyOwnership(session.user.id, agencyId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create pattern
    const pattern = await prisma.objectionPattern.create({
      data: {
        agencyId,
        name,
        patterns: JSON.stringify(patterns),
        strategy,
        responseTemplate,
        discountPercent: discountPercent || null,
        discountValidHours: discountValidHours || null,
      },
    });

    return NextResponse.json({
      success: true,
      pattern: {
        ...pattern,
        patterns: JSON.parse(pattern.patterns),
      },
    });
  } catch (error) {
    console.error("Create objection pattern error:", error);
    return NextResponse.json(
      { error: "Failed to create pattern" },
      { status: 500 }
    );
  }
}
