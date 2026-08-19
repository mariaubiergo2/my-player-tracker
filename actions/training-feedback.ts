"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { trainingFeedbackSchema } from "@/lib/validations/training";
import { canSubmitTrainingFeedback } from "@/lib/permissions";

async function checkTrainerOrAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }
  const isTrainer = currentUser.role === UserRole.TRAINER;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  if (!isTrainer && !isAdmin) {
    throw new Error("Only trainers or admins can perform this action");
  }
  return currentUser;
}

export async function submitTrainingFeedback(formData: any) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validation = trainingFeedbackSchema.safeParse(formData);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { sessionId, assignmentId, comment, videoUrl } = validation.data;

    if (!sessionId && !assignmentId) {
      return { success: false, error: "S'ha de proporcionar una sessió o una assignació de pla" };
    }

    let trainerId = "";

    // Resolve trainerId
    if (sessionId) {
      const session = await prisma.trainingSession.findUnique({
        where: { id: sessionId },
        include: { trainingPlan: true },
      });
      if (!session) {
        return { success: false, error: "Session not found" };
      }
      trainerId = session.trainingPlan.trainerId;
    } else if (assignmentId) {
      const assignment = await prisma.trainingPlanAssignment.findUnique({
        where: { id: assignmentId },
        include: { trainingPlan: true },
      });
      if (!assignment) {
        return { success: false, error: "Assignment not found" };
      }
      trainerId = assignment.trainingPlan.trainerId;
    }

    const feedback = await prisma.trainingFeedback.create({
      data: {
        playerId: currentUser.userId,
        sessionId: sessionId || null,
        assignmentId: assignmentId || null,
        comment,
        videoUrl: videoUrl || null,
        isReviewed: false,
      },
    });

    // Send notification to trainer
    await prisma.notification.create({
      data: {
        recipientId: trainerId,
        type: sessionId ? "SESSION_FEEDBACK_RECEIVED" : "PLAN_FEEDBACK_RECEIVED",
        trainingFeedbackId: feedback.id,
        trainingPlanAssignmentId: assignmentId || null,
      },
    });

    revalidatePath("/dashboard/physical");
    revalidatePath("/trainer/training-feedback");

    return { success: true, data: feedback };
  } catch (error) {
    console.error("submitTrainingFeedback error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to submit feedback" };
  }
}

export async function getTrainerFeedbackInbox() {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const whereClause: any = {};
    if (currentUser.role !== UserRole.ADMIN) {
      whereClause.OR = [
        {
          session: {
            trainingPlan: {
              trainerId: currentUser.userId,
            },
          },
        },
        {
          assignment: {
            trainingPlan: {
              trainerId: currentUser.userId,
            },
          },
        },
      ];
    }

    const feedbacks = await prisma.trainingFeedback.findMany({
      where: whereClause,
      include: {
        player: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        session: {
          include: {
            trainingPlan: true,
          },
        },
        assignment: {
          include: {
            trainingPlan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: feedbacks };
  } catch (error) {
    console.error("getTrainerFeedbackInbox error:", error);
    return { success: false, error: "Failed to load feedback inbox" };
  }
}

export async function reviewFeedback(feedbackId: string) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const feedback = await prisma.trainingFeedback.findUnique({
      where: { id: feedbackId },
      include: {
        session: { include: { trainingPlan: true } },
        assignment: { include: { trainingPlan: true } },
      },
    });

    if (!feedback) {
      return { success: false, error: "Feedback not found" };
    }

    const trainerId = feedback.session?.trainingPlan.trainerId || feedback.assignment?.trainingPlan.trainerId;

    if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== trainerId) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await prisma.trainingFeedback.update({
      where: { id: feedbackId },
      data: {
        isReviewed: true,
        reviewedAt: new Date(),
      },
    });

    revalidatePath("/trainer/training-feedback");
    revalidatePath("/dashboard/physical");

    return { success: true, data: updated };
  } catch (error) {
    console.error("reviewFeedback error:", error);
    return { success: false, error: "Failed to review feedback" };
  }
}
