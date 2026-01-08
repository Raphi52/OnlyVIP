import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { triggerTyping } from "@/lib/pusher";

// POST /api/conversations/[id]/typing - Send typing indicator
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { isTyping } = await req.json();

    // Trigger typing event via Pusher
    await triggerTyping(conversationId, session.user.id, isTyping);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending typing indicator:", error);
    return NextResponse.json(
      { error: "Failed to send typing indicator" },
      { status: 500 }
    );
  }
}
