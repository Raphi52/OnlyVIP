import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");
    const orderId = searchParams.get("orderId");

    if (!paymentId && !orderId) {
      return NextResponse.json(
        { error: "paymentId or orderId required" },
        { status: 400 }
      );
    }

    let payment;

    if (paymentId) {
      payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          userId: session.user.id,
          provider: "PAYGATE",
        },
      });
    } else if (orderId) {
      payment = await prisma.payment.findFirst({
        where: {
          userId: session.user.id,
          provider: "PAYGATE",
          metadata: {
            contains: orderId,
          },
        },
      });
    }

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const metadata = JSON.parse(payment.metadata as string || "{}");

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status.toLowerCase(),
      amount: payment.amount,
      currency: payment.currency,
      type: metadata.type,
      credits: metadata.credits,
      createdAt: metadata.createdAt,
      completedAt: metadata.completedAt,
      txid: metadata.txid,
    });

  } catch (error) {
    console.error("PayGate status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
