import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

// POST - Import scripts from other creators in the same agency
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { creatorSlug, scriptIds } = body as {
      creatorSlug: string;
      scriptIds: string[];
    };

    if (!creatorSlug || !scriptIds || scriptIds.length === 0) {
      return NextResponse.json(
        { error: "Creator slug and script IDs are required" },
        { status: 400 }
      );
    }

    // Verify access to target creator
    const { hasAccess, agencyId } = await verifyCreatorAccess(session.user.id, creatorSlug);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Creator not found or access denied" },
        { status: 403 }
      );
    }

    // Get the target creator info
    const targetCreator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      select: { displayName: true, name: true },
    });

    // Fetch the scripts to import
    const scriptsToImport = await prisma.script.findMany({
      where: {
        id: { in: scriptIds },
        isActive: true,
      },
      include: {
        creator: {
          select: { displayName: true, name: true },
        },
      },
    });

    if (scriptsToImport.length === 0) {
      return NextResponse.json(
        { error: "No valid scripts found to import" },
        { status: 400 }
      );
    }

    // Verify all scripts are from the same agency (security check)
    for (const script of scriptsToImport) {
      // The script must be from a creator in the same agency
      const sourceCreator = await prisma.creator.findUnique({
        where: { slug: script.creatorSlug },
        select: { agencyId: true },
      });

      if (sourceCreator?.agencyId !== agencyId) {
        return NextResponse.json(
          { error: "Cannot import scripts from creators outside your agency" },
          { status: 403 }
        );
      }
    }

    // Build a map of old script IDs to track which ones are being imported
    const oldScriptIds = new Set(scriptsToImport.map((s) => s.id));

    // Create copies of the scripts (first pass - without flow connections)
    const importedScripts = [];
    const idMapping: Record<string, string> = {}; // oldId -> newId

    for (const script of scriptsToImport) {
      const importedFromName = script.creator?.displayName || script.creator?.name || script.creatorSlug;

      const newScript = await prisma.script.create({
        data: {
          creatorSlug,
          agencyId: agencyId || null,
          name: script.name,
          content: script.content,
          category: script.category,
          intent: script.intent,
          triggerKeywords: script.triggerKeywords,
          triggerPatterns: script.triggerPatterns,
          fanStage: script.fanStage,
          minConfidence: script.minConfidence,
          priority: script.priority,
          suggestedPrice: script.suggestedPrice,
          priceMin: script.priceMin,
          priceMax: script.priceMax,
          isFreeTease: script.isFreeTease,
          aiInstructions: script.aiInstructions,
          allowAiModify: script.allowAiModify,
          preserveCore: script.preserveCore,
          exampleResponses: script.exampleResponses,
          language: script.language,
          objectionType: script.objectionType,
          objectionResponse: script.objectionResponse,
          hasVariables: script.hasVariables,
          variables: script.variables,
          isActive: true,
          status: "APPROVED",
          authorId: session.user.id,
          // Track import origin
          importedFrom: script.creatorSlug,
          importedFromName: importedFromName,
          // Flow fields will be updated in second pass
          followUpDelay: script.followUpDelay,
        },
      });

      idMapping[script.id] = newScript.id;
      importedScripts.push({
        id: newScript.id,
        name: newScript.name,
        importedFrom: importedFromName,
      });
    }

    // Second pass - update flow connections with mapped IDs
    let flowsCreated = 0;
    for (const script of scriptsToImport) {
      const newScriptId = idMapping[script.id];
      const flowUpdates: {
        nextScriptOnSuccess?: string;
        nextScriptOnReject?: string;
        followUpScriptId?: string;
      } = {};

      // Map nextScriptOnSuccess if the referenced script was also imported
      if (script.nextScriptOnSuccess && oldScriptIds.has(script.nextScriptOnSuccess)) {
        flowUpdates.nextScriptOnSuccess = idMapping[script.nextScriptOnSuccess];
      }

      // Map nextScriptOnReject if the referenced script was also imported
      if (script.nextScriptOnReject && oldScriptIds.has(script.nextScriptOnReject)) {
        flowUpdates.nextScriptOnReject = idMapping[script.nextScriptOnReject];
      }

      // Map followUpScriptId if the referenced script was also imported
      if (script.followUpScriptId && oldScriptIds.has(script.followUpScriptId)) {
        flowUpdates.followUpScriptId = idMapping[script.followUpScriptId];
      }

      // Update the script with flow connections if any exist
      if (Object.keys(flowUpdates).length > 0) {
        await prisma.script.update({
          where: { id: newScriptId },
          data: flowUpdates,
        });
        flowsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedScripts.length,
      flowsCreated,
      scripts: importedScripts,
    });
  } catch (error) {
    console.error("Error importing scripts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
