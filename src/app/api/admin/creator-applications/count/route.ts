import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/creator-applications/count - Get pending applications count
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await prisma.creatorApplication.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching applications count:", error);
    return NextResponse.json({ count: 0 });
  }
}
