import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Get wallet addresses from environment variables (secure)
function getSecureWallets() {
  return {
    platformWalletEth: process.env.PAYGATE_WALLET_ADDRESS || null,
    platformWalletBtc: process.env.PLATFORM_WALLET_BTC || null,
  };
}

// GET /api/admin/site-settings - Get site settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get site settings from database or return defaults
    // Always look for the "default" record first, then fall back to findFirst for backwards compatibility
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    // Fallback to findFirst if "default" doesn't exist (migration case)
    if (!settings) {
      settings = await prisma.siteSettings.findFirst();
    }

    // Get wallets from env vars (secure)
    const wallets = getSecureWallets();

    if (settings) {
      return NextResponse.json({
        ...settings,
        // Override with secure wallet addresses from env
        platformWalletEth: wallets.platformWalletEth,
        platformWalletBtc: wallets.platformWalletBtc,
      });
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
      // Platform commission settings - wallets from env vars
      platformWalletEth: wallets.platformWalletEth,
      platformWalletBtc: wallets.platformWalletBtc,
      platformCommission: 0.05,
      firstMonthFreeCommission: true,
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

    // SECURITY: Wallet addresses are NOT accepted from the request body
    // They are read from environment variables only to prevent unauthorized changes
    // Explicitly remove any wallet addresses from the body
    const { platformWalletEth, platformWalletBtc, ...safeBody } = body;

    if (platformWalletEth || platformWalletBtc) {
      console.warn("[SECURITY] Attempted to modify wallet addresses via API - blocked");
    }

    // Upsert site settings (without wallet addresses)
    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {
        siteName: safeBody.siteName,
        siteDescription: safeBody.siteDescription,
        siteUrl: safeBody.siteUrl,
        logo: safeBody.logo,
        favicon: safeBody.favicon,
        primaryColor: safeBody.primaryColor,
        accentColor: safeBody.accentColor,
        stripeEnabled: safeBody.stripeEnabled,
        cryptoEnabled: safeBody.cryptoEnabled,
        maintenanceMode: safeBody.maintenanceMode,
        registrationEnabled: safeBody.registrationEnabled,
        emailNotifications: safeBody.emailNotifications,
        pushNotifications: safeBody.pushNotifications,
        // Platform commission settings (no wallets - those come from env)
        platformCommission: safeBody.platformCommission,
        firstMonthFreeCommission: safeBody.firstMonthFreeCommission,
      },
      create: {
        id: "default",
        siteName: safeBody.siteName || "ExclusiveHub",
        siteDescription: safeBody.siteDescription || "",
        siteUrl: safeBody.siteUrl || "",
        logo: safeBody.logo,
        favicon: safeBody.favicon,
        primaryColor: safeBody.primaryColor || "#D4AF37",
        accentColor: safeBody.accentColor || "#B8860B",
        stripeEnabled: safeBody.stripeEnabled ?? true,
        cryptoEnabled: safeBody.cryptoEnabled ?? false,
        maintenanceMode: safeBody.maintenanceMode ?? false,
        registrationEnabled: safeBody.registrationEnabled ?? true,
        emailNotifications: safeBody.emailNotifications ?? true,
        pushNotifications: safeBody.pushNotifications ?? false,
        // Platform commission settings (no wallets - those come from env)
        platformCommission: safeBody.platformCommission ?? 0.05,
        firstMonthFreeCommission: safeBody.firstMonthFreeCommission ?? true,
      },
    });

    // Return settings with secure wallet addresses from env
    const wallets = getSecureWallets();
    return NextResponse.json({
      ...settings,
      platformWalletEth: wallets.platformWalletEth,
      platformWalletBtc: wallets.platformWalletBtc,
    });
  } catch (error) {
    console.error("Error updating site settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
