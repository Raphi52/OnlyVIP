/**
 * Send Message Helper
 *
 * Utility functions for sending messages programmatically
 * (e.g., from AI, cron jobs, etc.)
 */

import prisma from "@/lib/prisma";
import { triggerNewMessage } from "@/lib/pusher";

interface SendMessageFromAiParams {
  conversationId: string;
  creatorUserId: string;
  fanUserId: string;
  text: string;
  scriptId?: string;
  aiPersonalityId?: string;
  isFollowUp?: boolean;
  media?: Array<{
    type: string;
    url: string;
    previewUrl?: string;
    mediaId?: string;
  }>;
  isPPV?: boolean;
  ppvPrice?: number;
}

/**
 * Send a message from the AI/creator to a fan
 * Used by follow-up cron job and AI response system
 */
export async function sendMessageFromAi(
  params: SendMessageFromAiParams
): Promise<{ messageId: string }> {
  const {
    conversationId,
    creatorUserId,
    fanUserId,
    text,
    scriptId,
    aiPersonalityId,
    media,
    isPPV = false,
    ppvPrice,
  } = params;

  // Create the message
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: creatorUserId,
      receiverId: fanUserId,
      text,
      isAiGenerated: true,
      scriptId: scriptId || null,
      aiPersonalityId: aiPersonalityId || null,
      isPPV,
      ppvPrice: isPPV && ppvPrice ? ppvPrice : null,
      ppvUnlockedBy: "[]",
      media: media && media.length > 0
        ? {
            create: media.map((m) => ({
              type: m.type,
              url: m.url,
              previewUrl: m.previewUrl || null,
              mediaId: m.mediaId || null,
            })),
          }
        : undefined,
    },
    include: {
      media: true,
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Update conversation's updatedAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Transform for Pusher
  const transformedMessage = {
    id: message.id,
    text: message.text,
    senderId: message.senderId,
    receiverId: message.receiverId,
    isPPV: message.isPPV,
    ppvPrice: message.ppvPrice ? Number(message.ppvPrice) : null,
    isUnlocked: false,
    ppvUnlockedBy: [],
    totalTips: 0,
    isRead: false,
    isAiGenerated: true,
    media: message.media.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      previewUrl: m.previewUrl,
    })),
    createdAt: message.createdAt,
  };

  // Trigger real-time notification
  await triggerNewMessage(conversationId, transformedMessage);

  return { messageId: message.id };
}

interface SendMessageWithMediaParams {
  conversationId: string;
  creatorUserId: string;
  fanUserId: string;
  text: string;
  mediaContent: {
    id: string;
    type: string;
    contentUrl: string;
    previewUrl?: string;
    thumbnailUrl?: string;
  };
  ppvPrice?: number;
  scriptId?: string;
}

/**
 * Send a message with media from the library
 * Handles PPV content properly
 */
export async function sendMessageWithMedia(
  params: SendMessageWithMediaParams
): Promise<{ messageId: string }> {
  const {
    conversationId,
    creatorUserId,
    fanUserId,
    text,
    mediaContent,
    ppvPrice,
    scriptId,
  } = params;

  const isPPV = !!ppvPrice && ppvPrice > 0;

  return sendMessageFromAi({
    conversationId,
    creatorUserId,
    fanUserId,
    text,
    scriptId,
    isPPV,
    ppvPrice,
    media: [
      {
        type: mediaContent.type,
        url: isPPV
          ? mediaContent.previewUrl || mediaContent.thumbnailUrl || mediaContent.contentUrl
          : mediaContent.contentUrl,
        previewUrl: mediaContent.thumbnailUrl || mediaContent.previewUrl,
        mediaId: mediaContent.id,
      },
    ],
  });
}
