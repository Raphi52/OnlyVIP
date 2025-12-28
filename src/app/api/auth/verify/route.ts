import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://viponly.fun";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=missing_token`);
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=invalid_token`);
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.redirect(`${APP_URL}/auth/login?error=expired_token`);
    }

    // Find and update the user
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=user_not_found`);
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Delete the verification token
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name || "");

    // Redirect to login with success message
    return NextResponse.redirect(`${APP_URL}/auth/login?verified=true`);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(`${APP_URL}/auth/login?error=verification_failed`);
  }
}
