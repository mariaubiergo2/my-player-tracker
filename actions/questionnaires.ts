"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { QuestionnaireStatus, AssignmentStatus, QuestionType, UserRole, QuestionnaireType } from "@prisma/client";

// HELPER: Validate if caller is a Trainer or Admin
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

// 1. CREATE QUESTIONNAIRE (Template in DRAFT)
export async function createQuestionnaire(data: {
  title: string;
  description?: string;
  questions: Array<{ text: string; type: QuestionType; options: string[] }>;
  status?: QuestionnaireStatus;
  type?: QuestionnaireType;
}) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    if (!data.title || data.title.trim() === "") {
      return { success: false, error: "validation_title_required" };
    }
    if (!data.questions || data.questions.length === 0) {
      return { success: false, error: "validation_questions_required" };
    }

    for (const q of data.questions) {
      if (q.type === QuestionType.MULTIPLE_CHOICE && (!q.options || q.options.length < 2)) {
        return { success: false, error: "validation_options_required" };
      }
    }

    const status = data.status || QuestionnaireStatus.DRAFT;
    const type = data.type || QuestionnaireType.ANALYSIS_VIDEO;

    const questionnaire = await prisma.questionnaire.create({
      data: {
        title: data.title,
        description: data.description || null,
        status,
        type,
        trainerId: currentUser.userId,
        questions: {
          create: data.questions.map((q, index) => ({
            text: q.text,
            type: q.type,
            options: q.type === QuestionType.MULTIPLE_CHOICE ? q.options : [],
            order: index,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    revalidatePath("/questionnaires");
    return { success: true, data: questionnaire };
  } catch (error) {
    console.error("Create questionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create questionnaire" };
  }
}

// 2. UPDATE QUESTIONNAIRE
export async function updateQuestionnaire(
  id: string,
  data: {
    title: string;
    description?: string;
    questions: Array<{ text: string; type: QuestionType; options: string[] }>;
    status?: QuestionnaireStatus;
    type?: QuestionnaireType;
  }
) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const existing = await prisma.questionnaire.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Questionnaire not found" };
    }

    if (existing.trainerId !== currentUser.userId && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    // Block updates if questionnaire is already in SEND status
    if (existing.status === QuestionnaireStatus.SEND) {
      return { success: false, error: "template_locked" };
    }

    if (!data.title || data.title.trim() === "") {
      return { success: false, error: "validation_title_required" };
    }
    if (!data.questions || data.questions.length === 0) {
      return { success: false, error: "validation_questions_required" };
    }

    for (const q of data.questions) {
      if (q.type === QuestionType.MULTIPLE_CHOICE && (!q.options || q.options.length < 2)) {
        return { success: false, error: "validation_options_required" };
      }
    }

    const updatedStatus = data.status || existing.status;
    const updatedType = data.type || existing.type;

    // Use a transaction to delete old questions and create new ones
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing questions
      await tx.question.deleteMany({
        where: { questionnaireId: id },
      });

      // 2. Update questionnaire and insert new questions
      return await tx.questionnaire.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description || null,
          status: updatedStatus,
          type: updatedType,
          questions: {
            create: data.questions.map((q, index) => ({
              text: q.text,
              type: q.type,
              options: q.type === QuestionType.MULTIPLE_CHOICE ? q.options : [],
              order: index,
            })),
          },
        },
        include: {
          questions: true,
        },
      });
    });

    revalidatePath("/questionnaires");
    revalidatePath(`/questionnaires/${id}`);
    return { success: true, data: result };
  } catch (error) {
    console.error("Update questionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update questionnaire" };
  }
}

