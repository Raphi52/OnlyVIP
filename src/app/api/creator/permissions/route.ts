import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCreatorPermissions } from "@/lib/agency-permissions";

// GET /api/creator/permissions?creator=slug
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creator");

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    const isAdmin = (session.user as any).role === "ADMIN";
    const permissions = await getCreatorPermissions(creatorSlug, session.user.id, isAdmin);

    return NextResponse.json(permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
