import { z } from "zod";

export const exerciseSchema = z.object({
  title: z.string().min(2, "El títol és obligatori (mínim 2 caràcters)"),
  description: z.string().optional().nullable(),
  repetitions: z.string().min(1, "Les repeticions són obligatòries (ex. 3x12)"),
  mediaType: z.enum(["IMAGE", "VIDEO_LINK"]).optional().nullable(),
  imageUrl: z.string().url("URL de la imatge no vàlida").optional().nullable().or(z.literal("")),
  videoUrl: z.string().url("URL del vídeo no vàlida").optional().nullable().or(z.literal("")),
});

export const sessionExerciseSchema = z.object({
  exerciseId: z.string().min(1, "ID de l'exercici obligatori"),
  order: z.number().int(),
  repetitionsOverride: z.string().optional().nullable().or(z.literal("")),
});

export const trainingSessionSchema = z.object({
  title: z.string().min(2, "El títol de la sessió és obligatori"),
  order: z.number().int(),
  recurrenceDays: z.array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)),
  exercises: z.array(sessionExerciseSchema),
});

export const trainingPlanSchema = z.object({
  title: z.string().min(2, "El títol del pla és obligatori"),
  description: z.string().optional().nullable(),
  sessions: z.array(trainingSessionSchema),
});

export const trainingFeedbackSchema = z.object({
  sessionId: z.string().optional().nullable(),
  assignmentId: z.string().optional().nullable(),
  comment: z.string().min(2, "El comentari és obligatori"),
  videoUrl: z.string().url("URL no vàlida").optional().nullable().or(z.literal("")),
});
