"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole, QuestionnaireType, QuickResponseType } from "@prisma/client";
import {
  createObjectiveRequestSchema,
  replyObjectiveRequestSchema,
} from "@/lib/validations/objectivesRequests";
import { SECTION_ENABLED, mapSpecialtyToSection } from "@/lib/config/sections";

function specialtyMatchesType(specialty: string | null | undefined, type: QuestionnaireType): boolean {
  if (!specialty) return false;
  if (type === "ANALYSIS_VIDEO" && specialty === "VIDEO_ANALYSIS") return true;
  if (type === "PHYSICAL" && specialty === "PHYSICAL_PREP") return true;
  if (type === "NUTRITION" && specialty === "NUTRITION") return true;
  return false;
}

// 1. CREATE OBJECTIVE REQUEST
export async function createObjectiveRequest(reason: string, type: QuestionnaireType) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role !== UserRole.PLAYER && currentUser.role !== UserRole.GOAL_KEEPER) {
      return { success: false, error: "Only players can request objectives" };
    }

    const validation = createObjectiveRequestSchema.safeParse({ reason, type });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    // Feature Flag Check
    if (SECTION_ENABLED[type] === false) {
      return { success: false, error: "nutrition_blocked" };
    }

    // Fetch player's trainers
    const player = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        trainers: {
          select: {
            id: true,
            trainerSpecialty: true,
          },
        },
      },
    });

    const activeTrainers = (player?.trainers || []).filter((t) =>
      mapSpecialtyToSection(t.trainerSpecialty) === type
    );

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.objectiveRequest.create({
        data: {
          playerId: currentUser.userId,
          type,
          reason: reason.trim(),
          reviewed: false,
        },
      });

      if (activeTrainers.length > 0) {
        // Notify all active trainers for this section
        for (const trainer of activeTrainers) {
          await tx.notification.create({
            data: {
              recipientId: trainer.id,
              type: "OBJECTIVES_REQUEST_CREATED",
              objectiveRequestId: request.id,
            },
          });
        }
      } else {
        // Find all admins in the system
        const admins = await tx.user.findMany({
          where: { role: UserRole.ADMIN },
          select: { id: true },
        });

        // Notify all admins using OBJECTIVE_REQUEST_NO_TRAINER_AVAILABLE
        for (const admin of admins) {
          await tx.notification.create({
            data: {
              recipientId: admin.id,
              type: "OBJECTIVE_REQUEST_NO_TRAINER_AVAILABLE",
              objectiveRequestId: request.id,
            },
          });
        }
      }

      return request;
    });

    revalidatePath("/questionnaires");
    return { success: true, data: result };
  } catch (error) {
    console.error("Create objective request error:", error);
    return { success: false, error: "Failed to create objective request" };
  }
}

// 2. REPLY TO OBJECTIVE REQUEST
export async function replyToObjectiveRequest(requestId: string, quickResponseType: QuickResponseType) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role !== UserRole.TRAINER && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const validation = replyObjectiveRequestSchema.safeParse({ requestId, quickResponseType });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const request = await prisma.objectiveRequest.findUnique({
      where: { id: requestId },
      select: { playerId: true, type: true },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    // Verify trainer is active trainer for the player and type
    const player = await prisma.user.findUnique({
      where: { id: request.playerId },
      select: {
        trainers: {
          select: {
            id: true,
            trainerSpecialty: true,
          },
        },
      },
    });

    const isAssigned = (player?.trainers || []).some(
      (t) => t.id === currentUser.userId && specialtyMatchesType(t.trainerSpecialty, request.type)
    );

    if (!isAssigned && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized: You are not assigned to this player for this section" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const response = await tx.objectiveRequestResponse.create({
        data: {
          requestId,
          trainerId: currentUser.userId,
          quickResponseType,
        },
      });

      // Delete any previous reply notifications for this request and recipient
      await tx.notification.deleteMany({
        where: {
          recipientId: request.playerId,
          type: "OBJECTIVES_REQUEST_REPLIED",
          objectiveRequestId: requestId,
        },
      });

      // Create new notification for the player
      await tx.notification.create({
        data: {
          recipientId: request.playerId,
          type: "OBJECTIVES_REQUEST_REPLIED",
          objectiveRequestId: requestId,
        },
      });

      return response;
    });

    revalidatePath("/questionnaires");
    return { success: true, data: result };
  } catch (error) {
    console.error("Reply to objective request error:", error);
    return { success: false, error: "Failed to reply to objective request" };
  }
}

// 3. MARK OBJECTIVE REQUEST AS REVIEWED
export async function markObjectiveRequestAsReviewed(requestId: string, reviewed: boolean) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role !== UserRole.TRAINER && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const request = await prisma.objectiveRequest.findUnique({
      where: { id: requestId },
      select: { playerId: true, type: true },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    // Verify trainer has access to this player
    const player = await prisma.user.findUnique({
      where: { id: request.playerId },
      select: {
        trainers: {
          select: {
            id: true,
            trainerSpecialty: true,
          },
        },
      },
    });

    const isAssigned = (player?.trainers || []).some(
      (t) => t.id === currentUser.userId && specialtyMatchesType(t.trainerSpecialty, request.type)
    );

    if (!isAssigned && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await prisma.objectiveRequest.update({
      where: { id: requestId },
      data: { reviewed },
    });

    revalidatePath("/questionnaires");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Mark objective request as reviewed error:", error);
    return { success: false, error: "Failed to update review status" };
  }
}

// 4. GET OBJECTIVES REQUESTS FOR PLAYER
export async function getObjectivesRequestsForPlayer(playerId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== playerId) {
      return { success: false, error: "Unauthorized" };
    }

    const requests = await prisma.objectiveRequest.findMany({
      where: { playerId },
      include: {
        responses: {
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error("Get player objective requests error:", error);
    return { success: false, error: "Failed to get objective requests" };
  }
}

// 5. GET OBJECTIVES REQUESTS FOR TRAINER
export async function getObjectivesRequestsForTrainer() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role !== UserRole.TRAINER && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const trainer = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { trainerSpecialty: true },
    });

    if (!trainer || !trainer.trainerSpecialty) {
      return { success: true, data: [] };
    }

    let targetType: QuestionnaireType = "ANALYSIS_VIDEO";
    if (trainer.trainerSpecialty === "PHYSICAL_PREP") targetType = "PHYSICAL";
    if (trainer.trainerSpecialty === "NUTRITION") targetType = "NUTRITION";

    const requests = await prisma.objectiveRequest.findMany({
      where: {
        type: targetType,
        player: {
          trainers: {
            some: { id: currentUser.userId },
          },
        },
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatarUrl: true,
            playerObjectivesReceived: {
              where: {
                trainerId: currentUser.userId,
                category: targetType,
              },
              orderBy: { effectiveFrom: "desc" },
              take: 1,
            },
          },
        },
        responses: {
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error("Get trainer objective requests error:", error);
    return { success: false, error: "Failed to get objective requests" };
  }
}

// 6. GET TRAINERS FOR PLAYER
export async function getPlayerTrainers(playerId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== playerId) {
      return { success: false, error: "Unauthorized" };
    }

    const player = await prisma.user.findUnique({
      where: { id: playerId },
      select: {
        trainers: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatarUrl: true,
            trainerSpecialty: true,
          },
        },
      },
    });

    return { success: true, trainers: player?.trainers || [] };
  } catch (error) {
    console.error("Get player trainers error:", error);
    return { success: false, error: "Failed to get trainers" };
  }
}
