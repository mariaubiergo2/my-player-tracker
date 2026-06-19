// app/actions/matches.ts
"use server"

import { revalidatePath } from "next/cache";
import { Match, MATCHES, MatchStatus, MatchType } from "../matches/[identifier]/MATCHES"
import { redirect } from "next/navigation";
import { addMatch } from "../matches/[identifier]/MATCHES";



// 1. GET ALL MATCHES of a trainer
export async function getAllMatchesByTrainer(trainerId: string): Promise<Match[]> {
  return MATCHES.filter((m) => m.trainerId === trainerId).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// 2. GET SINGLE MATCH (for the detail page)
export async function getMatchById(matchId: string): Promise<Match | null> {
  return MATCHES.find((m) => m.id === matchId) ?? null;
}

// 3. CREATE MATCH
export async function createMatch(prevState: any, formData: FormData) {
  const name = formData.get('name')
  const description = formData.get('description')
  const location = formData.get('location')
  const date = formData.get('date')
  const startTime = formData.get('startTime')
  const endTime = formData.get('endTime')
  const opponent = formData.get('opponent')
  const matchType = formData.get('matchType')
  const status = formData.get('status')
  const playerId = formData.get('playerId')
  const trainerId = formData.get('trainerId')
  const teamId = formData.get('teamId')
  const comment = formData.get('comment')
  const trainerFeedback = formData.get('trainerFeedback')
  const playerReflection = formData.get('playerReflection')
  const mark = formData.get('mark')
  const intensity = formData.get('intensity')
  const attitude = formData.get('attitude')
  const performance = formData.get('performance')
  const goals = formData.get('goals')
  const assists = formData.get('assists')
  const minutesPlayed = formData.get('minutesPlayed')
  const strengths = formData.get('strengths')
  const weaknesses = formData.get('weaknesses')
  const improvementAreas = formData.get('improvementAreas')
  const isReviewed = formData.get('isReviewed')
  const reviewedAt = formData.get('reviewedAt')

  if (!name || !date || !status|| !trainerId || !playerId){
    // throw new Error("Missing required fields: name, date, status, trainerId and playerId are required");
    return { message: 'Missing required fields: name, date, status, trainerId and playerId are required' };
  }

  const newMatch: Match = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: name as string,
    description: description ? String(description) : undefined,
    location: location ? String(location) : undefined,
    date: date as string,
    startTime: startTime ? String(startTime) : undefined,
    endTime: endTime ? String(endTime) : undefined,
    opponent: opponent ? String(opponent) : undefined,
    matchType: matchType ? String(matchType) as MatchType : undefined,
    status: status as MatchStatus,
    playerId: playerId as string,
    trainerId: trainerId as string,
    teamId: teamId ? String(teamId) : undefined,
    comment: comment ? String(comment) : undefined,
    trainerFeedback: trainerFeedback ? String(trainerFeedback) : undefined,
    playerReflection: playerReflection ? String(playerReflection) : undefined,
    mark: mark ? Number(mark) : undefined,
    intensity: intensity ? Number(intensity) : undefined,
    attitude: attitude ? Number(attitude) : undefined,
    performance: performance ? Number(performance) : undefined,
    goals: goals ? Number(goals) : undefined,
    assists: assists ? Number(assists) : undefined,
    minutesPlayed: minutesPlayed ? Number(minutesPlayed) : undefined,
    strengths: strengths ? String(strengths).split(',').map((s) => s.trim()) : [],
    weaknesses: weaknesses ? String(weaknesses).split(',').map((s) => s.trim()) : [],
    improvementAreas: improvementAreas ? String(improvementAreas).split(',').map((s) => s.trim()) : [],
    isReviewed: isReviewed === "true" ? true : false,
    reviewedAt: reviewedAt ? String(reviewedAt) : undefined,
  }

  addMatch(newMatch);
  revalidatePath("/matches");
  redirect('/matches');

  return { message: "Success" };
}

// 3. UPDATE MATCH
export async function updateMatch(matchId: string, updates: Partial<Match>) {
  const matchIndex = MATCHES.findIndex((m) => m.id === matchId);

  if (matchIndex === -1) return null;

  MATCHES[matchIndex] = {
    ...MATCHES[matchIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return MATCHES[matchIndex];
}


