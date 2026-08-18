import { describe, it, expect } from "vitest";
import {
  getNotificationsSchema,
  toggleNotificationReadStateSchema,
  recipientIdSchema,
  markMatchNotificationsAsReadSchema,
} from "../notifications";

describe("notifications validations", () => {
  describe("getNotificationsSchema", () => {
    it("should accept valid payload and assign correct default values", () => {
      const payload = { recipientId: "user-123" };
      const parsed = getNotificationsSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual({
          recipientId: "user-123",
          page: 1,
          limit: 20,
          filter: "all",
          sortBy: "date_desc",
          onlyRecent: true,
        });
      }
    });

    it("should accept fully populated valid payload", () => {
      const payload = {
        recipientId: "user-123",
        page: 3,
        limit: 15,
        filter: "unread",
        playerId: "player-456",
        sortBy: "player_asc",
        onlyRecent: false,
      };
      const parsed = getNotificationsSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject invalid pagination values", () => {
      const negativePage = { recipientId: "user-123", page: -1 };
      const zeroPage = { recipientId: "user-123", page: 0 };
      const nonIntPage = { recipientId: "user-123", page: 2.5 };
      const negativeLimit = { recipientId: "user-123", limit: -5 };

      expect(getNotificationsSchema.safeParse(negativePage).success).toBe(false);
      expect(getNotificationsSchema.safeParse(zeroPage).success).toBe(false);
      expect(getNotificationsSchema.safeParse(nonIntPage).success).toBe(false);
      expect(getNotificationsSchema.safeParse(negativeLimit).success).toBe(false);
    });

    it("should reject invalid filter enum values", () => {
      const payload = { recipientId: "user-123", filter: "archived" };
      expect(getNotificationsSchema.safeParse(payload).success).toBe(false);
    });

    it("should reject invalid sortBy enum values", () => {
      const payload = { recipientId: "user-123", sortBy: "title_asc" };
      expect(getNotificationsSchema.safeParse(payload).success).toBe(false);
    });

    it("should document that it does not prevent passing a custom recipientId (security constraint check)", () => {
      // The schema itself doesn't check if the request recipient matches the session recipient.
      // This is a business/auth logic constraint, not a Zod schema validation constraint.
      const payload = { recipientId: "some-other-user-id" };
      const parsed = getNotificationsSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.recipientId).toBe("some-other-user-id");
      }
    });
  });

  describe("toggleNotificationReadStateSchema", () => {
    it("should accept valid payload with notificationId and isRead boolean", () => {
      const payload = { notificationId: "notif-123", isRead: true };
      const parsed = toggleNotificationReadStateSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject missing or empty notificationId", () => {
      const emptyNotif = { notificationId: "", isRead: true };
      const missingNotif = { isRead: true };

      expect(toggleNotificationReadStateSchema.safeParse(emptyNotif).success).toBe(false);
      expect(toggleNotificationReadStateSchema.safeParse(missingNotif).success).toBe(false);
    });

    it("should reject invalid or missing isRead type", () => {
      const missingIsRead = { notificationId: "notif-123" };
      const invalidIsRead = { notificationId: "notif-123", isRead: "true" }; // string

      expect(toggleNotificationReadStateSchema.safeParse(missingIsRead).success).toBe(false);
      expect(toggleNotificationReadStateSchema.safeParse(invalidIsRead).success).toBe(false);
    });
  });

  describe("recipientIdSchema", () => {
    it("should accept a valid non-empty string", () => {
      const parsed = recipientIdSchema.safeParse("user-123");
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toBe("user-123");
      }
    });

    it("should reject empty or invalid values", () => {
      expect(recipientIdSchema.safeParse("").success).toBe(false);
      expect(recipientIdSchema.safeParse(undefined).success).toBe(false);
    });
  });

  describe("markMatchNotificationsAsReadSchema", () => {
    it("should accept valid matchId and recipientId", () => {
      const payload = { matchId: "match-123", recipientId: "user-123" };
      const parsed = markMatchNotificationsAsReadSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject empty fields", () => {
      const emptyMatch = { matchId: "", recipientId: "user-123" };
      const emptyRecipient = { matchId: "match-123", recipientId: "" };

      expect(markMatchNotificationsAsReadSchema.safeParse(emptyMatch).success).toBe(false);
      expect(markMatchNotificationsAsReadSchema.safeParse(emptyRecipient).success).toBe(false);
    });
  });
});
