import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseSchedule, getShiftStatus, formatShiftSlots } from "@/lib/chatter-shift";

// GET /api/chatter/shift-status - Get current shift status
export async function GET() {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    const chatter = await prisma.chatter.findUnique({
      where: { id: chatterId },
      select: {
        schedule: true,
        agency: {
          select: {
            // Could add timezone setting to Agency model later
            id: true,
          },
        },
      },
    });

    if (!chatter) {
      return NextResponse.json({ error: "Chatter not found" }, { status: 404 });
    }

    const schedule = parseSchedule(chatter.schedule);
    const status = getShiftStatus(schedule);

    return NextResponse.json({
      isOnShift: status.isOnShift,
      currentDay: status.currentDay,
      currentTime: status.currentTime,
      todayShifts: status.todayShifts,
      todayShiftsFormatted: formatShiftSlots(status.todayShifts),
      nextShift: status.nextShift,
      hasSchedule: schedule !== null,
    });
  } catch (error) {
    console.error("Error fetching shift status:", error);
    return NextResponse.json(
      { error: "Failed to fetch shift status" },
      { status: 500 }
    );
  }
}
