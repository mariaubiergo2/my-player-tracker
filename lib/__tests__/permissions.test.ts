import { describe, it, expect } from "vitest";
import { UserRole } from "@prisma/client";
import {
  canEditMatchField,
  PLAYER_EDITABLE_FIELDS,
  TRAINER_EDITABLE_FIELDS,
} from "../permissions";

describe("canEditMatchField", () => {
  // Test fields
  const playerField = "name";
  const trainerField = "comment";
  const systemField = "id";
  const invalidField = "randomNonExistentField";

  describe("ADMIN Role", () => {
    it("should allow editing player editable fields", () => {
      expect(canEditMatchField(UserRole.ADMIN, playerField)).toBe(true);
      expect(canEditMatchField("ADMIN", playerField)).toBe(true);
    });

    it("should allow editing trainer editable fields", () => {
      expect(canEditMatchField(UserRole.ADMIN, trainerField)).toBe(true);
      expect(canEditMatchField("ADMIN", trainerField)).toBe(true);
    });

    it("should deny editing system/invalid fields", () => {
      expect(canEditMatchField(UserRole.ADMIN, systemField)).toBe(false);
      expect(canEditMatchField(UserRole.ADMIN, invalidField)).toBe(false);
    });
  });

  describe("TRAINER Role", () => {
    it("should allow editing trainer editable fields", () => {
      expect(canEditMatchField(UserRole.TRAINER, trainerField)).toBe(true);
      expect(canEditMatchField("TRAINER", trainerField)).toBe(true);
    });

    it("should deny editing player editable fields", () => {
      expect(canEditMatchField(UserRole.TRAINER, playerField)).toBe(false);
      expect(canEditMatchField("TRAINER", playerField)).toBe(false);
    });

    it("should deny editing system/invalid fields", () => {
      expect(canEditMatchField(UserRole.TRAINER, systemField)).toBe(false);
      expect(canEditMatchField(UserRole.TRAINER, invalidField)).toBe(false);
    });
  });

  describe("PLAYER and GOAL_KEEPER Roles", () => {
    const roles = [UserRole.PLAYER, UserRole.GOAL_KEEPER, "PLAYER", "GOAL_KEEPER"];

    it("should allow editing player editable fields", () => {
      roles.forEach((role) => {
        expect(canEditMatchField(role, playerField)).toBe(true);
      });
    });

    it("should deny editing trainer editable fields", () => {
      roles.forEach((role) => {
        expect(canEditMatchField(role, trainerField)).toBe(false);
      });
    });

    it("should deny editing system/invalid fields", () => {
      roles.forEach((role) => {
        expect(canEditMatchField(role, systemField)).toBe(false);
        expect(canEditMatchField(role, invalidField)).toBe(false);
      });
    });
  });

  describe("Edge cases and input validation", () => {
    it("should handle undefined and null-like inputs by returning false", () => {
      expect(canEditMatchField(undefined, playerField)).toBe(false);
      // If we pass empty string
      expect(canEditMatchField("", playerField)).toBe(false);
    });

    it("should handle unrecognized or invalid roles by returning false", () => {
      expect(canEditMatchField("SPECTATOR", playerField)).toBe(false);
      expect(canEditMatchField("GUEST", playerField)).toBe(false);
    });

    it("should handle case insensitivity correctly", () => {
      expect(canEditMatchField("admin", playerField)).toBe(true);
      expect(canEditMatchField("Admin", trainerField)).toBe(true);
      expect(canEditMatchField("trainer", trainerField)).toBe(true);
      expect(canEditMatchField("Trainer", playerField)).toBe(false);
      expect(canEditMatchField("player", playerField)).toBe(true);
      expect(canEditMatchField("Player", trainerField)).toBe(false);
      expect(canEditMatchField("goal_keeper", playerField)).toBe(true);
      expect(canEditMatchField("Goal_Keeper", playerField)).toBe(true);
    });
  });

  describe("All fields coverage verification", () => {
    it("should allow PLAYER to edit every single field inside PLAYER_EDITABLE_FIELDS", () => {
      PLAYER_EDITABLE_FIELDS.forEach((field) => {
        expect(canEditMatchField(UserRole.PLAYER, field)).toBe(true);
        expect(canEditMatchField(UserRole.GOAL_KEEPER, field)).toBe(true);
      });
    });

    it("should deny PLAYER from editing any field inside TRAINER_EDITABLE_FIELDS", () => {
      TRAINER_EDITABLE_FIELDS.forEach((field) => {
        expect(canEditMatchField(UserRole.PLAYER, field)).toBe(false);
        expect(canEditMatchField(UserRole.GOAL_KEEPER, field)).toBe(false);
      });
    });

    it("should allow TRAINER to edit every single field inside TRAINER_EDITABLE_FIELDS", () => {
      TRAINER_EDITABLE_FIELDS.forEach((field) => {
        expect(canEditMatchField(UserRole.TRAINER, field)).toBe(true);
      });
    });

    it("should deny TRAINER from editing any field inside PLAYER_EDITABLE_FIELDS", () => {
      PLAYER_EDITABLE_FIELDS.forEach((field) => {
        expect(canEditMatchField(UserRole.TRAINER, field)).toBe(false);
      });
    });

    it("should allow ADMIN to edit both PLAYER_EDITABLE_FIELDS and TRAINER_EDITABLE_FIELDS", () => {
      PLAYER_EDITABLE_FIELDS.forEach((field) => {
        expect(canEditMatchField(UserRole.ADMIN, field)).toBe(true);
      });
      TRAINER_EDITABLE_FIELDS.forEach((field) => {
        expect(canEditMatchField(UserRole.ADMIN, field)).toBe(true);
      });
    });
  });
});
