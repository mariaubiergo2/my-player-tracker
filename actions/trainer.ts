"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * Checks if the current request is initiated by a verified Trainer user
 */
async function checkTrainer(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    throw new Error("Unauthenticated: No active session found.");
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new Error("Unauthorized: Invalid session token.");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== UserRole.TRAINER) {
    throw new Error("Forbidden: This action requires Trainer privileges.");
  }

  return payload.userId;
}

/**
 * READ: Fetch all players with the count of matches they've played
 */
export async function getAllPlayersWithMatchCount() {
  try {
    await checkTrainer();

    const players = await prisma.user.findMany({
      where: { role: { in: [UserRole.PLAYER, UserRole.GOAL_KEEPER] } },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        phone: true,
        birthDate: true,
        trainerId: true,
        avatarUrl: true,
        _count: {
          select: {
            playerMatches: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const mappedPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      surname: p.surname,
      email: p.email,
      phone: p.phone,
      birthDate: p.birthDate ? new Date(p.birthDate).toISOString().split("T")[0] : null,
      trainerId: p.trainerId,
      avatarUrl: p.avatarUrl,
      matchCount: p._count.playerMatches,
    }));

    return { success: true, players: mappedPlayers };
  } catch (error) {
    console.error("getAllPlayersWithMatchCount error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load players list",
    };
  }
}

/**
 * UPDATE: Assign a player to the logged-in trainer
 */
export async function assignPlayerToTrainer(playerId: string) {
  try {
    const trainerId = await checkTrainer();

    // Check if player exists and is a player
    const player = await prisma.user.findUnique({
      where: { id: playerId },
      select: { role: true },
    });

    if (!player) {
      return { success: false, error: "Player not found." };
    }

    if (player.role !== UserRole.PLAYER && player.role !== UserRole.GOAL_KEEPER) {
      return { success: false, error: "User is not registered as a Player." };
    }

    await prisma.user.update({
      where: { id: playerId },
      data: { trainerId },
    });

    revalidatePath("/trainer/players");
    revalidatePath("/trainer/my-players");

    return { success: true };
  } catch (error) {
    console.error("assignPlayerToTrainer error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign player",
    };
  }
}

/**
 * READ: Return logged-in trainer's players with full match details
 */
export async function getMyPlayersWithMatches() {
  try {
    const trainerId = await checkTrainer();

    const players = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.PLAYER, UserRole.GOAL_KEEPER] },
        trainerId: trainerId,
      },
      include: {
        playerMatches: {
          include: {
            _count: {
              select: { feedbackMessages: true },
            },
          },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const mappedPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      surname: p.surname,
      email: p.email,
      phone: p.phone,
      birthDate: p.birthDate ? new Date(p.birthDate).toISOString().split("T")[0] : null,
      avatarUrl: p.avatarUrl,
      matches: p.playerMatches,
    }));

    return { success: true, players: mappedPlayers };
  } catch (error) {
    console.error("getMyPlayersWithMatches error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load your players list",
    };
  }
}
