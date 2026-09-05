import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { generateAndSendVerificationCode } from "@/actions/email-verification";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, surname } = body;

    // Validate input
    if (!email || !password || !name || !surname) {
      return NextResponse.json(
        { error: "Email, password, name, and surname are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const emailClean = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailClean },
    });

    if (existingUser) {
      // Return generic success response to avoid user enumeration
      return NextResponse.json(
        {
          message: "Registration successful. If the email is valid, you will receive a code.",
          userId: "dummy-" + crypto.randomUUID(),
          email: emailClean,
        },
        { status: 201 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and generate code inside a single Prisma transaction (rollback if email fails)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: emailClean,
          password: hashedPassword,
          name: name.trim(),
          surname: surname.trim(),
        },
      });

      // Find all admins
      const admins = await tx.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      // Create a PLAYER_UNASSIGNED notification for each admin
      for (const admin of admins) {
        await tx.notification.create({
          data: {
            recipientId: admin.id,
            type: "PLAYER_UNASSIGNED",
            unassignedPlayerId: user.id,
          },
        });
      }

      // This will fail if Resend fails, rolling back the transaction
      await generateAndSendVerificationCode(user.id, tx);

      return user;
    });

    return NextResponse.json(
      {
        message: "Registration successful. If the email is valid, you will receive a code.",
        userId: result.id,
        email: result.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}