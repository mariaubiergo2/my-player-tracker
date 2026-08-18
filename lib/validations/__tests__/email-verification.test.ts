import { describe, it, expect } from "vitest";
import { verifyEmailCodeSchema, resendVerificationCodeSchema } from "../email-verification";

describe("email-verification validations", () => {
  describe("verifyEmailCodeSchema", () => {
    it("should accept valid payload with exactly 6-digit code", () => {
      const payload = { userId: "user-123", code: "123456" };
      const parsed = verifyEmailCodeSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject verification code that is not exactly 6 digits", () => {
      const shortCode = { userId: "user-123", code: "12345" };
      const longCode = { userId: "user-123", code: "1234567" };
      
      const shortParsed = verifyEmailCodeSchema.safeParse(shortCode);
      const longParsed = verifyEmailCodeSchema.safeParse(longCode);

      expect(shortParsed.success).toBe(false);
      expect(longParsed.success).toBe(false);
    });

    it("should reject empty/missing userId", () => {
      const missingUserId = { code: "123456" };
      const emptyUserId = { userId: "", code: "123456" };

      const missingParsed = verifyEmailCodeSchema.safeParse(missingUserId);
      const emptyParsed = verifyEmailCodeSchema.safeParse(emptyUserId);

      expect(missingParsed.success).toBe(false);
      expect(emptyParsed.success).toBe(false);
    });
  });

  describe("resendVerificationCodeSchema", () => {
    it("should accept a valid email payload", () => {
      const payload = { email: "player@tracker.com" };
      const parsed = resendVerificationCodeSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject an invalid email address", () => {
      const payload = { email: "invalid-email" };
      const parsed = resendVerificationCodeSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("should reject a missing email", () => {
      const payload = {};
      const parsed = resendVerificationCodeSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });
});
