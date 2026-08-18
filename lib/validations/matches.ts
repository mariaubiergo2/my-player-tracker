import { z } from "zod";
import { MatchType } from "@prisma/client";

export const matchSchema = z.object({
  name: z.string().min(1, "Match name is required"),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  isHome: z.union([z.boolean(), z.string().transform(v => v === "on" || v === "true")]).optional().nullable(),
  matchUrl: z.string().optional().nullable(),
  kitColor: z.string().optional().nullable(),
  shirtNumber: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  minutesPlayed: z.string().optional().nullable(),
  date: z.union([z.date(), z.string().transform(v => new Date(v))]),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  opponent: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  leaguePosition: z.string().optional().nullable(),
  matchType: z.union([z.nativeEnum(MatchType), z.string().transform(v => v === "" ? null : v.toUpperCase() as MatchType)]).optional().nullable(),
  competitionType: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  trainerFeedback: z.string().optional().nullable(),
  playerReflection: z.string().optional().nullable(),
  mark: z.union([z.number(), z.string().transform(v => v === "" ? null : parseInt(v, 10))]).optional().nullable(),
  intensity: z.union([z.number(), z.string().transform(v => v === "" ? null : parseInt(v, 10))]).optional().nullable(),
  attitude: z.union([z.number(), z.string().transform(v => v === "" ? null : parseInt(v, 10))]).optional().nullable(),
  performance: z.union([z.number(), z.string().transform(v => v === "" ? null : parseInt(v, 10))]).optional().nullable(),
  goals: z.union([z.number(), z.string().transform(v => v === "" ? null : parseInt(v, 10))]).optional().nullable(),
  assists: z.union([z.number(), z.string().transform(v => v === "" ? null : parseInt(v, 10))]).optional().nullable(),
  strengths: z.union([z.array(z.string()), z.string().transform(s => s.split(",").map(x => x.trim()).filter(Boolean))]).default([]),
  weaknesses: z.union([z.array(z.string()), z.string().transform(s => s.split(",").map(x => x.trim()).filter(Boolean))]).default([]),
  improvementAreas: z.union([z.array(z.string()), z.string().transform(s => s.split(",").map(x => x.trim()).filter(Boolean))]).default([]),
  offensiveActionsOwnHalf: z.string().optional().nullable(),
  offensiveActionsOpponentHalf: z.string().optional().nullable(),
  defensiveActionsOwnHalf: z.string().optional().nullable(),
  defensiveActionsOpponentHalf: z.string().optional().nullable(),
  isReviewed: z.union([z.boolean(), z.string().transform(v => v === "on" || v === "true")]).default(false),
  reviewedAt: z.union([z.date(), z.string().transform(v => new Date(v))]).optional().nullable(),
  playerId: z.string().min(1, "Player ID is required"),
  trainerId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
});

export const createMatchSchema = matchSchema;

export const updateMatchSchema = matchSchema.partial().omit({ playerId: true });
export type UpdateMatchInput = z.input<typeof updateMatchSchema>;
