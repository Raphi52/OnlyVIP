import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Public endpoint to check if auto-accept is enabled
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findFirst({
      where: { creatorSlug: null },
      select: { autoAcceptCreators: true },
    });

    return NextResponse.json({
      autoAcceptEnabled: settings?.autoAcceptCreators === true,
    });
  } catch (error) {
    console.error("Error fetching auto-accept setting:", error);
    return NextResponse.json({ autoAcceptEnabled: false });
  }
}
