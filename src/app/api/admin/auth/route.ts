import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

// Admin password - MUST be set in environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Secure token generation using cryptographic randomness
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    // Reject if ADMIN_PASSWORD not configured
    if (!ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD environment variable not set");
      return NextResponse.json({ success: false, error: "Admin login disabled" }, { status: 503 });
    }

    const { password } = await request.json();

    // Use timing-safe comparison to prevent timing attacks
    const passwordBuffer = Buffer.from(password || "");
    const adminBuffer = Buffer.from(ADMIN_PASSWORD);

    if (passwordBuffer.length === adminBuffer.length &&
        crypto.timingSafeEqual(passwordBuffer, adminBuffer)) {
      const token = generateToken();

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  // Logout
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  return NextResponse.json({ success: true });
}

export async function GET() {
  // Check if admin is logged in
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  return NextResponse.json({ isAdmin: !!token?.value });
}
