import { z } from "zod";

export const getNotificationsSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).default(20),
  filter: z.enum(["all", "unread", "read"]).default("all"),
  playerId: z.string().optional(),
  sortBy: z.enum(["date_desc", "date_asc", "player_asc"]).default("date_desc"),
  onlyRecent: z.boolean().default(true),
});

export const toggleNotificationReadStateSchema = z.object({
  notificationId: z.string().min(1, "Notification ID is required"),
  isRead: z.boolean(),
});

export const recipientIdSchema = z.string().min(1, "Recipient ID is required");

export const markMatchNotificationsAsReadSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  recipientId: z.string().min(1, "Recipient ID is required"),
});
