import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIP, rateLimitResponse, AUTH_LIMIT } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 registrations per minute per IP
    const ip = getClientIP(request);
    const rateLimitResult = rateLimit(`creator-register:${ip}`, AUTH_LIMIT);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const { name, email, password, slug } = body;

    // Validate required fields
    if (!name || !email || !password || !slug) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    const slugRegex = /^[a-z0-9-]+$/;
    const cleanSlug = slug.toLowerCase().trim();
    if (!slugRegex.test(cleanSlug)) {
      return NextResponse.json(
        { error: "Slug can only contain lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    if (cleanSlug.length < 3 || cleanSlug.length > 30) {
      return NextResponse.json(
        { error: "Slug must be between 3 and 30 characters" },
        { status: 400 }
      );
    }

    // Reserved slugs
    const reservedSlugs = ["admin", "api", "auth", "dashboard", "gallery", "checkout", "membership", "settings"];
    if (reservedSlugs.includes(cleanSlug)) {
      return NextResponse.json(
        { error: "This URL is reserved. Please choose another one." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingCreator = await prisma.creator.findUnique({
      where: { slug: cleanSlug },
    });

    if (existingCreator) {
      return NextResponse.json(
        { error: "This URL is already taken. Please choose another one." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and creator in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name: name.trim(),
          passwordHash,
          role: "USER",
          isCreator: true,
        },
      });

      // Create creator profile
      const creator = await tx.creator.create({
        data: {
          slug: cleanSlug,
          name: name.trim(),
          displayName: name.trim(),
          userId: user.id,
          isActive: true,
        },
      });

      // Create default site settings for the creator
      await tx.siteSettings.create({
        data: {
          creatorSlug: cleanSlug,
          siteName: name.trim(),
        },
      });

      return { user, creator };
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      creatorSlug: result.creator.slug,
    });
  } catch (error) {
    console.error("Creator registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}

// Check slug availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter required" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim();

    // Reserved slugs
    const reservedSlugs = ["admin", "api", "auth", "dashboard", "gallery", "checkout", "membership", "settings"];
    if (reservedSlugs.includes(cleanSlug)) {
      return NextResponse.json({ available: false, reason: "reserved" });
    }

    const existingCreator = await prisma.creator.findUnique({
      where: { slug: cleanSlug },
    });

    return NextResponse.json({
      available: !existingCreator,
      reason: existingCreator ? "taken" : null,
    });
  } catch (error) {
    console.error("Slug check error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
