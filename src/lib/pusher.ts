import Pusher from "pusher";

// Server-side Pusher client
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.PUSHER_CLUSTER || "eu",
  useTLS: true,
});

// Check if Pusher is configured
export function isPusherConfigured(): boolean {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET
  );
}

// Trigger a new message event
export async function triggerNewMessage(
  conversationId: string,
  message: {
    id: string;
    text: string | null;
    senderId: string;
    receiverId: string;
    isPPV: boolean;
    ppvPrice: number | null;
    isUnlocked: boolean;
    media: Array<{
      id: string;
      type: string;
      url: string;
      previewUrl: string | null;
    }>;
    createdAt: Date;
  }
) {
  if (!isPusherConfigured()) {
    console.log("Pusher not configured, skipping real-time notification");
    return;
  }

  try {
    // Notify both participants
    await pusherServer.trigger(
      `conversation-${conversationId}`,
      "new-message",
      message
    );

    // Also trigger on user-specific channels for notification badges
    await pusherServer.trigger(
      `user-${message.receiverId}`,
      "new-message-notification",
      {
        conversationId,
        senderId: message.senderId,
        preview: message.isPPV ? "Sent exclusive content" : message.text?.slice(0, 50),
      }
    );
  } catch (error) {
    console.error("Pusher trigger error:", error);
  }
}

// Trigger typing indicator
export async function triggerTyping(
  conversationId: string,
  userId: string,
  isTyping: boolean
) {
  if (!isPusherConfigured()) return;

  try {
    await pusherServer.trigger(`conversation-${conversationId}`, "typing", {
      userId,
      isTyping,
    });
  } catch (error) {
    console.error("Pusher typing trigger error:", error);
  }
}

// Trigger message read status
export async function triggerMessageRead(
  conversationId: string,
  readerId: string
) {
  if (!isPusherConfigured()) return;

  try {
    await pusherServer.trigger(`conversation-${conversationId}`, "messages-read", {
      readerId,
    });
  } catch (error) {
    console.error("Pusher read trigger error:", error);
  }
}

export default pusherServer;
