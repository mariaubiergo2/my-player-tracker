import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get token from httpOnly cookie
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ playerId: payload.userId }, { trainerId: payload.userId }],
      },
      include: {
        _count: {
          select: { feedbackMessages: true },
        },
        feedbackMessages: {
          where: {
            authorRole: {
              in: ["trainer", "admin"],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Get matches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}