/**
 * Cron Job: Process Script Follow-ups
 *
 * Call every minute to send pending follow-up messages
 * GET /api/cron/follow-ups?secret=CRON_SECRET
 *
 * This handles automatic follow-ups configured in script flows:
 * - Scripts can have followUpDelay (minutes) and followUpScriptId
 * - When a script is sent, we schedule the follow-up
 * - This cron sends the follow-up when due
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getNextScript } from "@/lib/scripts/script-matcher";
import { parseScriptVariables } from "@/lib/scripts/variables";
import { sendMessageFromAi } from "@/lib/chat/send-message";

interface FollowUpResult {
  conversationId: string;
  status: "sent" | "skipped" | "error";
  scriptName?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = request.nextUrl.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: FollowUpResult[] = [];
  const now = new Date();

  try {
    // Find conversations with pending follow-ups that are due
    const pendingFollowUps = await prisma.conversation.findMany({
      where: {
        followUpDueAt: { lte: now },
        followUpSent: false,
        pendingFollowUpId: { not: null },
      },
      take: 20, // Process max 20 at a time
      select: {
        id: true,
        creatorSlug: true,
        lastScriptId: true,
        pendingFollowUpId: true,
        participants: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                isCreator: true,
              },
            },
          },
        },
      },
    });

    for (const conv of pendingFollowUps) {
      try {
        // Get the original script to find the follow-up script
        if (!conv.lastScriptId) {
          results.push({
            conversationId: conv.id,
            status: "skipped",
            error: "No lastScriptId",
          });
          continue;
        }

        // Get follow-up script
        const followUpScript = await getNextScript(conv.lastScriptId, "followup");

        if (!followUpScript) {
          // No follow-up configured, clear the state
          await prisma.conversation.update({
            where: { id: conv.id },
            data: {
              followUpSent: true,
              pendingFollowUpId: null,
              followUpDueAt: null,
            },
          });

          results.push({
            conversationId: conv.id,
            status: "skipped",
            error: "No follow-up script found",
          });
          continue;
        }

        // Find the fan in the conversation
        const fan = conv.participants.find(p => !p.user.isCreator);
        if (!fan) {
          results.push({
            conversationId: conv.id,
            status: "skipped",
            error: "No fan found in conversation",
          });
          continue;
        }

        // Check if fan has messaged since the last script was sent
        // (If they did, we may not want to follow up)
        const recentFanMessage = await prisma.message.findFirst({
          where: {
            conversationId: conv.id,
            senderId: fan.userId,
            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // Last 24h
          },
          orderBy: { createdAt: "desc" },
        });

        // If fan messaged recently, skip the follow-up
        if (recentFanMessage) {
          await prisma.conversation.update({
            where: { id: conv.id },
            data: {
              followUpSent: true,
              pendingFollowUpId: null,
              followUpDueAt: null,
            },
          });

          results.push({
            conversationId: conv.id,
            status: "skipped",
            error: "Fan already responded",
          });
          continue;
        }

        // Get creator info for variable parsing
        const creator = await prisma.creator.findUnique({
          where: { slug: conv.creatorSlug },
          select: {
            displayName: true,
            userId: true,
          },
        });

        if (!creator || !creator.userId) {
          results.push({
            conversationId: conv.id,
            status: "error",
            error: "Creator not found or has no user account",
          });
          continue;
        }

        // Parse script content with variables
        const parsedContent = parseScriptVariables(followUpScript.content, {
          fanName: fan.user.name || "babe",
          creatorName: creator.displayName || "me",
          ppvPrice: followUpScript.suggestedPrice || 15,
        });

        // Send the follow-up message
        await sendMessageFromAi({
          conversationId: conv.id,
          creatorUserId: creator.userId,
          fanUserId: fan.userId,
          text: parsedContent,
          scriptId: followUpScript.id,
          isFollowUp: true,
        });

        // Update conversation state
        await prisma.conversation.update({
          where: { id: conv.id },
          data: {
            followUpSent: true,
            lastScriptId: followUpScript.id,
            lastScriptSentAt: new Date(),
            // Check if this follow-up has its own next scripts
            awaitingFanResponse: true,
            // Clear the pending follow-up
            pendingFollowUpId: null,
            followUpDueAt: null,
          },
        });

        // Update script usage stats
        await prisma.script.update({
          where: { id: followUpScript.id },
          data: {
            usageCount: { increment: 1 },
            messagesSent: { increment: 1 },
          },
        });

        results.push({
          conversationId: conv.id,
          status: "sent",
          scriptName: followUpScript.name,
        });
      } catch (error) {
        console.error(`[FollowUp] Error for conversation ${conv.id}:`, error);
        results.push({
          conversationId: conv.id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const sent = results.filter(r => r.status === "sent").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const errors = results.filter(r => r.status === "error").length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      sent,
      skipped,
      errors,
      results: process.env.NODE_ENV === "development" ? results : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[FollowUp Cron] Error:", error);
    return NextResponse.json(
      { error: "Failed to process follow-ups" },
      { status: 500 }
    );
  }
}
