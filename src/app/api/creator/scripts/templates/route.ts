import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { VIRAL_STUDIO_SCRIPTS } from "@/lib/scripts/seed-viral-studio";

// Helper to verify creator access
async function verifyCreatorAccess(userId: string, creatorSlug: string) {
  const creator = await prisma.creator.findUnique({
    where: { slug: creatorSlug },
    select: {
      userId: true,
      agencyId: true,
      agency: {
        select: { ownerId: true },
      },
    },
  });

  if (!creator) return { hasAccess: false, agencyId: null };

  const isOwner = creator.userId === userId;
  const isAgencyOwner = creator.agency?.ownerId === userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = user?.role === "ADMIN";

  return {
    hasAccess: isOwner || isAgencyOwner || isAdmin,
    agencyId: creator.agencyId,
  };
}

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

// POST - Import templates for a creator
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      creatorSlug,
      categories,
      languages,
    } = body as {
      creatorSlug: string;
      categories?: string[];
      languages?: string[];
    };

    if (!creatorSlug) {
      return NextResponse.json(
        { error: "Creator slug is required" },
        { status: 400 }
      );
    }

    // Verify access
    const { hasAccess, agencyId } = await verifyCreatorAccess(session.user.id, creatorSlug);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Creator not found or access denied" },
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
      // Check if script with same name already exists for this creator
      const existing = await prisma.script.findFirst({
        where: {
          creatorSlug,
          name: template.name,
        },
      });

      if (existing) {
        skippedScripts.push(template.name);
        continue;
      }

      const script = await prisma.script.create({
        data: {
          creatorSlug,
          agencyId: agencyId || null,
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
