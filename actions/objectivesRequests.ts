"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole, ObjectivesRequestStatus } from "@prisma/client";
import {
  createObjectivesRequestSchema,
  replyObjectivesRequestSchema,
} from "@/lib/validations/objectivesRequests";

// 1. CREATE OBJECTIVES REQUEST
export async function createObjectivesRequest(trainerId: string, reason: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role !== UserRole.PLAYER && currentUser.role !== UserRole.GOAL_KEEPER) {
      return { success: false, error: "Only players can request objectives" };
    }

    const validation = createObjectivesRequestSchema.safeParse({ trainerId, reason });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    // Verify trainer belongs to player
    const player = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { trainers: { select: { id: true } } },
    });
    const myTrainerIds = player?.trainers.map((t) => t.id) || [];
    if (!myTrainerIds.includes(trainerId)) {
      return { success: false, error: "This trainer does not belong to you" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.objectivesRequest.create({
        data: {
          playerId: currentUser.userId,
          trainerId,
          reason: reason.trim(),
          status: ObjectivesRequestStatus.PENDING,
        },
      });

      await tx.notification.create({
        data: {
          recipientId: trainerId,
          type: "OBJECTIVES_REQUEST_CREATED",
          objectivesRequestId: request.id,
        },
      });

      return request;
    });

    revalidatePath("/questionnaires");
    return { success: true, data: result };
  } catch (error) {
    console.error("Create objectives request error:", error);
    return { success: false, error: "Failed to create objectives request" };
  }
}

// 2. CREATE OBJECTIVES REQUEST FOR ALL TRAINERS
export async function createObjectivesRequestForAllTrainers(reason: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role !== UserRole.PLAYER && currentUser.role !== UserRole.GOAL_KEEPER) {
      return { success: false, error: "Only players can request objectives" };
    }

    // Fetch player's trainers
    const player = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { trainers: { select: { id: true } } },
    });
    const trainerIds = player?.trainers.map((t) => t.id) || [];
    if (trainerIds.length === 0) {
      return { success: false, error: "no_trainers_assigned" };
    }

    // Validate for one of them just to check the reason constraints
    const validation = createObjectivesRequestSchema.safeParse({ trainerId: trainerIds[0], reason });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const result = await prisma.$transaction(async (tx) => {
      const requests = [];
      for (const trainerId of trainerIds) {
        const request = await tx.objectivesRequest.create({
          data: {
            playerId: currentUser.userId,
            trainerId,
            reason: reason.trim(),
            status: ObjectivesRequestStatus.PENDING,
          },
        });

        await tx.notification.create({
          data: {
            recipientId: trainerId,
            type: "OBJECTIVES_REQUEST_CREATED",
            objectivesRequestId: request.id,
          },
        });
        requests.push(request);
      }
      return requests;
    });

    revalidatePath("/questionnaires");
    return { success: true, data: result };
  } catch (error) {
    console.error("Create objectives request for all error:", error);
    return { success: false, error: "Failed to request objectives for all trainers" };
  }
}

// 3. GET OBJECTIVES REQUESTS FOR PLAYER
export async function getObjectivesRequestsForPlayer(playerId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== playerId) {
      return { success: false, error: "Unauthorized" };
    }

    const requests = await prisma.objectivesRequest.findMany({
      where: { playerId },
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
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error("Get player objectives requests error:", error);
    return { success: false, error: "Failed to get objectives requests" };
  }
}

// 4. GET OBJECTIVES REQUESTS FOR TRAINER
export async function getObjectivesRequestsForTrainer() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role !== UserRole.TRAINER && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const [pendingRequests, otherRequests] = await Promise.all([
      prisma.objectivesRequest.findMany({
        where: {
          trainerId: currentUser.userId,
          status: ObjectivesRequestStatus.PENDING,
        },
        include: {
          player: {
            select: {
              id: true,
              name: true,
              surname: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.objectivesRequest.findMany({
        where: {
          trainerId: currentUser.userId,
          status: { not: ObjectivesRequestStatus.PENDING },
        },
        include: {
          player: {
            select: {
              id: true,
              name: true,
              surname: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { success: true, data: [...pendingRequests, ...otherRequests] };
  } catch (error) {
    console.error("Get trainer objectives requests error:", error);
    return { success: false, error: "Failed to get objectives requests" };
  }
}

// 5. REPLY TO OBJECTIVES REQUEST
export async function replyToObjectivesRequest(requestId: string, reply: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validation = replyObjectivesRequestSchema.safeParse({ requestId, reply });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const request = await prisma.objectivesRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    if (request.trainerId !== currentUser.userId && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.objectivesRequest.update({
        where: { id: requestId },
        data: {
          status: ObjectivesRequestStatus.ACKNOWLEDGED,
          trainerReply: reply.trim(),
          repliedAt: new Date(),
        },
      });

      // Delete any previous reply notifications for this request and recipient
      await tx.notification.deleteMany({
        where: {
          recipientId: request.playerId,
          type: "OBJECTIVES_REQUEST_REPLIED",
          objectivesRequestId: requestId,
        },
      });

      await tx.notification.create({
        data: {
          recipientId: request.playerId,
          type: "OBJECTIVES_REQUEST_REPLIED",
          objectivesRequestId: requestId,
        },
      });

      return updated;
    });

    revalidatePath("/questionnaires");
    return { success: true, data: result };
  } catch (error) {
    console.error("Reply to objectives request error:", error);
    return { success: false, error: "Failed to reply to objectives request" };
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
