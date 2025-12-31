import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";

interface DisputeRequest {
  transactionId?: string;
  paymentMethod: "card" | "crypto";
  amount: number;
  transactionHash?: string;
  walletAddress?: string;
  paymentDate: string;
  cryptoCurrency?: string;
  description: string;
  email: string;
}

// POST: Submit a dispute
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: DisputeRequest = await request.json();
    const {
      transactionId,
      paymentMethod,
      amount,
      transactionHash,
      walletAddress,
      paymentDate,
      cryptoCurrency,
      description,
      email,
    } = body;

    // Validation
    if (!paymentMethod || !amount || !paymentDate || !description || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (amount <= 0 || amount > 10000) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Check for existing dispute from same user in last 24h
    const existingDispute = await prisma.paymentDispute.findFirst({
      where: {
        userId: session.user.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        status: "PENDING",
      },
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: "You already have a pending dispute. Please wait for it to be reviewed." },
        { status: 429 }
      );
    }

    // Create dispute record
    const dispute = await prisma.paymentDispute.create({
      data: {
        userId: session.user.id,
        transactionId: transactionId || null,
        paymentMethod,
        amount,
        transactionHash: transactionHash || null,
        walletAddress: walletAddress || null,
        paymentDate: new Date(paymentDate),
        cryptoCurrency: cryptoCurrency || null,
        description,
        email,
        status: "PENDING",
      },
    });

    console.log(`[DISPUTE] New dispute ${dispute.id} from user ${session.user.id}: $${amount} via ${paymentMethod}`);

    return NextResponse.json({
      success: true,
      disputeId: dispute.id,
      message: "Your dispute has been submitted. We will review it within 24-48 hours.",
    });
  } catch (error) {
    console.error("Dispute submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit dispute" },
      { status: 500 }
    );
  }
}

// GET: Get user's disputes
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const disputes = await prisma.paymentDispute.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("Dispute fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch disputes" },
      { status: 500 }
    );
  }
}
