import { describe, it, expect } from "vitest";
import {
  createObjectiveRequestSchema,
  replyObjectiveRequestSchema,
} from "../objectivesRequests";

describe("objectivesRequests validations", () => {
  describe("createObjectiveRequestSchema", () => {
    it("should accept valid payload with reasonable reason length and type", () => {
      const payload = {
        reason: "Necessito nous objectius de cara al proper partit.",
        type: "ANALYSIS_VIDEO" as const,
      };
      const parsed = createObjectiveRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject reason under 5 characters", () => {
      const payload = {
        reason: "Hola",
        type: "ANALYSIS_VIDEO" as const,
      };
      const parsed = createObjectiveRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject reason over 500 characters", () => {
      const payload = {
        reason: "a".repeat(501),
        type: "ANALYSIS_VIDEO" as const,
      };
      const parsed = createObjectiveRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject missing type", () => {
      const payload = {
        reason: "Necessito nous objectius de cara al proper partit.",
      };
      const parsed = createObjectiveRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject invalid type value", () => {
      const payload = {
        reason: "Necessito nous objectius de cara al proper partit.",
        type: "INVALID_TYPE",
      };
      const parsed = createObjectiveRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });

  describe("replyObjectiveRequestSchema", () => {
    it("should accept valid payload with CUID requestId and valid quickResponseType", () => {
      const payload = {
        requestId: "cjld2cjxh0000qzrmn8ed3b6y",
        quickResponseType: "LOOKING_INTO_IT" as const,
      };
      const parsed = replyObjectiveRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject empty requestId", () => {
      const payload = {
        requestId: "",
        quickResponseType: "LOOKING_INTO_IT" as const,
      };
      const parsed = replyObjectiveRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject invalid quickResponseType", () => {
      const payload = {
        requestId: "cjld2cjxh0000qzrmn8ed3b6y",
        quickResponseType: "INVALID_REPLY",
      };
      const parsed = replyObjectiveRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });
});
