"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole, AssignmentStatus } from "@prisma/client";

// Helper helper to verify if trainer owns player or user is admin/self
async function checkAccess(playerId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { authorized: false, currentUser: null };
  }

  if (currentUser.role === UserRole.ADMIN || currentUser.userId === playerId) {
    return { authorized: true, currentUser };
  }

  // Check if current user is a trainer of the player
  const playerTrainers = await prisma.user.findUnique({
    where: { id: playerId },
    select: { trainers: { select: { id: true } } },
  });
  const isTrainer = playerTrainers?.trainers.some((t) => t.id === currentUser.userId) || false;

  return { authorized: isTrainer, currentUser };
}

// 1. DEFINE OBJECTIVES
export async function defineObjectives(playerId: string, summary: string, items: string[]) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role !== UserRole.TRAINER) {
      return { success: false, error: "Only trainers can define objectives" };
    }

    // Verify player belongs to trainer
    const trainer = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { players: { select: { id: true } } },
    });
    const myPlayerIds = trainer?.players.map((p) => p.id) || [];
    if (!myPlayerIds.includes(playerId)) {
      return { success: false, error: "This player does not belong to you" };
    }

    if (!summary || summary.trim() === "") {
      return { success: false, error: "Summary is required" };
    }

    const cleanedItems = items.map((i) => i.trim()).filter((i) => i !== "");
    if (cleanedItems.length === 0) {
      return { success: false, error: "At least one objective item is required" };
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Find active objectives and close them (set effectiveTo = now)
      const activeObjective = await tx.playerObjectives.findFirst({
        where: {
          playerId,
          effectiveTo: null,
        },
      });

      if (activeObjective) {
        await tx.playerObjectives.update({
          where: { id: activeObjective.id },
          data: { effectiveTo: now },
        });
      }

      // Create new objectives
      return await tx.playerObjectives.create({
        data: {
          playerId,
          trainerId: currentUser.userId,
          summary: summary.trim(),
          items: cleanedItems,
          effectiveFrom: now,
          effectiveTo: null,
        },
      });
    });

    revalidatePath("/questionnaires");
    revalidatePath(`/questionnaires/objectives/${playerId}`);
    return { success: true, data: result };
  } catch (error) {
    console.error("Define objectives error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to define objectives" };
  }
}

// 2. GET ACTIVE OBJECTIVES
export async function getActiveObjectives(playerId: string) {
  try {
    const { authorized } = await checkAccess(playerId);
    if (!authorized) {
      return { success: false, error: "Unauthorized" };
    }

    const activeObjective = await prisma.playerObjectives.findFirst({
      where: {
        playerId,
        effectiveTo: null,
      },
    });

    return { success: true, data: activeObjective };
  } catch (error) {
    console.error("Get active objectives error:", error);
    return { success: false, error: "Failed to get active objectives" };
  }
}

// 3. GET OBJECTIVES HISTORY
export async function getObjectivesHistory(playerId: string) {
  try {
    const { authorized } = await checkAccess(playerId);
    if (!authorized) {
      return { success: false, error: "Unauthorized" };
    }

    const player = await prisma.user.findUnique({
      where: { id: playerId },
      select: { name: true, surname: true },
    });

    const history = await prisma.playerObjectives.findMany({
      where: { playerId },
      orderBy: { effectiveFrom: "desc" },
    });

    return { success: true, data: { history, player } };
  } catch (error) {
    console.error("Get objectives history error:", error);
    return { success: false, error: "Failed to get objectives history" };
  }
}

// 4. GET EFFECTIVE OBJECTIVES AT A SPECIFIC DATE (for Match detail)
export async function getEffectiveObjectivesAt(playerId: string, date: Date | string) {
  try {
    const { authorized } = await checkAccess(playerId);
    if (!authorized) {
      return { success: false, error: "Unauthorized" };
    }

    const targetDate = new Date(date);

    const objective = await prisma.playerObjectives.findFirst({
      where: {
        playerId,
        effectiveFrom: {
          lte: targetDate,
        },
        OR: [
          { effectiveTo: null },
          {
            effectiveTo: {
              gt: targetDate,
            },
          },
        ],
      },
      orderBy: {
        effectiveFrom: "desc",
      },
    });

    return { success: true, data: objective };
  } catch (error) {
    console.error("Get effective objectives error:", error);
    return { success: false, error: "Failed to get effective objectives" };
  }
}

// 5. GET PLAYERS FOR TRAINER WITH THEIR OBJECTIVES & COMPLETED ASSIGNMENTS
export async function getTrainerPlayersObjectivesData() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role !== UserRole.TRAINER && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const players = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.PLAYER, UserRole.GOAL_KEEPER] },
        trainers: {
          some: { id: currentUser.userId },
        },
      },
      select: {
        id: true,
        name: true,
        surname: true,
        avatarUrl: true,
        playerAssignments: {
          where: {
            status: AssignmentStatus.COMPLETED,
            questionnaire: {
              trainerId: currentUser.userId,
            },
          },
          select: {
            id: true,
            respondedAt: true,
            questionnaire: {
              select: {
                title: true,
              },
            },
          },
          orderBy: { respondedAt: "desc" },
        },
        playerObjectivesReceived: {
          where: {
            trainerId: currentUser.userId,
            effectiveTo: null,
          },
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, players };
  } catch (error) {
    console.error("Get trainer players objectives data error:", error);
    return { success: false, error: "Failed to get players objectives data" };
  }
}
