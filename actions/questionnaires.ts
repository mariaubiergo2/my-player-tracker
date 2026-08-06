"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { QuestionnaireStatus, AssignmentStatus, QuestionType, UserRole } from "@prisma/client";

/**
 * Verification helper for security checks
 */
async function checkAuth() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthenticated");
  }

  // Verify that the user actually exists in the database.
  // This prevents P2003 foreign key constraint errors if the database is reset/migrated but the browser cookie remains.
  const dbUser = await prisma.user.findUnique({
    where: { id: currentUser.userId },
  });

  if (!dbUser) {
    throw new Error("User session expired or database reset. Please log out and log in again.");
  }

  return currentUser;
}

/**
 * 1. CREATE: Create a new Questionnaire template (defaults to DRAFT)
 */
export async function createQuestionnaire(data: {
  title: string;
  description?: string;
  questions: {
    text: string;
    type: "MULTIPLE_CHOICE" | "OPEN";
    options: string[];
  }[];
}) {
  try {
    const user = await checkAuth();
    if (user.role !== UserRole.TRAINER) {
      return { success: false, error: "Only trainers can create questionnaires" };
    }

    if (!data.title.trim()) {
      return { success: false, error: "Title is required" };
    }

    if (data.questions.length === 0) {
      return { success: false, error: "At least one question is required" };
    }

    // Validate questions
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!q.text.trim()) {
        return { success: false, error: `Question #${i + 1} text is empty` };
      }
      if (q.type === "MULTIPLE_CHOICE" && q.options.filter((o) => o.trim()).length < 2) {
        return { success: false, error: `Multiple choice question #${i + 1} requires at least 2 options` };
      }
    }

    const template = await prisma.questionnaire.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: QuestionnaireStatus.DRAFT,
        trainerId: user.userId,
        questions: {
          create: data.questions.map((q, idx) => ({
            text: q.text.trim(),
            type: q.type,
            options: q.type === "MULTIPLE_CHOICE" ? q.options.filter((o) => o.trim()) : [],
            order: idx + 1,
          })),
        },
      },
    });

    revalidatePath("/questionnaires");
    return { success: true, data: template };
  } catch (error) {
    console.error("createQuestionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create template" };
  }
}

/**
 * 2. UPDATE: Update a DRAFT template (only if DRAFT and no assignments)
 */
export async function updateQuestionnaire(
  id: string,
  data: {
    title: string;
    description?: string;
    questions: {
      text: string;
      type: "MULTIPLE_CHOICE" | "OPEN";
      options: string[];
    }[];
  }
) {
  try {
    const user = await checkAuth();
    if (user.role !== UserRole.TRAINER) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await prisma.questionnaire.findUnique({
      where: { id },
      include: { assignments: true },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (template.trainerId !== user.userId) {
      return { success: false, error: "Unauthorized access" };
    }

    if (template.status !== QuestionnaireStatus.DRAFT) {
      return { success: false, error: "Cannot edit a defined template" };
    }

    if (template.assignments.length > 0) {
      return { success: false, error: "Cannot edit a template with active assignments" };
    }

    // Validation
    if (!data.title.trim()) {
      return { success: false, error: "Title is required" };
    }
    if (data.questions.length === 0) {
      return { success: false, error: "At least one question is required" };
    }
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!q.text.trim()) {
        return { success: false, error: `Question #${i + 1} text is empty` };
      }
      if (q.type === "MULTIPLE_CHOICE" && q.options.filter((o) => o.trim()).length < 2) {
        return { success: false, error: `Multiple choice question #${i + 1} requires at least 2 options` };
      }
    }

    // Perform update in a transaction: delete old questions and create new ones
    await prisma.$transaction(async (tx) => {
      // Delete old questions (Prisma cascade deletes from db schema, but let's clear explicitly)
      await tx.question.deleteMany({
        where: { questionnaireId: id },
      });

      // Update Questionnaire details
      await tx.questionnaire.update({
        where: { id },
        data: {
          title: data.title.trim(),
          description: data.description?.trim() || null,
          questions: {
            create: data.questions.map((q, idx) => ({
              text: q.text.trim(),
              type: q.type,
              options: q.type === "MULTIPLE_CHOICE" ? q.options.filter((o) => o.trim()) : [],
              order: idx + 1,
            })),
          },
        },
      });
    });

    revalidatePath("/questionnaires");
    revalidatePath(`/questionnaires/${id}`);
    return { success: true };
  } catch (error) {
    console.error("updateQuestionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update template" };
  }
}

