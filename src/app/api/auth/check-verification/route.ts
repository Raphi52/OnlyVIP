import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ needsVerification: false });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true, passwordHash: true },
    });

    // Only indicate needs verification if user exists, has password (not OAuth only), and is not verified
    if (user && user.passwordHash && !user.emailVerified) {
      return NextResponse.json({ needsVerification: true });
    }

    return NextResponse.json({ needsVerification: false });
  } catch (error) {
    console.error("Check verification error:", error);
    return NextResponse.json({ needsVerification: false });
  }
}
