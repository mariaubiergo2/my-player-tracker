"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole, PlanStatus, RecurrenceDay } from "@prisma/client";
import { trainingPlanSchema } from "@/lib/validations/training";
import { canManageTrainingPlan, canViewTrainingPlan, canModifySessionCompletion } from "@/lib/permissions";

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

export async function getTrainingPlans() {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const whereClause = currentUser.role === UserRole.ADMIN ? {} : { trainerId: currentUser.userId };

    const plans = await prisma.trainingPlan.findMany({
      where: whereClause,
      include: {
        sessions: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
            },
          },
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
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: plans };
  } catch (error) {
    console.error("getTrainingPlans error:", error);
    return { success: false, error: "Failed to load plans" };
  }
}

export async function getTrainingPlanById(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const plan = await prisma.trainingPlan.findUnique({
      where: { id },
      include: {
        sessions: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        assignments: {
          select: {
            playerId: true,
          },
        },
      },
    });

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    if (!canViewTrainingPlan(currentUser.role, currentUser.userId, plan.trainerId, plan.assignments.map(a => a.playerId))) {
      return { success: false, error: "Unauthorized to view this plan" };
    }

    return { success: true, data: plan };
  } catch (error) {
    console.error("getTrainingPlanById error:", error);
    return { success: false, error: "Failed to load plan" };
  }
}

export async function createTrainingPlan(data: { title: string; description?: string }) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    if (!data.title || data.title.trim() === "") {
      return { success: false, error: "El títol és obligatori" };
    }

    const plan = await prisma.trainingPlan.create({
      data: {
        trainerId: currentUser.userId,
        title: data.title,
        description: data.description || null,
        status: PlanStatus.DRAFT,
      },
    });

    revalidatePath("/trainer/training-plans");
    return { success: true, data: plan };
  } catch (error) {
    console.error("createTrainingPlan error:", error);
    return { success: false, error: "Failed to create plan" };
  }
}

export async function updateTrainingPlan(id: string, formData: any) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const plan = await prisma.trainingPlan.findUnique({
      where: { id },
      include: { assignments: true },
    });

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    if (!canManageTrainingPlan(currentUser.role, currentUser.userId, plan.trainerId)) {
      return { success: false, error: "Unauthorized" };
    }

    const validation = trainingPlanSchema.safeParse(formData);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { title, description, sessions } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete all existing sessions (Cascade will delete sessionExercises)
      await tx.trainingSession.deleteMany({
        where: { trainingPlanId: id },
      });

      // 2. Re-create sessions and sessionExercises
      const updatedPlan = await tx.trainingPlan.update({
        where: { id },
        data: {
          title,
          description,
          sessions: {
            create: sessions.map((session, sIndex) => ({
              title: session.title,
              order: sIndex,
              recurrenceDays: session.recurrenceDays as RecurrenceDay[],
              startDate: session.startDate,
              endDate: session.endDate,
              exercises: {
                create: session.exercises.map((ex, exIndex) => ({
                  exerciseId: ex.exerciseId,
                  order: exIndex,
                  repetitionsOverride: ex.repetitionsOverride || null,
                })),
              },
            })),
          },
        },
        include: {
          sessions: {
            include: {
              exercises: true,
            },
          },
        },
      });

      // 3. Send notifications if plan is already SENT
      if (plan.status === PlanStatus.SENT) {
        for (const assignment of plan.assignments) {
          await tx.notification.create({
            data: {
              recipientId: assignment.playerId,
              type: "TRAINING_PLAN_UPDATED",
              trainingPlanAssignmentId: assignment.id,
            },
          });
        }
      }

      return updatedPlan;
    });

    revalidatePath("/trainer/training-plans");
    revalidatePath(`/trainer/training-plans/${id}`);
    revalidatePath("/dashboard/physical");

    return { success: true, data: result };
  } catch (error) {
    console.error("updateTrainingPlan error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update plan" };
  }
}