/**
 * 3. DEFINE: DRAFT -> DEFINED
 */
export async function defineQuestionnaire(id: string) {
  try {
    const user = await checkAuth();
    if (user.role !== UserRole.TRAINER) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await prisma.questionnaire.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (template.trainerId !== user.userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (template.status !== QuestionnaireStatus.DRAFT) {
      return { success: false, error: "Template is already defined" };
    }

    await prisma.questionnaire.update({
      where: { id },
      data: { status: QuestionnaireStatus.DEFINED },
    });

    revalidatePath("/questionnaires");
    revalidatePath(`/questionnaires/${id}`);
    return { success: true };
  } catch (error) {
    console.error("defineQuestionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to define template" };
  }
}

/**
 * 4. DUPLICATE: Clone a template as a new DRAFT template
 */
export async function duplicateQuestionnaire(id: string) {
  try {
    const user = await checkAuth();
    if (user.role !== UserRole.TRAINER) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await prisma.questionnaire.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (template.trainerId !== user.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const clone = await prisma.questionnaire.create({
      data: {
        title: `${template.title} (Copia)`,
        description: template.description,
        status: QuestionnaireStatus.DRAFT,
        trainerId: user.userId,
        questions: {
          create: template.questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.options,
            order: q.order,
          })),
        },
      },
    });

    revalidatePath("/questionnaires");
    return { success: true, data: clone };
  } catch (error) {
    console.error("duplicateQuestionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to duplicate template" };
  }
}

/**
 * 5. SEND: Send a DEFINED template to multiple players
 */
export async function sendQuestionnaireToPlayers(questionnaireId: string, playerIds: string[]) {
  try {
    const user = await checkAuth();
    if (user.role !== UserRole.TRAINER) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (template.trainerId !== user.userId) {
      return { success: false, error: "Unauthorized access" };
    }

    if (template.status !== QuestionnaireStatus.DEFINED) {
      return { success: false, error: "Only defined templates can be sent to players" };
    }

    if (playerIds.length === 0) {
      return { success: false, error: "Please select at least one player" };
    }

    // Verify all players are assigned to trainer
    const assignedPlayersCount = await prisma.user.count({
      where: {
        id: { in: playerIds },
        role: { in: [UserRole.PLAYER, UserRole.GOAL_KEEPER] },
        trainers: {
          some: { id: user.userId },
        },
      },
    });

    if (assignedPlayersCount !== playerIds.length) {
      return { success: false, error: "One or more selected players are not assigned to you" };
    }

    // Transaction to create assignments and corresponding notifications
    await prisma.$transaction(async (tx) => {
      for (const pId of playerIds) {
        const assignment = await tx.questionnaireAssignment.create({
          data: {
            questionnaireId,
            playerId: pId,
            status: AssignmentStatus.SENT,
          },
        });

        await tx.notification.create({
          data: {
            recipientId: pId,
            type: "QUESTIONNAIRE_SENT",
            assignmentId: assignment.id,
          },
        });
      }
    });

    revalidatePath("/questionnaires");
    revalidatePath(`/questionnaires/${questionnaireId}`);
    return { success: true };
  } catch (error) {
    console.error("sendQuestionnaireToPlayers error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send questionnaire" };
  }
}

