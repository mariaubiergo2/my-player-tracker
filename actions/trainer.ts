"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { UserRole, QuestionnaireType } from "@prisma/client";
import { mapSpecialtyToSection } from "@/lib/config/sections";

/**
 * Checks if the current request is initiated by a verified Trainer user
 */
async function checkTrainer(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    throw new Error("Unauthenticated: No active session found.");
  }

  const payload = await verifyToken(token);
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
        birthDate: true,
        trainers: { select: { id: true, name: true, surname: true } },
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
      birthDate: p.birthDate ? new Date(p.birthDate).toISOString().split("T")[0] : null,
      trainers: p.trainers,
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
 * Core assignment update logic (shared between Trainer self-service and Admin)
 */
export async function updateTrainerPlayersRelationShared(
  trainerId: string,
  toConnect: string[],
  toDisconnect: string[]
) {
  // Validate players to connect
  if (toConnect.length > 0) {
    const players = await prisma.user.findMany({
      where: { id: { in: toConnect } },
      select: { id: true, role: true }
    });
    for (const player of players) {
      if (player.role !== UserRole.PLAYER && player.role !== UserRole.GOAL_KEEPER) {
        throw new Error(`User ${player.id} is not registered as a Player or Goal Keeper.`);
      }
    }
  }

  const updatedTrainer = await prisma.user.update({
    where: { id: trainerId },
    data: {
      players: {
        connect: toConnect.map(id => ({ id })),
        disconnect: toDisconnect.map(id => ({ id })),
      }
    },
    select: {
      id: true,
      trainerSpecialty: true
    }
  });

  if (toConnect.length > 0 && updatedTrainer.trainerSpecialty) {
    const category = mapSpecialtyToSection(updatedTrainer.trainerSpecialty);
    if (category) {
      const pendingRequests = await prisma.objectiveRequest.findMany({
        where: {
          playerId: { in: toConnect },
          type: category,
          reviewed: false,
          responses: {
            none: {}
          }
        },
        select: { id: true }
      });

      for (const req of pendingRequests) {
        const existingNotif = await prisma.notification.findFirst({
          where: {
            recipientId: trainerId,
            type: "OBJECTIVES_REQUEST_CREATED",
            objectiveRequestId: req.id
          }
        });
        if (!existingNotif) {
          await prisma.notification.create({
            data: {
              recipientId: trainerId,
              type: "OBJECTIVES_REQUEST_CREATED",
              objectiveRequestId: req.id
            }
          });
        }
      }
    }
  }

  return updatedTrainer;
}

export async function connectPlayerToTrainerShared(trainerId: string, playerId: string) {
  return updateTrainerPlayersRelationShared(trainerId, [playerId], []);
}

export async function disconnectPlayerFromTrainerShared(trainerId: string, playerId: string) {
  return updateTrainerPlayersRelationShared(trainerId, [], [playerId]);
}

/**
 * UPDATE: Assign a player to the logged-in trainer
 */
export async function assignPlayerToTrainer(playerId: string) {
  try {
    const trainerId = await checkTrainer();
    await connectPlayerToTrainerShared(trainerId, playerId);

    revalidatePath("/trainer/players");
    revalidatePath("/trainer/players/assign");
    revalidatePath("/trainer/players/my-players");
    revalidatePath("/trainer/video-analysis/feedback");
    revalidatePath("/trainer/video-analysis/matches");

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
        trainers: {
          some: {
            id: trainerId,
          },
        },
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
      birthDate: p.birthDate
        ? `${p.birthDate.getUTCFullYear()}-${String(p.birthDate.getUTCMonth() + 1).padStart(2, "0")}-${String(p.birthDate.getUTCDate()).padStart(2, "0")}`
        : null,
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

/**
 * UPDATE: Unassign a player from the logged-in trainer
 */
export async function unassignPlayerFromTrainer(playerId: string) {
  try {
    const trainerId = await checkTrainer();

    // Check if player exists and is currently assigned to this trainer
    const player = await prisma.user.findFirst({
      where: {
        id: playerId,
        trainers: {
          some: {
            id: trainerId,
          },
        },
      },
    });

    if (!player) {
      return { success: false, error: "Player not found or not assigned to you." };
    }

    await disconnectPlayerFromTrainerShared(trainerId, playerId);

    revalidatePath("/trainer/players");
    revalidatePath("/trainer/players/assign");
    revalidatePath("/trainer/players/my-players");
    revalidatePath("/trainer/video-analysis/feedback");
    revalidatePath("/trainer/video-analysis/matches");

    return { success: true };
  } catch (error) {
    console.error("unassignPlayerFromTrainer error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unassign player",
    };
  }
}

/**
 * READ: Get stats for the trainer players dashboard landing page
 */
export async function getPlayerDashboardStats() {
  try {
    const trainerId = await checkTrainer();

    const ownPlayersCount = await prisma.user.count({
      where: {
        role: { in: [UserRole.PLAYER, UserRole.GOAL_KEEPER] },
        trainers: {
          some: {
            id: trainerId,
          },
        },
      },
    });

    const totalPlayersCount = await prisma.user.count({
      where: {
        role: { in: [UserRole.PLAYER, UserRole.GOAL_KEEPER] },
      },
    });

    return {
      success: true,
      stats: {
        ownPlayersCount,
        totalPlayersCount,
      },
    };
  } catch (error) {
    console.error("getPlayerDashboardStats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load players dashboard stats",
    };
  }
}

/**
 * READ: Get stats for the trainer video analysis dashboard landing page
 */
export async function getVideoAnalysisStats() {
  try {
    const trainerId = await checkTrainer();

    const [pendingReviewsCount, totalMatchesCount] = await Promise.all([
      prisma.match.count({
        where: {
          isReviewed: false,
          player: {
            trainers: {
              some: {
                id: trainerId,
              },
            },
          },
        },
      }),
      prisma.match.count({
        where: {
          player: {
            trainers: {
              some: {
                id: trainerId,
              },
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        pendingReviewsCount,
        totalMatchesCount,
      },
    };
  } catch (error) {
    console.error("getVideoAnalysisStats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load video analysis stats",
    };
  }
}

/**
 * READ: Return logged-in trainer's assigned players' matches, flattened and sorted
 */
export async function getAssignedPlayersMatches() {
  try {
    const trainerId = await checkTrainer();

    const players = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.PLAYER, UserRole.GOAL_KEEPER] },
        trainers: {
          some: {
            id: trainerId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        surname: true,
        avatarUrl: true,
        playerMatches: {
          include: {
            _count: {
              select: { feedbackMessages: true },
            },
          },
        },
      },
    });

    // Flatten matches and attach player info to each match
    const allMatches: any[] = [];
    for (const player of players) {
      for (const match of player.playerMatches) {
        allMatches.push({
          ...match,
          player: {
            id: player.id,
            name: player.name,
            surname: player.surname,
            avatarUrl: player.avatarUrl,
          },
        });
      }
    }

    // Sort matches: isReviewed === false first, then by date descending
    allMatches.sort((a, b) => {
      if (a.isReviewed !== b.isReviewed) {
        return a.isReviewed ? 1 : -1;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return {
      success: true,
      matches: allMatches,
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        surname: p.surname,
        avatarUrl: p.avatarUrl,
      })),
    };
  } catch (error) {
    console.error("getAssignedPlayersMatches error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load matches list",
    };
  }
}

