/**
 * API: Pusher Presence Webhook
 *
 * POST /api/pusher/presence-webhook - Handle Pusher presence events
 *
 * Triggers auto-bumps when fans come online
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { handleFanOnline, handleFanOffline } from "@/lib/auto-bump";
import { prisma } from "@/lib/prisma";

interface PusherWebhookEvent {
  name: string;
  channel: string;
  user_id?: string;
  data?: string;
}

interface PusherWebhookPayload {
  time_ms: number;
  events: PusherWebhookEvent[];
}

// Verify Pusher webhook signature
function verifyPusherSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-pusher-signature");
    const pusherKey = request.headers.get("x-pusher-key");

    // Verify webhook is from Pusher
    const pusherSecret = process.env.PUSHER_SECRET;
    if (!pusherSecret) {
      console.error("PUSHER_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (!verifyPusherSignature(body, signature, pusherSecret)) {
      console.error("Invalid Pusher signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload: PusherWebhookPayload = JSON.parse(body);

    // Process each event
    for (const event of payload.events) {
      // Presence channel events
      // Channel format: presence-creator-{slug}
      if (event.channel.startsWith("presence-creator-") && event.user_id) {
        const creatorSlug = event.channel.replace("presence-creator-", "");
        const fanUserId = event.user_id;

        if (event.name === "member_added") {
          // Fan came online
          console.log(`Fan ${fanUserId} online for ${creatorSlug}`);

          // Update presence
          await prisma.fanPresence.upsert({
            where: {
              fanUserId_creatorSlug: { fanUserId, creatorSlug },
            },
            update: {
              isOnline: true,
              lastSeen: new Date(),
            },
            create: {
              fanUserId,
              creatorSlug,
              isOnline: true,
              lastSeen: new Date(),
            },
          });

          // Trigger auto-bump logic
          await handleFanOnline(fanUserId, creatorSlug);
        } else if (event.name === "member_removed") {
          // Fan went offline
          console.log(`Fan ${fanUserId} offline for ${creatorSlug}`);

          // Update presence
          await prisma.fanPresence.upsert({
            where: {
              fanUserId_creatorSlug: { fanUserId, creatorSlug },
            },
            update: {
              isOnline: false,
              lastSeen: new Date(),
            },
            create: {
              fanUserId,
              creatorSlug,
              isOnline: false,
              lastSeen: new Date(),
            },
          });

          await handleFanOffline(fanUserId, creatorSlug);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
