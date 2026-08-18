import { describe, it, expect } from "vitest";
import { UserRole } from "@prisma/client";
import { createUserSchema, updateUserSchema, updateProfileSchema } from "../users";

describe("users validations", () => {
  describe("createUserSchema", () => {
    it("should accept valid payload with minimum required fields and correct enum role", () => {
      const payload = {
        name: "John",
        surname: "Doe",
        email: "john@example.com",
        role: UserRole.PLAYER,
      };
      const parsed = createUserSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject missing required fields", () => {
      const missingName = { surname: "Doe", email: "john@example.com", role: UserRole.PLAYER };
      const missingSurname = { name: "John", email: "john@example.com", role: UserRole.PLAYER };
      const missingEmail = { name: "John", surname: "Doe", role: UserRole.PLAYER };
      const missingRole = { name: "John", surname: "Doe", email: "john@example.com" };

      expect(createUserSchema.safeParse(missingName).success).toBe(false);
      expect(createUserSchema.safeParse(missingSurname).success).toBe(false);
      expect(createUserSchema.safeParse(missingEmail).success).toBe(false);
      expect(createUserSchema.safeParse(missingRole).success).toBe(false);
    });

    it("should reject invalid email format", () => {
      const payload = {
        name: "John",
        surname: "Doe",
        email: "not-an-email",
        role: UserRole.PLAYER,
      };
      expect(createUserSchema.safeParse(payload).success).toBe(false);
    });

    it("should reject invalid role enum values", () => {
      const payload = {
        name: "John",
        surname: "Doe",
        email: "john@example.com",
        role: "INVALID_ROLE",
      };
      expect(createUserSchema.safeParse(payload).success).toBe(false);
    });

    it("should document that role is accepted in payload (security risk note)", () => {
      // The schema alone does not prevent setting a role like ADMIN from input.
      // Protection against non-admins setting their own role is implemented in permission/auth layer.
      const payload = {
        name: "John",
        surname: "Doe",
        email: "john@example.com",
        role: UserRole.ADMIN,
      };
      const parsed = createUserSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.role).toBe(UserRole.ADMIN);
      }
    });
  });

  describe("updateUserSchema", () => {
    it("should accept empty payload or partial fields", () => {
      const emptyPayload = {};
      const partialPayload = { name: "Jane", role: UserRole.TRAINER };

      expect(updateUserSchema.safeParse(emptyPayload).success).toBe(true);
      expect(updateUserSchema.safeParse(partialPayload).success).toBe(true);
    });

    it("should reject empty string for name if name is provided", () => {
      const payload = { name: "" };
      expect(updateUserSchema.safeParse(payload).success).toBe(false);
    });

    it("should reject invalid email if email is provided", () => {
      const payload = { email: "invalid-email" };
      expect(updateUserSchema.safeParse(payload).success).toBe(false);
    });
  });

  describe("updateProfileSchema", () => {
    it("should accept valid payload with name, surname, email", () => {
      const payload = {
        name: "John",
        surname: "Doe",
        email: "john@example.com",
      };
      const parsed = updateProfileSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("should reject empty name or surname", () => {
      const emptyName = { name: "", surname: "Doe", email: "john@example.com" };
      const emptySurname = { name: "John", surname: "", email: "john@example.com" };

      expect(updateProfileSchema.safeParse(emptyName).success).toBe(false);
      expect(updateProfileSchema.safeParse(emptySurname).success).toBe(false);
    });
  });
});
