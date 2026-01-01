import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  addCredits,
  dollarsToCredits,
  CREDITS_PER_DOLLAR,
} from "@/lib/credits";
import prisma from "@/lib/prisma";

// Credit packages available for purchase
// paidCredits = usable everywhere, generate creator earnings
// bonusCredits = PPV catalog only, NO creator earnings
const CREDIT_PACKAGES = [
  { id: "100", paidCredits: 100, bonusCredits: 0, price: 1 },
  { id: "500", paidCredits: 500, bonusCredits: 50, price: 5 },
  { id: "1000", paidCredits: 1000, bonusCredits: 150, price: 10 },
  { id: "2500", paidCredits: 2500, bonusCredits: 500, price: 25 },
  { id: "5000", paidCredits: 5000, bonusCredits: 1250, price: 50 },
  { id: "10000", paidCredits: 10000, bonusCredits: 3000, price: 100 },
];

// GET /api/credits/purchase - Get available credit packages
export async function GET() {
  // Return packages with total for display
  const packagesWithTotal = CREDIT_PACKAGES.map((pkg) => ({
    ...pkg,
    totalCredits: pkg.paidCredits + pkg.bonusCredits,
    // For backwards compatibility
    credits: pkg.paidCredits + pkg.bonusCredits,
  }));

  return NextResponse.json({
    packages: packagesWithTotal,
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

    let paidCredits: number;
    let bonusCredits: number;
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
      paidCredits = pkg.paidCredits;
      bonusCredits = pkg.bonusCredits;
      dollarAmount = pkg.price;
    } else if (customAmount && customAmount > 0) {
      // Custom amount ($1 = 100 credits) - no bonus for custom amounts
      dollarAmount = customAmount;
      paidCredits = dollarsToCredits(dollarAmount);
      bonusCredits = 0;
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

    const totalCredits = paidCredits + bonusCredits;

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
        description: `Purchased ${paidCredits} credits${bonusCredits > 0 ? ` + ${bonusCredits} bonus` : ""}`,
      },
    });

    // Add PAID credits to user
    const paidResult = await addCredits(userId, paidCredits, "PURCHASE", {
      creditType: "PAID",
      description: `Purchased ${paidCredits} credits for $${dollarAmount}`,
    });

    let bonusTransactionId: string | undefined;

    // Add BONUS credits if any
    if (bonusCredits > 0) {
      const bonusResult = await addCredits(userId, bonusCredits, "PURCHASE_BONUS", {
        creditType: "BONUS",
        description: `Bonus ${bonusCredits} credits (PPV catalog only)`,
      });
      bonusTransactionId = bonusResult.transactionId;
    }

    return NextResponse.json({
      success: true,
      paidCredits,
      bonusCredits,
      totalCredits,
      newBalance: paidResult.newBalance + (bonusCredits > 0 ? bonusCredits : 0),
      transactionId: paidResult.transactionId,
      bonusTransactionId,
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
