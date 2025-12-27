import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransaction, mapGuardarianStatus } from "@/lib/guardarian";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID required" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (payment.status === "COMPLETED" || payment.status === "FAILED") {
      return NextResponse.json({
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
      });
    }

    // Check with Guardarian
    if (payment.providerTxId && payment.provider === "GUARDARIAN") {
      const transaction = await getTransaction(payment.providerTxId);

      if (transaction) {
        const newStatus = mapGuardarianStatus(transaction.status);

        if (newStatus !== payment.status) {
          await prisma.payment.update({
            where: { id: paymentId },
            data: { status: newStatus },
          });
        }

        return NextResponse.json({
          paymentId: payment.id,
          status: newStatus,
          amount: payment.amount,
          currency: payment.currency,
          cryptoAmount: transaction.to_amount,
          cryptoCurrency: transaction.to_currency,
        });
      }
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    });
  } catch (error) {
    console.error("Fiat status error:", error);
    return NextResponse.json(
      { error: "Failed to get payment status" },
      { status: 500 }
    );
  }
}
