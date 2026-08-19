import { NotificationType } from "@prisma/client";

export interface DemoNotification {
  id: string;
  recipientKey: string;
  type: NotificationType;
  matchId: string | null;
  assignmentId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: "seed-notif-match-friendly-getafe",
    recipientKey: "player",
    type: NotificationType.MATCH_CREATED,
    matchId: "seed-match-friendly-getafe",
    assignmentId: null,
    isRead: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
  },
  {
    id: "seed-notif-fb-cup-barcelona",
    recipientKey: "player",
    type: NotificationType.FEEDBACK_MESSAGE_FROM_TRAINER,
    matchId: "seed-match-cup-barcelona",
    assignmentId: null,
    isRead: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: "seed-notif-q-send-player",
    recipientKey: "player",
    type: NotificationType.QUESTIONNAIRE_SENT,
    matchId: null,
    assignmentId: "seed-qa-send-player",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "seed-notif-q-send-goalkeeper",
    recipientKey: "goalkeeper",
    type: NotificationType.QUESTIONNAIRE_SENT,
    matchId: null,
    assignmentId: "seed-qa-send-goalkeeper",
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },
  {
    id: "seed-notif-q-resp-trainer",
    recipientKey: "trainer",
    type: NotificationType.QUESTIONNAIRE_RESPONDED,
    matchId: null,
    assignmentId: "seed-qa-send-player",
    isRead: false,
    createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago (1 hour after sent)
  },
  {
    id: "seed-notif-q-recl-trainer",
    recipientKey: "trainer",
    type: NotificationType.QUESTIONNAIRE_RECLAIMED,
    matchId: null,
    assignmentId: "seed-qa-send-player3",
    isRead: true,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
  },
];
