// actions/feedback.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { getFeedbackMessagesSchema, createFeedbackMessageSchema } from "@/lib/validations/feedback"

export async function getFeedbackMessages(matchId: string) {
  try {
    const validation = getFeedbackMessagesSchema.safeParse({ matchId });
    if (!validation.success) {
      return { success: false, error: "Invalid parameters" }
    }
    const validatedData = validation.data;

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "Unauthorized" }
    }

    const match = await prisma.match.findUnique({
      where: { id: validatedData.matchId },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            avatarUrl: true,
            trainers: { select: { id: true } },
          },
        },
        trainer: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (!match) {
      return { success: false, error: "Match not found" }
    }

    // Authorization check
    const isPlayer = match.playerId === currentUser.userId
    const isTrainer =
      match.trainerId === currentUser.userId ||
      (match.player?.trainers && match.player.trainers.some((t: { id: string }) => t.id === currentUser.userId));
    const isAdmin = currentUser.role === "ADMIN"

    if (!isPlayer && !isTrainer && !isAdmin) {
      return { success: false, error: "Unauthorized to view this feedback thread" }
    }

    const messages = await prisma.matchFeedbackMessage.findMany({
      where: { matchId: validatedData.matchId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            name: true,
            surname: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Ensure trainer cannot see player's email
    if (currentUser.role === "TRAINER") {
      if (match.player) {
        (match.player as any).email = "";
      }
      messages.forEach((msg) => {
        if (
          msg.author &&
          (msg.authorRole.toLowerCase() === "player" ||
            msg.authorRole.toLowerCase() === "goal_keeper")
        ) {
          (msg.author as any).email = "";
        }
      });
    }

    return {
      success: true,
      messages,
      matchName: match.name,
      matchPlayer: match.player,
      matchTrainer: match.trainer,
      currentUserEmail: currentUser.email,
      currentUserName: currentUser.name,
    };
  } catch (error) {
    console.error("Get feedback messages error:", error)
    return { success: false, error: "Failed to load feedback messages" }
  }
}

export async function createFeedbackMessage(matchId: string, content: string) {
  try {
    const validation = createFeedbackMessageSchema.safeParse({ matchId, content });
    if (!validation.success) {
      return { success: false, error: "Message content cannot be empty" }
    }
    const validatedData = validation.data;

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "Unauthorized" }
    }

    const match = await prisma.match.findUnique({
      where: { id: validatedData.matchId },
      include: {
        player: {
          include: {
            trainers: true,
          },
        },
      },
    })

    if (!match) {
      return { success: false, error: "Match not found" }
    }

    // Permission and role mapping
    const isPlayer = match.playerId === currentUser.userId
    const isTrainer =
      match.trainerId === currentUser.userId ||
      (match.player?.trainers && match.player.trainers.some((t: { id: string }) => t.id === currentUser.userId));
    const isAdmin = currentUser.role === "ADMIN"

    if (!isPlayer && !isTrainer && !isAdmin) {
      return { success: false, error: "Unauthorized to send feedback for this match" }
    }

    // Set author role (lowercase to match user prompt requirement)
    let authorRole = currentUser.role.toLowerCase() // "player", "trainer", "admin"

    // If an Admin is writing, we can classify them as a trainer or admin
    // User requested "player" and "trainer" roles
    if (isAdmin) {
      authorRole = "admin"
    }

    const newMessage = await prisma.matchFeedbackMessage.create({
      data: {
        matchId: validatedData.matchId,
        authorId: currentUser.userId,
        authorRole,
        content: validatedData.content.trim(),
      },
      include: {
        author: {
          select: {
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Notify recipient of new feedback message
    const isAuthorPlayer = currentUser.role === "PLAYER" || currentUser.role === "GOAL_KEEPER";
    const isAuthorTrainer = currentUser.role === "TRAINER";

    if (isAuthorPlayer && match.player?.trainers) {
      const trainersToNotify = match.player.trainers.map((t: { id: string }) => t.id);
      if (match.trainerId && !trainersToNotify.includes(match.trainerId)) {
        trainersToNotify.push(match.trainerId);
      }
      for (const tId of trainersToNotify) {
        if (tId !== currentUser.userId) {
          await prisma.notification.create({
            data: {
              recipientId: tId,
              type: "FEEDBACK_MESSAGE_FROM_PLAYER",
              matchId: match.id,
            },
          });
        }
      }
    } else if (isAuthorTrainer) {
      const recipientId = match.playerId;
      if (recipientId && recipientId !== currentUser.userId) {
        await prisma.notification.create({
          data: {
            recipientId,
            type: "FEEDBACK_MESSAGE_FROM_TRAINER",
            matchId: match.id,
          },
        });
      }
    }

    // Revalidate paths
    revalidatePath("/dashboard")
    revalidatePath(`/matches/${matchId}`)
    revalidatePath(`/matches/${matchId}/edit`)
    revalidatePath(`/matches/${matchId}/edit-feedback`)

    return { success: true, message: newMessage }
  } catch (error) {
    console.error("Create feedback message error:", error)
    return { success: false, error: "Failed to send feedback message" }
  }
}
