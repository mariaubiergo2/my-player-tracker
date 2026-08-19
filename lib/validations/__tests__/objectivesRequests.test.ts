import { describe, it, expect } from "vitest";
import {
  createObjectivesRequestSchema,
  replyObjectivesRequestSchema,
} from "../objectivesRequests";

describe("objectivesRequests validations", () => {
  describe("createObjectivesRequestSchema", () => {
    it("should accept valid payload with CUID trainerId and reasonable reason length", () => {
      const payload = {
        trainerId: "cjld2cjxh0000qzrmn8ed3b6y",
        reason: "Necessito nous objectius de cara al proper partit.",
      };
      const parsed = createObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject non-cuid trainerId", () => {
      const payload = {
        trainerId: "not-a-cuid",
        reason: "Necessito nous objectius de cara al proper partit.",
      };
      const parsed = createObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject reason under 5 characters", () => {
      const payload = {
        trainerId: "cjld2cjxh0000qzrmn8ed3b6y",
        reason: "Hola",
      };
      const parsed = createObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject reason over 500 characters", () => {
      const payload = {
        trainerId: "cjld2cjxh0000qzrmn8ed3b6y",
        reason: "a".repeat(501),
      };
      const parsed = createObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });

  describe("replyObjectivesRequestSchema", () => {
    it("should accept valid payload with CUID requestId and reasonable reply length", () => {
      const payload = {
        requestId: "cjld2cjxh0000qzrmn8ed3b6y",
        reply: "Ho parlem al proper entrenament",
      };
      const parsed = replyObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject non-cuid requestId", () => {
      const payload = {
        requestId: "not-a-cuid",
        reply: "Ho parlem al proper entrenament",
      };
      const parsed = replyObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject empty reply", () => {
      const payload = {
        requestId: "cjld2cjxh0000qzrmn8ed3b6y",
        reply: "",
      };
      const parsed = replyObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject reply over 120 characters", () => {
      const payload = {
        requestId: "cjld2cjxh0000qzrmn8ed3b6y",
        reply: "a".repeat(121),
      };
      const parsed = replyObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });
});
