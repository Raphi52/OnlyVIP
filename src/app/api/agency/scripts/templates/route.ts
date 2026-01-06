import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { VIRAL_STUDIO_SCRIPTS } from "@/lib/scripts/seed-viral-studio";

// GET - Get available templates
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Group templates by category
    const templatesByCategory = VIRAL_STUDIO_SCRIPTS.reduce((acc, script) => {
      if (!acc[script.category]) {
        acc[script.category] = [];
      }
      acc[script.category].push({
        name: script.name,
        content: script.content,
        category: script.category,
        intent: script.intent,
        language: script.language,
        preview: script.content.substring(0, 100) + "...",
      });
      return acc;
    }, {} as Record<string, Array<{
      name: string;
      content: string;
      category: string;
      intent: string;
      language: string;
      preview: string;
    }>>);

    const categories = Object.entries(templatesByCategory).map(([category, templates]) => ({
      category,
      count: templates.length,
      templates,
    }));

    return NextResponse.json({
      totalTemplates: VIRAL_STUDIO_SCRIPTS.length,
      categories,
      languages: ["fr", "en"],
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Import templates for an agency
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      agencyId,
      categories,
      languages,
      creatorSlug,
    } = body as {
      agencyId: string;
      categories?: string[];
      languages?: string[];
      creatorSlug?: string;
    };

    if (!agencyId) {
      return NextResponse.json(
        { error: "Agency ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to the agency
    const agency = await prisma.agency.findFirst({
      where: {
        id: agencyId,
        ownerId: session.user.id,
      },
    });

    if (!agency) {
      return NextResponse.json(
        { error: "Agency not found or access denied" },
        { status: 403 }
      );
    }

    // Filter templates
    let templatesToImport = VIRAL_STUDIO_SCRIPTS;

    if (categories && categories.length > 0) {
      templatesToImport = templatesToImport.filter((t) =>
        categories.includes(t.category)
      );
    }

    if (languages && languages.length > 0) {
      templatesToImport = templatesToImport.filter((t) =>
        languages.includes(t.language)
      );
    }

    // Create scripts in database
    const createdScripts = [];
    const skippedScripts = [];

    for (const template of templatesToImport) {
      // Check if script with same name already exists
      const existing = await prisma.script.findFirst({
        where: {
          agencyId,
          name: template.name,
        },
      });

      if (existing) {
        skippedScripts.push(template.name);
        continue;
      }

      // creatorSlug is required - use provided or get first creator in agency
      const scriptCreatorSlug = creatorSlug || (await prisma.creator.findFirst({
        where: { agencyId },
        select: { slug: true },
      }))?.slug;

      if (!scriptCreatorSlug) {
        continue; // Skip if no creator available
      }

      const script = await prisma.script.create({
        data: {
          creatorSlug: scriptCreatorSlug,
          agencyId,
          name: template.name,
          content: template.content,
          category: template.category,
          intent: template.intent,
          language: template.language,
          priority: template.priority,
          triggerKeywords: JSON.stringify(template.triggerKeywords),
          triggerPatterns: template.triggerPatterns
            ? JSON.stringify(template.triggerPatterns)
            : null,
          aiInstructions: template.aiInstructions || null,
          preserveCore: template.preserveCore
            ? template.preserveCore.join(", ")
            : null,
          hasVariables: template.content.includes("{{"),
          allowAiModify: true,
          isActive: true,
          status: "APPROVED",
          minConfidence: 0.5,
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
      imported: createdScripts.length,
      skipped: skippedScripts.length,
      skippedNames: skippedScripts,
      scripts: createdScripts,
    });
  } catch (error) {
    console.error("Error importing templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove all template scripts from an agency
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
      return NextResponse.json(
        { error: "Agency ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to the agency
    const agency = await prisma.agency.findFirst({
      where: {
        id: agencyId,
        ownerId: session.user.id,
      },
    });

    if (!agency) {
      return NextResponse.json(
        { error: "Agency not found or access denied" },
        { status: 403 }
      );
    }

    // Get template names
    const templateNames = VIRAL_STUDIO_SCRIPTS.map((t) => t.name);

    // Delete matching scripts
    const result = await prisma.script.deleteMany({
      where: {
        agencyId,
        name: { in: templateNames },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Error deleting templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
