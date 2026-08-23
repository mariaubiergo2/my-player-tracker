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
        type: "ANALYSIS_VIDEO" as const,
      };
      const parsed = createObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject empty trainerId", () => {
      const payload = {
        trainerId: "",
        reason: "Necessito nous objectius de cara al proper partit.",
        type: "ANALYSIS_VIDEO" as const,
      };
      const parsed = createObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject reason under 5 characters", () => {
      const payload = {
        trainerId: "cjld2cjxh0000qzrmn8ed3b6y",
        reason: "Hola",
        type: "ANALYSIS_VIDEO" as const,
      };
      const parsed = createObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject reason over 500 characters", () => {
      const payload = {
        trainerId: "cjld2cjxh0000qzrmn8ed3b6y",
        reason: "a".repeat(501),
        type: "ANALYSIS_VIDEO" as const,
      };
      const parsed = createObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject missing type", () => {
      const payload = {
        trainerId: "cjld2cjxh0000qzrmn8ed3b6y",
        reason: "Necessito nous objectius de cara al proper partit.",
      };
      const parsed = createObjectivesRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject invalid type value", () => {
      const payload = {
        trainerId: "cjld2cjxh0000qzrmn8ed3b6y",
        reason: "Necessito nous objectius de cara al proper partit.",
        type: "INVALID_TYPE",
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

    it("should reject empty requestId", () => {
      const payload = {
        requestId: "",
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
