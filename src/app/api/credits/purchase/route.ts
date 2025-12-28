import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  addCredits,
  dollarsToCredits,
  CREDITS_PER_DOLLAR,
} from "@/lib/credits";
import prisma from "@/lib/prisma";

// Credit packages available for purchase
const CREDIT_PACKAGES = [
  { id: "100", credits: 100, price: 1 },
  { id: "500", credits: 500, price: 5 },
  { id: "1000", credits: 1000, price: 10 },
  { id: "2500", credits: 2500, price: 25 },
  { id: "5000", credits: 5000, price: 50 },
  { id: "10000", credits: 10000, price: 100 },
];

// GET /api/credits/purchase - Get available credit packages
export async function GET() {
  return NextResponse.json({
    packages: CREDIT_PACKAGES,
    rate: CREDITS_PER_DOLLAR,
  });
}

// POST /api/credits/purchase - Purchase credits
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { packageId, customAmount, paymentProvider, paymentTxId } = body;

    let creditsToPurchase: number;
    let dollarAmount: number;

    if (packageId) {
      // Use predefined package
      const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
      if (!pkg) {
        return NextResponse.json(
          { error: "Invalid package" },
          { status: 400 }
        );
      }
      creditsToPurchase = pkg.credits;
      dollarAmount = pkg.price;
    } else if (customAmount && customAmount > 0) {
      // Custom amount ($1 = 100 credits)
      dollarAmount = customAmount;
      creditsToPurchase = dollarsToCredits(dollarAmount);
    } else {
      return NextResponse.json(
        { error: "Package or amount required" },
        { status: 400 }
      );
    }

    // Validate payment (in a real implementation, verify with payment provider)
    if (!paymentProvider || !paymentTxId) {
      return NextResponse.json(
        { error: "Payment information required" },
        { status: 400 }
      );
    }

    // Check if this transaction was already processed
    const existingPayment = await prisma.payment.findFirst({
      where: { providerTxId: paymentTxId },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "Payment already processed" },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: dollarAmount,
        currency: "USD",
        platformFee: dollarAmount * 0.03,
        netAmount: dollarAmount * 0.97,
        provider: paymentProvider,
        providerTxId: paymentTxId,
        status: "COMPLETED",
        type: "MEDIA_PURCHASE",
        description: `Purchased ${creditsToPurchase} credits`,
      },
    });

    // Add credits to user
    const result = await addCredits(userId, creditsToPurchase, "PURCHASE", {
      description: `Purchased ${creditsToPurchase} credits for $${dollarAmount}`,
    });

    return NextResponse.json({
      success: true,
      credits: creditsToPurchase,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Error purchasing credits:", error);
    return NextResponse.json(
      { error: "Failed to purchase credits" },
      { status: 500 }
    );
  }
}
