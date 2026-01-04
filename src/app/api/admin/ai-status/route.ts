import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/ai-status - Diagnostic endpoint for AI system
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check creators
    const creators = await prisma.creator.findMany({
      select: {
        slug: true,
        displayName: true,
        aiResponseDelay: true,
        aiLastActive: true,
      },
    });

    // Check pending queue items
    const pendingQueue = await prisma.aiResponseQueue.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        messageId: true,
        conversationId: true,
        creatorSlug: true,
        status: true,
        scheduledAt: true,
        attempts: true,
        error: true,
        createdAt: true,
      },
    });

    // Check failed queue items
    const failedQueue = await prisma.aiResponseQueue.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        messageId: true,
        creatorSlug: true,
        status: true,
        error: true,
        attempts: true,
        createdAt: true,
      },
    });

    // Check recent completed
    const recentCompleted = await prisma.aiResponseQueue.findMany({
      where: { status: "COMPLETED" },
      orderBy: { processedAt: "desc" },
      take: 5,
      select: {
        id: true,
        creatorSlug: true,
        processedAt: true,
        response: true,
      },
    });

    // Check if OPENROUTER_API_KEY is set
    const hasApiKey = !!process.env.OPENROUTER_API_KEY;
    const hasCronSecret = !!process.env.CRON_SECRET;

    // Check total conversations
    const totalConversations = await prisma.conversation.count();

    return NextResponse.json({
      config: {
        hasOpenRouterApiKey: hasApiKey,
        hasCronSecret: hasCronSecret,
        aiModel: process.env.AI_MODEL || "not set",
      },
      creators: creators.map((c) => ({
        slug: c.slug,
        name: c.displayName,
        delay: c.aiResponseDelay,
        lastActive: c.aiLastActive,
      })),
      conversations: {
        total: totalConversations,
      },
      queue: {
        pending: pendingQueue,
        failed: failedQueue,
        recentCompleted: recentCompleted,
      },
      instructions: {
        cronJob: "Call GET /api/ai/process-queue every 30s with x-cron-secret header",
        testManually: "POST /api/ai/process-queue with {messageId, creatorSlug, conversationId}",
      },
    });
  } catch (error) {
    console.error("AI status error:", error);
    return NextResponse.json(
      { error: "Failed to get AI status", details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Force process queue now
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call the process-queue endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/ai/process-queue`, {
      method: "GET",
      headers: {
        "x-cron-secret": process.env.CRON_SECRET || "",
      },
    });

    const result = await response.json();
    return NextResponse.json({
      message: "Queue processing triggered",
      result,
    });
  } catch (error) {
    console.error("Force process error:", error);
    return NextResponse.json(
      { error: "Failed to process queue", details: String(error) },
      { status: 500 }
    );
  }
}
