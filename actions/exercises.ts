"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { exerciseSchema } from "@/lib/validations/training";
import { canManageExercise } from "@/lib/permissions";

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

export async function getExercises() {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const whereClause = currentUser.role === UserRole.ADMIN ? {} : { trainerId: currentUser.userId };

    const exercises = await prisma.exercise.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: exercises };
  } catch (error) {
    console.error("getExercises error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load exercises" };
  }
}

export async function createExercise(formData: any) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const validation = exerciseSchema.safeParse(formData);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { title, description, repetitions, mediaType, imageUrl, videoUrl } = validation.data;

    const exercise = await prisma.exercise.create({
      data: {
        trainerId: currentUser.userId,
        title,
        description,
        repetitions,
        mediaType: mediaType || null,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
      },
    });

    revalidatePath("/trainer/exercises");
    return { success: true, data: exercise };
  } catch (error) {
    console.error("createExercise error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create exercise" };
  }
}

export async function updateExercise(id: string, formData: any) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const existing = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Exercise not found" };
    }

    if (!canManageExercise(currentUser.role, currentUser.userId, existing.trainerId)) {
      return { success: false, error: "Unauthorized" };
    }

    const validation = exerciseSchema.safeParse(formData);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { title, description, repetitions, mediaType, imageUrl, videoUrl } = validation.data;

    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        title,
        description,
        repetitions,
        mediaType: mediaType || null,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
      },
    });

    revalidatePath("/trainer/exercises");
    return { success: true, data: exercise };
  } catch (error) {
    console.error("updateExercise error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update exercise" };
  }
}

export async function deleteExercise(id: string) {
  try {
    const currentUser = await checkTrainerOrAdmin();

    const existing = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Exercise not found" };
    }

    if (!canManageExercise(currentUser.role, currentUser.userId, existing.trainerId)) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if exercise is in use
    const usages = await prisma.sessionExercise.count({
      where: { exerciseId: id },
    });

    if (usages > 0) {
      return { success: false, error: "exercise_in_use" }; // translated on frontend or server
    }

    await prisma.exercise.delete({
      where: { id },
    });

    revalidatePath("/trainer/exercises");
    return { success: true };
  } catch (error) {
    console.error("deleteExercise error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete exercise" };
  }
}
