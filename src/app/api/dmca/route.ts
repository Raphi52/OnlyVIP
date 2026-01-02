import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

// POST /api/dmca - Submit DMCA takedown notice
export async function POST(request: NextRequest) {
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  try {
    const body = await request.json();
    const {
      name,
      email,
      company,
      contentUrl,
      originalUrl,
      description,
      signature,
      goodFaith,
      accuracy,
      authorization,
    } = body;

    // Validate required fields
    if (!name || !email || !contentUrl || !originalUrl || !description || !signature) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    if (!goodFaith || !accuracy || !authorization) {
      return NextResponse.json(
        { error: "All declarations must be acknowledged" },
        { status: 400 }
      );
    }

    // Store the DMCA notice in database
    const dmcaNotice = await prisma.dMCANotice.create({
      data: {
        name,
        email,
        company: company || null,
        contentUrl,
        originalUrl,
        description,
        signature,
        status: "PENDING",
      },
    });

    // Send notification email to admin
    try {
      if (resend) await resend.emails.send({
        from: process.env.EMAIL_FROM || "VipOnly <noreply@viponly.fun>",
        to: "legal@viponly.fun",
        subject: `[DMCA Notice] New takedown request from ${name}`,
        html: `
          <h2>New DMCA Takedown Notice</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          ${company ? `<p><strong>Company:</strong> ${company}</p>` : ""}
          <p><strong>Infringing URL:</strong> <a href="${contentUrl}">${contentUrl}</a></p>
          <p><strong>Original Work:</strong> <a href="${originalUrl}">${originalUrl}</a></p>
          <p><strong>Description:</strong></p>
          <p>${description}</p>
          <p><strong>Electronic Signature:</strong> ${signature}</p>
          <hr>
          <p><strong>Declarations confirmed:</strong></p>
          <ul>
            <li>Good faith belief: ${goodFaith ? "Yes" : "No"}</li>
            <li>Accuracy under perjury: ${accuracy ? "Yes" : "No"}</li>
            <li>Authorization: ${authorization ? "Yes" : "No"}</li>
          </ul>
          <hr>
          <p><strong>Notice ID:</strong> ${dmcaNotice.id}</p>
          <p><strong>Submitted:</strong> ${new Date().toISOString()}</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send DMCA notification email:", emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation to reporter
    try {
      if (resend) await resend.emails.send({
        from: process.env.EMAIL_FROM || "VipOnly <noreply@viponly.fun>",
        to: email,
        subject: "DMCA Notice Received - VipOnly",
        html: `
          <h2>DMCA Notice Received</h2>
          <p>Dear ${name},</p>
          <p>We have received your DMCA takedown notice and are reviewing it. Our team will investigate within 24-48 business hours.</p>
          <p><strong>Reference Number:</strong> ${dmcaNotice.id}</p>
          <p><strong>Content URL:</strong> ${contentUrl}</p>
          <p>If we need any additional information, we will contact you at this email address.</p>
          <p>Thank you for helping us protect intellectual property rights.</p>
          <p>Best regards,<br>VipOnly Legal Team</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send DMCA confirmation email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "DMCA notice submitted successfully",
      referenceId: dmcaNotice.id,
    });
  } catch (error) {
    console.error("DMCA submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit DMCA notice" },
      { status: 500 }
    );
  }
}
