import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/site-settings - Get site settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get site settings from database or return defaults
    const settings = await prisma.siteSettings.findFirst();

    if (settings) {
      return NextResponse.json(settings);
    }

    // Return defaults if no settings exist
    return NextResponse.json({
      siteName: "ExclusiveHub",
      siteDescription: "Premium content platform",
      siteUrl: "",
      logo: null,
      favicon: null,
      primaryColor: "#D4AF37",
      accentColor: "#B8860B",
      stripeEnabled: true,
      cryptoEnabled: false,
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotifications: true,
      pushNotifications: false,
    });
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/site-settings - Update site settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Upsert site settings
    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {
        siteName: body.siteName,
        siteDescription: body.siteDescription,
        siteUrl: body.siteUrl,
        logo: body.logo,
        favicon: body.favicon,
        primaryColor: body.primaryColor,
        accentColor: body.accentColor,
        stripeEnabled: body.stripeEnabled,
        cryptoEnabled: body.cryptoEnabled,
        maintenanceMode: body.maintenanceMode,
        registrationEnabled: body.registrationEnabled,
        emailNotifications: body.emailNotifications,
        pushNotifications: body.pushNotifications,
      },
      create: {
        id: "default",
        siteName: body.siteName || "ExclusiveHub",
        siteDescription: body.siteDescription || "",
        siteUrl: body.siteUrl || "",
        logo: body.logo,
        favicon: body.favicon,
        primaryColor: body.primaryColor || "#D4AF37",
        accentColor: body.accentColor || "#B8860B",
        stripeEnabled: body.stripeEnabled ?? true,
        cryptoEnabled: body.cryptoEnabled ?? false,
        maintenanceMode: body.maintenanceMode ?? false,
        registrationEnabled: body.registrationEnabled ?? true,
        emailNotifications: body.emailNotifications ?? true,
        pushNotifications: body.pushNotifications ?? false,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating site settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
