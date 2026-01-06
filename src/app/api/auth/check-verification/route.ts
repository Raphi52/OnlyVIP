import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ needsVerification: false });
    }

    // Find the user (case-insensitive email search)
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" }
      },
      select: { emailVerified: true, passwordHash: true, email: true },
    });

    // Only indicate needs verification if user exists, has password (not OAuth only), and is not verified
    if (user && user.passwordHash && !user.emailVerified) {
      console.log(`[AUTH] User ${user.email} needs email verification`);
      return NextResponse.json({ needsVerification: true });
    }

    return NextResponse.json({ needsVerification: false });
  } catch (error) {
    console.error("Check verification error:", error);
    return NextResponse.json({ needsVerification: false });
  }
}
