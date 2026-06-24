// app/actions/matches.ts
"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MatchStatus, MatchType } from "@prisma/client";
import { cookies } from "next/headers";

// 1. GET ALL MATCHES of a trainer
export async function getAllMatchesByTrainer(trainerId: string) {
  try {
    return await prisma.match.findMany({
      where: { trainerId },
      orderBy: { date: "desc" },
    });
  } catch (error) {
    console.error("Get matches by trainer error:", error);
    return [];
  }
}

// 2. GET SINGLE MATCH (for the detail page)
export async function getMatchById(matchId: string) {
  try {
    return await prisma.match.findUnique({
      where: { id: matchId },
    });
  } catch (error) {
    console.error("Get match by id error:", error);
    return null;
  }
}

// 3. CREATE MATCH
export async function createMatch(prevState: any, formData: FormData) {
  const name = formData.get('name');
  const description = formData.get('description');
  const location = formData.get('location');
  const date = formData.get('date');
  const startTime = formData.get('startTime');
  const endTime = formData.get('endTime');
  const opponent = formData.get('opponent');
  const matchType = formData.get('matchType');
  const status = formData.get('status');
  const playerId = formData.get('playerId');
  const trainerId = formData.get('trainerId');
  const teamId = formData.get('teamId');
  const comment = formData.get('comment');
  const trainerFeedback = formData.get('trainerFeedback');
  const playerReflection = formData.get('playerReflection');
  const mark = formData.get('mark');
  const intensity = formData.get('intensity');
  const attitude = formData.get('attitude');
  const performance = formData.get('performance');
  const goals = formData.get('goals');
  const assists = formData.get('assists');
  const minutesPlayed = formData.get('minutesPlayed');
  const strengths = formData.get('strengths');
  const weaknesses = formData.get('weaknesses');
  const improvementAreas = formData.get('improvementAreas');
  const isReviewed = formData.get('isReviewed');
  const reviewedAt = formData.get('reviewedAt');

  if (!name || !date || !status || !trainerId || !playerId) {
    return { message: 'Missing required fields: name, date, status, trainerId and playerId are required' };
  }

  let redirectTarget = '/dashboard';

  try {
    // 1. Verify player and trainer exist in PostgreSQL to prevent FK constraint crashes
    const playerExists = await prisma.user.findUnique({
      where: { id: playerId as string },
    });
    if (!playerExists) {
      return { message: `Player with ID "${playerId}" does not exist in the database.` };
    }

    const trainerExists = await prisma.user.findUnique({
      where: { id: trainerId as string },
    });
    if (!trainerExists) {
      // return { message: `Trainer with ID "${trainerId}" does not exist in the database.` };
    }

    // 2. Parse enum fields
    const parsedMatchType = matchType && ["FRIENDLY", "LEAGUE", "CUP", "TRAINING"].includes(String(matchType).toUpperCase())
      ? (String(matchType).toUpperCase() as MatchType)
      : null;

    const parsedStatus = status && ["SCHEDULED", "COMPLETED", "CANCELLED"].includes(String(status).toUpperCase())
      ? (String(status).toUpperCase() as MatchStatus)
      : MatchStatus.SCHEDULED;

    // 3. Parse numbers
    const parsedMark = mark ? parseInt(mark as string, 10) : null;
    const parsedIntensity = intensity ? parseInt(intensity as string, 10) : null;
    const parsedAttitude = attitude ? parseInt(attitude as string, 10) : null;
    const parsedPerformance = performance ? parseInt(performance as string, 10) : null;

    const parsedGoals = goals ? parseInt(goals as string, 10) : 0;
    const parsedAssists = assists ? parseInt(assists as string, 10) : 0;
    const parsedMinutesPlayed = minutesPlayed ? parseInt(minutesPlayed as string, 10) : 0;

    // 4. Parse arrays of strings
    const parsedStrengths = strengths ? String(strengths).split(',').map((s) => s.trim()).filter(Boolean) : [];
    const parsedWeaknesses = weaknesses ? String(weaknesses).split(',').map((s) => s.trim()).filter(Boolean) : [];
    const parsedImprovementAreas = improvementAreas ? String(improvementAreas).split(',').map((s) => s.trim()).filter(Boolean) : [];

    // 5. Parse review boolean and reviewedAt date
    const parsedIsReviewed = isReviewed === "on" || isReviewed === "true";
    const parsedReviewedAt = reviewedAt ? new Date(reviewedAt as string) : null;

    // 6. Create the record
    await prisma.match.create({
      data: {
        name: name as string,
        description: description ? String(description) : null,
        location: location ? String(location) : null,
        date: new Date(date as string),
        startTime: startTime ? String(startTime) : null,
        endTime: endTime ? String(endTime) : null,
        opponent: opponent ? String(opponent) : null,
        matchType: parsedMatchType,
        status: parsedStatus,
        playerId: playerId as string,
        trainerId: trainerId as string,
        teamId: teamId ? String(teamId) : null,
        comment: comment ? String(comment) : null,
        trainerFeedback: trainerFeedback ? String(trainerFeedback) : null,
        playerReflection: playerReflection ? String(playerReflection) : null,
        mark: parsedMark,
        intensity: parsedIntensity,
        attitude: parsedAttitude,
        performance: parsedPerformance,
        goals: parsedGoals,
        assists: parsedAssists,
        minutesPlayed: parsedMinutesPlayed,
        strengths: parsedStrengths,
        weaknesses: parsedWeaknesses,
        improvementAreas: parsedImprovementAreas,
        isReviewed: parsedIsReviewed,
        reviewedAt: parsedReviewedAt,
      },
    });

    // Determine where to redirect based on auth token cookie presence
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      redirectTarget = '/dashboard';
    }

  } catch (error) {
    console.error("Create match error:", error);
    return { message: error instanceof Error ? error.message : "Failed to create match in database" };
  }

  // 7. Revalidate and redirect (outside try/catch to work correctly in Next.js)
  revalidatePath("/dashboard");
  redirect(redirectTarget);

  return { message: "Success" };
}

// 4. UPDATE MATCH
export async function updateMatch(matchId: string, updates: any) {
  try {
    const data: any = { ...updates };

    // Parse enums
    if (data.matchType) {
      data.matchType = ["FRIENDLY", "LEAGUE", "CUP", "TRAINING"].includes(String(data.matchType).toUpperCase())
        ? (String(data.matchType).toUpperCase() as MatchType)
        : null;
    }
    if (data.status) {
      data.status = ["SCHEDULED", "COMPLETED", "CANCELLED"].includes(String(data.status).toUpperCase())
        ? (String(data.status).toUpperCase() as MatchStatus)
        : MatchStatus.SCHEDULED;
    }

    // Parse dates
    if (data.date) {
      data.date = new Date(data.date);
    }
    if (data.reviewedAt) {
      data.reviewedAt = new Date(data.reviewedAt);
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data,
    });

    revalidatePath("/dashboard");
    revalidatePath("/matches");
    revalidatePath(`/matches/${matchId}`);

    return { success: true, match: updated };
  } catch (error) {
    console.error("Update match error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update match in database" };
  }
}

// 5. DELETE MATCH
export async function deleteMatch(id: string, userId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return { error: "Match not found" };
    }

    if (match.trainerId !== userId) {
      return { error: "Unauthorized to delete this match" };
    }

    await prisma.match.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/matches");

    return { success: true };
  } catch (error) {
    console.error("Delete match error:", error);
    return { error: error instanceof Error ? error.message : "Failed to delete match in database" };
  }
}
