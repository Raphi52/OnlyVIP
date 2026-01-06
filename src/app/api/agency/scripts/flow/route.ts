import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface FlowNode {
  id: string;
  name: string;
  intent: string | null;
  content: string;
  type: "root" | "success" | "reject" | "followup";
}

interface FlowEdge {
  from: string;
  to: string;
  type: "success" | "reject" | "followup";
  label?: string;
}

/**
 * GET /api/agency/scripts/flow
 * Get the complete flow graph for a script or all flows for an agency
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const isAgencyOwner = user.isAgencyOwner === true;
    const isChatter = user.role === "CHATTER";
    const chatterAgencyId = user.chatterId ? await getChatterAgencyId(user.chatterId) : null;

    if (!isAgencyOwner && !isChatter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const scriptId = searchParams.get("scriptId");
    const agencyId = searchParams.get("agencyId") || chatterAgencyId;

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID required" }, { status: 400 });
    }

    // If scriptId provided, get flow for that specific script
    if (scriptId) {
      const flow = await getScriptFlow(scriptId, agencyId);
      return NextResponse.json(flow);
    }

    // Otherwise, get all flows for the agency
    const flows = await getAllFlows(agencyId);
    return NextResponse.json(flows);
  } catch (error) {
    console.error("Error fetching flow:", error);
    return NextResponse.json(
      { error: "Failed to fetch flow" },
      { status: 500 }
    );
  }
}

/**
 * Get the flow graph starting from a specific script
 */
async function getScriptFlow(scriptId: string, agencyId: string) {
  // First get the root script
  const rootScript = await prisma.script.findFirst({
    where: {
      id: scriptId,
      agencyId,
    },
    select: {
      id: true,
      name: true,
      intent: true,
      content: true,
      nextScriptOnSuccess: true,
      nextScriptOnReject: true,
      followUpScriptId: true,
      followUpDelay: true,
    },
  });

  if (!rootScript) {
    return { nodes: [], edges: [], error: "Script not found" };
  }

  // Collect all script IDs in the flow
  const scriptIds = new Set<string>([scriptId]);
  const toVisit = [rootScript];
  const visited = new Set<string>();

  while (toVisit.length > 0) {
    const current = toVisit.pop()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.nextScriptOnSuccess) scriptIds.add(current.nextScriptOnSuccess);
    if (current.nextScriptOnReject) scriptIds.add(current.nextScriptOnReject);
    if (current.followUpScriptId) scriptIds.add(current.followUpScriptId);
  }

  // Fetch all scripts in the flow
  const allScripts = await prisma.script.findMany({
    where: {
      id: { in: Array.from(scriptIds) },
      agencyId,
    },
    select: {
      id: true,
      name: true,
      intent: true,
      content: true,
      nextScriptOnSuccess: true,
      nextScriptOnReject: true,
      followUpScriptId: true,
      followUpDelay: true,
    },
  });

  const scriptMap = new Map(allScripts.map((s) => [s.id, s]));

  // Build nodes and edges
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const processedNodes = new Set<string>();

  function processScript(id: string, type: FlowNode["type"]) {
    if (processedNodes.has(id)) return;
    processedNodes.add(id);

    const script = scriptMap.get(id);
    if (!script) return;

    nodes.push({
      id: script.id,
      name: script.name,
      intent: script.intent,
      content: script.content.substring(0, 100) + "...",
      type,
    });

    if (script.nextScriptOnSuccess) {
      edges.push({
        from: script.id,
        to: script.nextScriptOnSuccess,
        type: "success",
        label: "Success",
      });
      processScript(script.nextScriptOnSuccess, "success");
    }

    if (script.nextScriptOnReject) {
      edges.push({
        from: script.id,
        to: script.nextScriptOnReject,
        type: "reject",
        label: "Reject",
      });
      processScript(script.nextScriptOnReject, "reject");
    }

    if (script.followUpScriptId) {
      const delayLabel = script.followUpDelay
        ? script.followUpDelay >= 60
          ? `${Math.round(script.followUpDelay / 60)}h`
          : `${script.followUpDelay}m`
        : "";
      edges.push({
        from: script.id,
        to: script.followUpScriptId,
        type: "followup",
        label: `Follow-up ${delayLabel}`.trim(),
      });
      processScript(script.followUpScriptId, "followup");
    }
  }

  processScript(scriptId, "root");

  return { nodes, edges };
}

/**
 * Get all flows for an agency (scripts that start flows)
 */
async function getAllFlows(agencyId: string) {
  // Find scripts that are the start of flows (have successors but are not successors themselves)
  const allScripts = await prisma.script.findMany({
    where: {
      agencyId,
      isActive: true,
      OR: [
        { nextScriptOnSuccess: { not: null } },
        { nextScriptOnReject: { not: null } },
        { followUpScriptId: { not: null } },
      ],
    },
    select: {
      id: true,
      name: true,
      intent: true,
      content: true,
      nextScriptOnSuccess: true,
      nextScriptOnReject: true,
      followUpScriptId: true,
    },
  });

  // Find scripts that are targets of other scripts
  const targetIds = new Set<string>();
  allScripts.forEach((s) => {
    if (s.nextScriptOnSuccess) targetIds.add(s.nextScriptOnSuccess);
    if (s.nextScriptOnReject) targetIds.add(s.nextScriptOnReject);
    if (s.followUpScriptId) targetIds.add(s.followUpScriptId);
  });

  // Root scripts are those that have flows but are not targets
  const rootScripts = allScripts.filter((s) => !targetIds.has(s.id));

  // Build summary for each flow
  const flows = rootScripts.map((script) => {
    let nodeCount = 1;
    const visited = new Set<string>([script.id]);

    function countNodes(id: string | null) {
      if (!id || visited.has(id)) return;
      visited.add(id);
      nodeCount++;

      const s = allScripts.find((x) => x.id === id);
      if (s) {
        countNodes(s.nextScriptOnSuccess);
        countNodes(s.nextScriptOnReject);
        countNodes(s.followUpScriptId);
      }
    }

    countNodes(script.nextScriptOnSuccess);
    countNodes(script.nextScriptOnReject);
    countNodes(script.followUpScriptId);

    return {
      id: script.id,
      name: script.name,
      intent: script.intent,
      preview: script.content.substring(0, 80) + "...",
      nodeCount,
      hasSuccess: !!script.nextScriptOnSuccess,
      hasReject: !!script.nextScriptOnReject,
      hasFollowUp: !!script.followUpScriptId,
    };
  });

  return {
    flows,
    totalFlows: flows.length,
    totalScriptsWithFlow: allScripts.length,
  };
}

/**
 * Helper to get chatter's agency ID
 */
async function getChatterAgencyId(chatterId: string): Promise<string | null> {
  const chatter = await prisma.chatter.findUnique({
    where: { id: chatterId },
    select: { agencyId: true },
  });
  return chatter?.agencyId || null;
}
