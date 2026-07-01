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
      where: { role: UserRole.PLAYER },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        phone: true,
        birthDate: true,
        trainerId: true,
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

    if (player.role !== UserRole.PLAYER) {
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
        role: UserRole.PLAYER,
        trainerId: trainerId,
      },
      include: {
        playerMatches: {
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
      matches: p.playerMatches.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        location: m.location,
        date: m.date,
        startTime: m.startTime,
        endTime: m.endTime,
        opponent: m.opponent,
        matchType: m.matchType,
        status: m.status,
        mark: m.mark,
        intensity: m.intensity,
        attitude: m.attitude,
        performance: m.performance,
        goals: m.goals,
        assists: m.assists,
        minutesPlayed: m.minutesPlayed,
        comment: m.comment,
        trainerFeedback: m.trainerFeedback,
        playerReflection: m.playerReflection,
        strengths: m.strengths,
        weaknesses: m.weaknesses,
        improvementAreas: m.improvementAreas,
        offensiveActionsOwnHalf: m.offensiveActionsOwnHalf,
        offensiveActionsOpponentHalf: m.offensiveActionsOpponentHalf,
        defensiveActionsOwnHalf: m.defensiveActionsOwnHalf,
        defensiveActionsOpponentHalf: m.defensiveActionsOpponentHalf,
        isReviewed: m.isReviewed,
        reviewedAt: m.reviewedAt,
      })),
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
