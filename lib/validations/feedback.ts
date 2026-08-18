import { z } from "zod";

export const getFeedbackMessagesSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
});

export const createFeedbackMessageSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  content: z.string().min(1, "Message content cannot be empty"),
});
