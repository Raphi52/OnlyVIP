import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { VIRAL_STUDIO_SCRIPTS, type ScriptSeed } from "@/lib/scripts/seed-viral-studio";

/**
 * POST /api/agency/scripts/seed
 * Seeds pre-defined scripts for an agency
 * Only agency owners can seed scripts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, creatorSlug, languages = ["fr"], overwrite = false } = body;

    if (!agencyId || !creatorSlug) {
      return NextResponse.json(
        { error: "Agency ID and creator slug are required" },
        { status: 400 }
      );
    }

    // Verify user owns this agency
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { ownerId: true, name: true },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    if (agency.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only agency owner can seed scripts" },
        { status: 403 }
      );
    }

    // Filter scripts by requested languages
    const scriptsToSeed = VIRAL_STUDIO_SCRIPTS.filter((s) =>
      languages.includes(s.language)
    );

    if (scriptsToSeed.length === 0) {
      return NextResponse.json(
        { error: "No scripts found for specified languages" },
        { status: 400 }
      );
    }

    // If overwrite, delete existing scripts (only those with matching categories)
    if (overwrite) {
      const categoriesToDelete = [...new Set(scriptsToSeed.map((s) => s.category))];
      await prisma.script.deleteMany({
        where: {
          agencyId,
          category: { in: categoriesToDelete },
        },
      });
    }

    // Create scripts
    const createdScripts = [];
    const skippedScripts = [];

    for (const scriptData of scriptsToSeed) {
      // Check if script with same name already exists
      const existing = await prisma.script.findFirst({
        where: {
          agencyId,
          name: scriptData.name,
        },
      });

      if (existing && !overwrite) {
        skippedScripts.push(scriptData.name);
        continue;
      }

      const script = await prisma.script.create({
        data: {
          creatorSlug,
          agencyId,
          name: scriptData.name,
          content: scriptData.content,
          category: scriptData.category,
          status: "APPROVED",
          authorId: session.user.id,
          approvedById: session.user.id,
          approvedAt: new Date(),
          hasVariables: scriptData.content.includes("{{"),
          variables: scriptData.content.includes("{{")
            ? JSON.stringify(
                scriptData.content.match(/\{\{(\w+)\}\}/g) || []
              )
            : null,
        },
      });

      createdScripts.push({
        id: script.id,
        name: script.name,
        category: script.category,
      });
    }

    return NextResponse.json({
      success: true,
      created: createdScripts.length,
      skipped: skippedScripts.length,
      scripts: createdScripts,
      skippedNames: skippedScripts,
      message: `Successfully seeded ${createdScripts.length} scripts for ${agency.name}`,
    });
  } catch (error) {
    console.error("Error seeding scripts:", error);
    return NextResponse.json(
      { error: "Failed to seed scripts" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agency/scripts/seed
 * Get available script templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Group scripts by category
    const byCategory: Record<string, ScriptSeed[]> = {};
    const byLanguage: Record<string, number> = {};

    for (const script of VIRAL_STUDIO_SCRIPTS) {
      // By category
      if (!byCategory[script.category]) {
        byCategory[script.category] = [];
      }
      byCategory[script.category].push(script);

      // By language
      byLanguage[script.language] = (byLanguage[script.language] || 0) + 1;
    }

    return NextResponse.json({
      total: VIRAL_STUDIO_SCRIPTS.length,
      byCategory: Object.entries(byCategory).map(([category, scripts]) => ({
        category,
        count: scripts.length,
        scripts: scripts.map((s) => ({
          name: s.name,
          category: s.category,
          preview: s.content.substring(0, 100) + (s.content.length > 100 ? "..." : ""),
        })),
      })),
      byLanguage,
      availableLanguages: Object.keys(byLanguage),
    });
  } catch (error) {
    console.error("Error fetching script templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
