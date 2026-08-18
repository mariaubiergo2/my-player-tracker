import { describe, it, expect } from "vitest";
import { getFeedbackMessagesSchema, createFeedbackMessageSchema } from "../feedback";

describe("feedback validations", () => {
  describe("getFeedbackMessagesSchema", () => {
    it("should accept valid payload with matchId", () => {
      const payload = { matchId: "match-123" };
      const parsed = getFeedbackMessagesSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject empty or missing matchId", () => {
      const emptyMatchId = { matchId: "" };
      const missingMatchId = {};

      expect(getFeedbackMessagesSchema.safeParse(emptyMatchId).success).toBe(false);
      expect(getFeedbackMessagesSchema.safeParse(missingMatchId).success).toBe(false);
    });
  });

  describe("createFeedbackMessageSchema", () => {
    it("should accept valid payload with matchId and content", () => {
      const payload = { matchId: "match-123", content: "Great gameplay!" };
      const parsed = createFeedbackMessageSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject empty or missing matchId", () => {
      const emptyMatchId = { matchId: "", content: "Great gameplay!" };
      const missingMatchId = { content: "Great gameplay!" };

      expect(createFeedbackMessageSchema.safeParse(emptyMatchId).success).toBe(false);
      expect(createFeedbackMessageSchema.safeParse(missingMatchId).success).toBe(false);
    });

    it("should reject empty or missing content", () => {
      const emptyContent = { matchId: "match-123", content: "" };
      const missingContent = { matchId: "match-123" };

      expect(createFeedbackMessageSchema.safeParse(emptyContent).success).toBe(false);
      expect(createFeedbackMessageSchema.safeParse(missingContent).success).toBe(false);
    });
  });
});