// 3. DEFINE QUESTIONNAIRE (DRAFT -> DEFINED)
export async function defineQuestionnaire(id: string) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const existing = await prisma.questionnaire.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Questionnaire not found" };
    }

    if (existing.trainerId !== currentUser.userId && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    if (existing.status !== QuestionnaireStatus.DRAFT) {
      return { success: false, error: "Questionnaire must be in DRAFT status to be defined" };
    }

    const updated = await prisma.questionnaire.update({
      where: { id },
      data: { status: QuestionnaireStatus.DEFINED },
    });

    revalidatePath("/questionnaires");
    revalidatePath(`/questionnaires/${id}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Define questionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to define questionnaire" };
  }
}

// 4. SEND QUESTIONNAIRE TO PLAYERS
export async function sendQuestionnaireToPlayers(questionnaireId: string, playerIds: string[]) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    if (!playerIds || playerIds.length === 0) {
      return { success: false, error: "validation_player_required" };
    }

    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      return { success: false, error: "Questionnaire not found" };
    }

    if (questionnaire.trainerId !== currentUser.userId && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    if (questionnaire.status !== QuestionnaireStatus.DEFINED && questionnaire.status !== QuestionnaireStatus.SEND) {
      return { success: false, error: "Questionnaire must be DEFINED or SEND to be assigned" };
    }

    // Verify all players are connected to this trainer (admins skip this check)
    if (currentUser.role !== UserRole.ADMIN) {
      const trainer = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: {
          players: { select: { id: true } },
        },
      });
      const myPlayerIds = trainer?.players.map((p) => p.id) || [];
      const allBelong = playerIds.every((id) => myPlayerIds.includes(id));
      if (!allBelong) {
        return { success: false, error: "Some selected players do not belong to you" };
      }
    }

    // Perform operations in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create assignments & notifications
      for (const playerId of playerIds) {
        const assignment = await tx.questionnaireAssignment.create({
          data: {
            questionnaireId,
            playerId,
            status: AssignmentStatus.SENT,
          },
        });

        await tx.notification.create({
          data: {
            recipientId: playerId,
            type: "QUESTIONNAIRE_SENT",
            assignmentId: assignment.id,
          },
        });
      }

      // 2. Transition status from DEFINED -> SEND
      if (questionnaire.status === QuestionnaireStatus.DEFINED) {
        await tx.questionnaire.update({
          where: { id: questionnaireId },
          data: { status: QuestionnaireStatus.SEND },
        });
      }
    });

    revalidatePath("/questionnaires");
    revalidatePath(`/questionnaires/${questionnaireId}`);
    return { success: true };
  } catch (error) {
    console.error("Send questionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send questionnaire" };
  }
}

// 5. DUPLICATE QUESTIONNAIRE
export async function duplicateQuestionnaire(id: string) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const existing = await prisma.questionnaire.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    if (!existing) {
      return { success: false, error: "Questionnaire not found" };
    }

    if (existing.trainerId !== currentUser.userId && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const cloned = await prisma.questionnaire.create({
      data: {
        title: `${existing.title} (copia)`,
        description: existing.description,
        status: QuestionnaireStatus.DRAFT,
        type: existing.type,
        trainerId: currentUser.userId,
        questions: {
          create: existing.questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.options,
            order: q.order,
          })),
        },
      },
    });

    revalidatePath("/questionnaires");
    return { success: true, data: cloned };
  } catch (error) {
    console.error("Duplicate questionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to duplicate questionnaire" };
  }
}

// 6. DELETE QUESTIONNAIRE
export async function deleteQuestionnaire(id: string) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const existing = await prisma.questionnaire.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Questionnaire not found" };
    }

    if (existing.trainerId !== currentUser.userId && currentUser.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    if (existing.status !== QuestionnaireStatus.DRAFT && existing.status !== QuestionnaireStatus.DEFINED) {
      return { success: false, error: "Only DRAFT or DEFINED questionnaires can be deleted" };
    }

    await prisma.questionnaire.delete({
      where: { id },
    });

    revalidatePath("/questionnaires");
    return { success: true };
  } catch (error) {
    console.error("Delete questionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete questionnaire" };
  }
}

// 7. RECLAIM ASSIGNMENT (SENT -> RECLAIMED)
export async function reclaimAssignment(assignmentId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const assignment = await prisma.questionnaireAssignment.findUnique({
      where: { id: assignmentId },
      include: { questionnaire: true },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    if (assignment.playerId !== currentUser.userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (assignment.status !== AssignmentStatus.SENT) {
      return { success: false, error: "Assignment cannot be reclaimed" };
    }

    const updated = await prisma.questionnaireAssignment.update({
      where: { id: assignmentId },
      data: {
        status: AssignmentStatus.RECLAIMED,
        reclaimedAt: new Date(),
      },
    });

    // Notify the trainer
    await prisma.notification.create({
      data: {
        recipientId: assignment.questionnaire.trainerId,
        type: "QUESTIONNAIRE_RECLAIMED",
        assignmentId: assignmentId,
      },
    });

    revalidatePath("/questionnaires");
    revalidatePath(`/questionnaires/assignments/${assignmentId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Reclaim assignment error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to reclaim assignment" };
  }
}

// 8. SUBMIT ASSIGNMENT ANSWERS (SENT/RECLAIMED -> COMPLETED)
export async function submitAssignmentAnswers(
  assignmentId: string,
  answers: Array<{ questionId: string; value: string }>
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const assignment = await prisma.questionnaireAssignment.findUnique({
      where: { id: assignmentId },
      include: { questionnaire: true },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    if (assignment.playerId !== currentUser.userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (assignment.status !== AssignmentStatus.SENT && assignment.status !== AssignmentStatus.RECLAIMED) {
      return { success: false, error: "Assignment already completed" };
    }

    // Submit in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create answers
      for (const ans of answers) {
        await tx.answer.create({
          data: {
            assignmentId,
            questionId: ans.questionId,
            value: ans.value,
          },
        });
      }

      // 2. Update assignment status
      await tx.questionnaireAssignment.update({
        where: { id: assignmentId },
        data: {
          status: AssignmentStatus.COMPLETED,
          respondedAt: new Date(),
        },
      });

      // 3. Notify the trainer
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
    console.error("Submit answers error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to submit answers" };
  }
}

// 9. GET QUESTIONNAIRES BY TRAINER
export async function getQuestionnairesByTrainer(trainerId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const questionnaires = await prisma.questionnaire.findMany({
      where: { trainerId },
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          select: {
            status: true,
          },
        },
      },
    });

    // Map counts of assignments by status
    const mapped = questionnaires.map((q) => {
      const counts = {
        sent: q.assignments.filter((a) => a.status === AssignmentStatus.SENT).length,
        reclaimed: q.assignments.filter((a) => a.status === AssignmentStatus.RECLAIMED).length,
        completed: q.assignments.filter((a) => a.status === AssignmentStatus.COMPLETED).length,
      };
      return {
        ...q,
        counts,
      };
    });

    // Fetch all assignments for this trainer's templates
    const assignments = await prisma.questionnaireAssignment.findMany({
      where: {
        questionnaire: {
          trainerId,
        },
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
        questionnaire: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
    });

    return { success: true, questionnaires: mapped, assignments };
  } catch (error) {
    console.error("Get questionnaires error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get questionnaires" };
  }
}

// 10. GET ASSIGNMENTS BY PLAYER
export async function getAssignmentsByPlayer(playerId: string, type?: QuestionnaireType) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== playerId) {
      return { success: false, error: "Unauthorized" };
    }

    const whereClause: any = { playerId };
    if (type) {
      whereClause.questionnaire = { type };
    }

    const assignments = await prisma.questionnaireAssignment.findMany({
      where: whereClause,
      orderBy: { sentAt: "desc" },
      include: {
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
          },
        },
      },
    });

    const pending = assignments.filter(
      (a) => a.status === AssignmentStatus.SENT || a.status === AssignmentStatus.RECLAIMED
    );
    const completed = assignments.filter((a) => a.status === AssignmentStatus.COMPLETED);

    return { success: true, pending, completed };
  } catch (error) {
    console.error("Get assignments by player error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get assignments" };
  }
}