export async function sendTrainingPlan(planId: string, playerIds: string[]) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    if (!playerIds || playerIds.length === 0) {
      return { success: false, error: "Selecciona almenys un jugador" };
    }

    const plan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    if (!canManageTrainingPlan(currentUser.role, currentUser.userId, plan.trainerId)) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify all players belong to trainer (admins skip)
    if (currentUser.role !== UserRole.ADMIN) {
      const trainer = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { players: { select: { id: true } } },
      });
      const myPlayerIds = trainer?.players.map((p) => p.id) || [];
      const allBelong = playerIds.every((pid) => myPlayerIds.includes(pid));
      if (!allBelong) {
        return { success: false, error: "Alguns jugadors seleccionats no pertanyen a la teva plantilla" };
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Set status to SENT
      await tx.trainingPlan.update({
        where: { id: planId },
        data: { status: PlanStatus.SENT },
      });

      // 2. Create assignments and notifications
      for (const playerId of playerIds) {
        const assignment = await tx.trainingPlanAssignment.upsert({
          where: {
            trainingPlanId_playerId: {
              trainingPlanId: planId,
              playerId,
            },
          },
          create: {
            trainingPlanId: planId,
            playerId,
          },
          update: {
            sentAt: new Date(),
          },
        });

        await tx.notification.create({
          data: {
            recipientId: playerId,
            type: "TRAINING_PLAN_SENT",
            trainingPlanAssignmentId: assignment.id,
          },
        });
      }
    });

    revalidatePath("/trainer/training-plans");
    revalidatePath("/dashboard/physical");

    return { success: true };
  } catch (error) {
    console.error("sendTrainingPlan error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send plan" };
  }
}

export async function deleteTrainingPlan(id: string) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const plan = await prisma.trainingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    if (!canManageTrainingPlan(currentUser.role, currentUser.userId, plan.trainerId)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.trainingPlan.delete({
      where: { id },
    });

    revalidatePath("/trainer/training-plans");
    return { success: true };
  } catch (error) {
    console.error("deleteTrainingPlan error:", error);
    return { success: false, error: "Failed to delete plan" };
  }
}

export async function getPlayerActivePlans(playerId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const assignments = await prisma.trainingPlanAssignment.findMany({
      where: { playerId },
      include: {
        trainingPlan: {
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatarUrl: true,
              },
            },
            sessions: {
              include: {
                exercises: {
                  include: {
                    exercise: true,
                  },
                  orderBy: { order: "asc" },
                },
                completions: {
                  where: { playerId },
                },
                feedback: {
                  where: { playerId },
                  orderBy: { createdAt: "desc" },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
        planFeedback: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { sentAt: "desc" },
    });

    return { success: true, data: assignments };
  } catch (error) {
    console.error("getPlayerActivePlans error:", error);
    return { success: false, error: "Failed to load player training plans" };
  }
}

export async function toggleSessionCompletion(
  sessionId: string,
  playerId: string,
  scheduledDate: Date | string,
  completed: boolean
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (!canModifySessionCompletion(currentUser.role, currentUser.userId, playerId)) {
      return { success: false, error: "Unauthorized" };
    }

    // Normalize date to UTC midnight to avoid timezone offsets and server local time shifts
    let dateStr = "";
    if (typeof scheduledDate === "string") {
      dateStr = scheduledDate.includes("T") ? scheduledDate.split("T")[0] : scheduledDate;
    } else if (scheduledDate instanceof Date) {
      dateStr = scheduledDate.toISOString().split("T")[0];
    }
    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

    if (completed) {
      await prisma.sessionCompletion.upsert({
        where: {
          sessionId_playerId_scheduledDate: {
            sessionId,
            playerId,
            scheduledDate: targetDate,
          },
        },
        create: {
          sessionId,
          playerId,
          scheduledDate: targetDate,
        },
        update: {},
      });
    } else {
      await prisma.sessionCompletion.deleteMany({
        where: {
          sessionId,
          playerId,
          scheduledDate: targetDate,
        },
      });
    }

    revalidatePath("/dashboard/physical", "layout");
    return { success: true };
  } catch (error) {
    console.error("toggleSessionCompletion error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to toggle completion" };
  }
}

export async function getPhysicalPrepStats() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const trainerId = currentUser.userId;

    const [exerciseCount, planAssignmentCount, pendingFeedbackCount] = await Promise.all([
      prisma.exercise.count({
        where: { trainerId },
      }),
      prisma.trainingPlanAssignment.count({
        where: {
          trainingPlan: { trainerId },
        },
      }),
      prisma.trainingFeedback.count({
        where: {
          reviewedAt: null,
          OR: [
            { session: { trainingPlan: { trainerId } } },
            { assignment: { trainingPlan: { trainerId } } }
          ]
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        exerciseCount,
        planAssignmentCount,
        pendingFeedbackCount,
      },
    };
  } catch (error) {
    console.error("getPhysicalPrepStats error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load stats" };
  }
}