/**
 * 6. RECLAIM: Player reclaims assignment
 */
export async function reclaimAssignment(assignmentId: string) {
  try {
    const user = await checkAuth();
    if (user.role !== UserRole.PLAYER && user.role !== UserRole.GOAL_KEEPER) {
      return { success: false, error: "Only players can reclaim assignments" };
    }

    const assignment = await prisma.questionnaireAssignment.findUnique({
      where: { id: assignmentId },
      include: { questionnaire: true },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    if (assignment.playerId !== user.userId) {
      return { success: false, error: "Unauthorized access" };
    }

    if (assignment.status !== AssignmentStatus.SENT) {
      return { success: false, error: "Assignments can only be reclaimed when SENT" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.questionnaireAssignment.update({
        where: { id: assignmentId },
        data: {
          status: AssignmentStatus.RECLAIMED,
          reclaimedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          recipientId: assignment.questionnaire.trainerId,
          type: "QUESTIONNAIRE_RECLAIMED",
          assignmentId: assignmentId,
        },
      });
    });

    revalidatePath("/questionnaires");
    revalidatePath(`/questionnaires/assignments/${assignmentId}`);
    return { success: true };
  } catch (error) {
    console.error("reclaimAssignment error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to reclaim" };
  }
}

/**
 * 7. SUBMIT: Player submits assignment answers
 */
export async function submitAssignmentAnswers(
  assignmentId: string,
  answers: { questionId: string; value: string }[]
) {
  try {
    const user = await checkAuth();
    if (user.role !== UserRole.PLAYER && user.role !== UserRole.GOAL_KEEPER) {
      return { success: false, error: "Only players can submit answers" };
    }

    const assignment = await prisma.questionnaireAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        questionnaire: {
          include: { questions: true },
        },
      },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    if (assignment.playerId !== user.userId) {
      return { success: false, error: "Unauthorized access" };
    }

    if (assignment.status !== AssignmentStatus.SENT && assignment.status !== AssignmentStatus.RECLAIMED) {
      return { success: false, error: "Assignment is already completed" };
    }

    // Validate answers length
    const templateQuestionIds = assignment.questionnaire.questions.map((q) => q.id);
    for (const ans of answers) {
      if (!templateQuestionIds.includes(ans.questionId)) {
        return { success: false, error: "Invalid question answer mapping" };
      }
    }

    await prisma.$transaction(async (tx) => {
      // Save Answer records
      for (const ans of answers) {
        await tx.answer.upsert({
          where: {
            assignmentId_questionId: {
              assignmentId,
              questionId: ans.questionId,
            },
          },
          update: { value: ans.value },
          create: {
            assignmentId,
            questionId: ans.questionId,
            value: ans.value,
          },
        });
      }

      // Update assignment details
      await tx.questionnaireAssignment.update({
        where: { id: assignmentId },
        data: {
          status: AssignmentStatus.COMPLETED,
          respondedAt: new Date(),
        },
      });

      // Send notification to trainer
      await tx.notification.create({
        data: {
          recipientId: assignment.questionnaire.trainerId,
          type: "QUESTIONNAIRE_RESPONDED",
          assignmentId: assignmentId,
        },
      });
    });

    revalidatePath("/questionnaires");
    revalidatePath(`/questionnaires/assignments/${assignmentId}`);
    return { success: true };
  } catch (error) {
    console.error("submitAssignmentAnswers error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to submit answers" };
  }
}

/**
 * 8. DELETE: Delete template (only if DRAFT and no assignments)
 */
export async function deleteQuestionnaire(id: string) {
  try {
    const user = await checkAuth();
    if (user.role !== UserRole.TRAINER) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await prisma.questionnaire.findUnique({
      where: { id },
      include: { assignments: true },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (template.trainerId !== user.userId) {
      return { success: false, error: "Unauthorized access" };
    }

    if (template.status !== QuestionnaireStatus.DRAFT) {
      return { success: false, error: "Only draft templates can be deleted" };
    }

    if (template.assignments.length > 0) {
      return { success: false, error: "Cannot delete a template with active assignments" };
    }

    await prisma.questionnaire.delete({
      where: { id },
    });

    revalidatePath("/questionnaires");
    return { success: true };
  } catch (error) {
    console.error("deleteQuestionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete template" };
  }
}

/**
 * 9. READ: Trainer templates list with assignment counters
 */
export async function getQuestionnairesByTrainer(trainerId: string) {
  try {
    const user = await checkAuth();
    if (user.role !== UserRole.TRAINER || user.userId !== trainerId) {
      return { success: false, error: "Unauthorized" };
    }

    const questionnaires = await prisma.questionnaire.findMany({
      where: { trainerId },
      include: {
        _count: {
          select: { questions: true },
        },
        assignments: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to include counts for each status
    const mapped = questionnaires.map((q) => {
      const active = q.assignments.filter((a) => a.status === AssignmentStatus.SENT || a.status === AssignmentStatus.RECLAIMED).length;
      const completed = q.assignments.filter((a) => a.status === AssignmentStatus.COMPLETED).length;

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        status: q.status,
        createdAt: q.createdAt,
        questionCount: q._count.questions,
        activeAssignments: active,
        completedAssignments: completed,
      };
    });

    return { success: true, questionnaires: mapped };
  } catch (error) {
    console.error("getQuestionnairesByTrainer error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load templates" };
  }
}

/**
 * 10. READ: Player assignments
 */
export async function getAssignmentsByPlayer(playerId: string) {
  try {
    const user = await checkAuth();
    if (
      (user.role !== UserRole.PLAYER && user.role !== UserRole.GOAL_KEEPER) ||
      user.userId !== playerId
    ) {
      return { success: false, error: "Unauthorized" };
    }

    const assignments = await prisma.questionnaireAssignment.findMany({
      where: { playerId },
      include: {
        questionnaire: {
          select: {
            title: true,
            description: true,
            trainer: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { sentAt: "desc" },
    });

    return { success: true, assignments };
  } catch (error) {
    console.error("getAssignmentsByPlayer error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load assignments" };
  }
}

/**
 * 11. READ: Get assignment detail by ID
 */
export async function getAssignmentById(id: string) {
  try {
    const user = await checkAuth();

    const assignment = await prisma.questionnaireAssignment.findUnique({
      where: { id },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        questionnaire: {
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatarUrl: true,
              },
            },
            questions: {
              orderBy: { order: "asc" },
            },
          },
        },
        answers: true,
      },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    const isTrainer = user.role === UserRole.TRAINER;
    const isPlayer = user.role === UserRole.PLAYER || user.role === UserRole.GOAL_KEEPER;

    // Validate access
    if (isTrainer && assignment.questionnaire.trainerId !== user.userId) {
      return { success: false, error: "Unauthorized access to assignment details" };
    }

    if (isPlayer && assignment.playerId !== user.userId) {
      return { success: false, error: "Unauthorized access to assignment details" };
    }

    return { success: true, assignment };
  } catch (error) {
    console.error("getAssignmentById error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load assignment detail" };
  }
}

/**
 * 12. READ: Get questionnaire template by ID (for Trainer detail view)
 */
export async function getQuestionnaireById(id: string) {
  try {
    const user = await checkAuth();
    if (user.role !== UserRole.TRAINER) {
      return { success: false, error: "Unauthorized" };
    }

    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        assignments: {
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
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!questionnaire) {
      return { success: false, error: "Questionnaire template not found" };
    }

    if (questionnaire.trainerId !== user.userId) {
      return { success: false, error: "Unauthorized access to template details" };
    }

    return { success: true, questionnaire };
  } catch (error) {
    console.error("getQuestionnaireById error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load template" };
  }
}
