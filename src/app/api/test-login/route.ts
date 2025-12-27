import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    console.log("Test login for:", email);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { creatorProfiles: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found", email }, { status: 404 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: "No password set for user", email }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isCreator: user.isCreator,
        creatorSlug: user.creatorProfiles?.[0]?.slug,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