// 11. GET ASSIGNMENT BY ID
export async function getAssignmentById(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

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
            questions: {
              orderBy: { order: "asc" },
            },
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
        answers: true,
      },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    // Access control: only the assigned player, the owner trainer, or an admin
    const isPlayer = assignment.playerId === currentUser.userId;
    const isTrainer = assignment.questionnaire.trainerId === currentUser.userId;
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!isPlayer && !isTrainer && !isAdmin) {
      return { success: false, error: "Unauthorized to access this assignment" };
    }

    return { success: true, assignment };
  } catch (error) {
    console.error("Get assignment error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get assignment" };
  }
}

// 12. GET QUESTIONNAIRE BY ID (for Trainer template details/editor)
export async function getQuestionnaireById(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        assignments: {
          orderBy: { sentAt: "desc" },
          include: {
            player: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    if (!questionnaire) {
      return { success: false, error: "Questionnaire not found" };
    }

    const isOwner = questionnaire.trainerId === currentUser.userId;
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    return { success: true, questionnaire };
  } catch (error) {
    console.error("Get questionnaire error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get questionnaire" };
  }
}

// 13. GET SELECTABLE PLAYERS FOR TRAINER (assigned players only, with avatarUrl)
export async function getSelectablePlayersForTrainer() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role === UserRole.ADMIN) {
      const players = await prisma.user.findMany({
        where: { role: { in: [UserRole.PLAYER, UserRole.GOAL_KEEPER] } },
        select: { id: true, name: true, surname: true, avatarUrl: true },
        orderBy: { name: "asc" },
      });
      return { success: true, players };
    }

    if (currentUser.role === UserRole.TRAINER) {
      const players = await prisma.user.findMany({
        where: {
          role: { in: [UserRole.PLAYER, UserRole.GOAL_KEEPER] },
          trainers: {
            some: {
              id: currentUser.userId,
            },
          },
        },
        select: { id: true, name: true, surname: true, avatarUrl: true },
        orderBy: { name: "asc" },
      });
      return { success: true, players };
    }

    return { success: true, players: [] };
  } catch (error) {
    console.error("getSelectablePlayersForTrainer error:", error);
    return { success: false, error: "Failed to get players" };
  }
}
