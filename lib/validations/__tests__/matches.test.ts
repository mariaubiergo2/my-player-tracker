import { describe, it, expect } from "vitest";
import { MatchType } from "@prisma/client";
import { createMatchSchema, updateMatchSchema } from "../matches";

describe("matches validations", () => {
  describe("createMatchSchema / matchSchema", () => {
    it("should accept valid payload with minimum required fields and correct default values", () => {
      const payload = {
        name: "Friendly Match",
        date: new Date("2026-08-18T00:00:00.000Z"),
        playerId: "player-123",
      };
      const parsed = createMatchSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe("Friendly Match");
        expect(parsed.data.date).toBeInstanceOf(Date);
        expect(parsed.data.playerId).toBe("player-123");
        expect(parsed.data.isReviewed).toBe(false);
        expect(parsed.data.strengths).toEqual([]);
        expect(parsed.data.weaknesses).toEqual([]);
        expect(parsed.data.improvementAreas).toEqual([]);
      }
    });

    it("should transform string checkbox values to boolean", () => {
      const payloadTrueStr = {
        name: "Friendly Match",
        date: "2026-08-18",
        playerId: "player-123",
        isHome: "true",
        isReviewed: "on",
      };
      const parsedTrue = createMatchSchema.safeParse(payloadTrueStr);
      expect(parsedTrue.success).toBe(true);
      if (parsedTrue.success) {
        expect(parsedTrue.data.isHome).toBe(true);
        expect(parsedTrue.data.isReviewed).toBe(true);
      }

      const payloadOnStr = {
        name: "Friendly Match",
        date: "2026-08-18",
        playerId: "player-123",
        isHome: "on",
      };
      const parsedOn = createMatchSchema.safeParse(payloadOnStr);
      expect(parsedOn.success).toBe(true);
      if (parsedOn.success) {
        expect(parsedOn.data.isHome).toBe(true);
      }
    });

    it("should parse date strings into Date objects", () => {
      const payload = {
        name: "Friendly Match",
        date: "2026-08-18T10:00:00.000Z",
        playerId: "player-123",
        reviewedAt: "2026-08-18T12:00:00.000Z",
      };
      const parsed = createMatchSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.date).toBeInstanceOf(Date);
        expect(parsed.data.date.toISOString()).toBe("2026-08-18T10:00:00.000Z");
        expect(parsed.data.reviewedAt).toBeInstanceOf(Date);
        expect(parsed.data.reviewedAt?.toISOString()).toBe("2026-08-18T12:00:00.000Z");
      }
    });

    it("should transform matchType to uppercase MatchType or null", () => {
      const payloadLeague = {
        name: "Friendly Match",
        date: "2026-08-18",
        playerId: "player-123",
        matchType: "league",
      };
      const parsedLeague = createMatchSchema.safeParse(payloadLeague);
      expect(parsedLeague.success).toBe(true);
      if (parsedLeague.success) {
        expect(parsedLeague.data.matchType).toBe(MatchType.LEAGUE);
      }

      const payloadEmpty = {
        name: "Friendly Match",
        date: "2026-08-18",
        playerId: "player-123",
        matchType: "",
      };
      const parsedEmpty = createMatchSchema.safeParse(payloadEmpty);
      expect(parsedEmpty.success).toBe(true);
      if (parsedEmpty.success) {
        expect(parsedEmpty.data.matchType).toBeNull();
      }
    });

    it("should coerce string numbers to integer types and handle empty strings", () => {
      const payload = {
        name: "Friendly Match",
        date: "2026-08-18",
        playerId: "player-123",
        mark: "8",
        intensity: "7",
        goals: "",
        assists: 2,
      };
      const parsed = createMatchSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.mark).toBe(8);
        expect(parsed.data.intensity).toBe(7);
        expect(parsed.data.goals).toBeNull();
        expect(parsed.data.assists).toBe(2);
      }
    });

    it("should coerce comma-separated string lists to array of trimmed values", () => {
      const payload = {
        name: "Friendly Match",
        date: "2026-08-18",
        playerId: "player-123",
        strengths: "Speed, Passing , Shooting,",
        weaknesses: ["Defense", "Tackling"],
        improvementAreas: "",
      };
      const parsed = createMatchSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.strengths).toEqual(["Speed", "Passing", "Shooting"]);
        expect(parsed.data.weaknesses).toEqual(["Defense", "Tackling"]);
        expect(parsed.data.improvementAreas).toEqual([]);
      }
    });

    it("should reject missing required fields and completely invalid types", () => {
      const missingName = { date: "2026-08-18", playerId: "player-123" };
      const missingPlayerId = { name: "Friendly Match", date: "2026-08-18" };
      const wrongTypeDate = { name: "Friendly Match", date: true, playerId: "player-123" };
      const wrongTypeMark = { name: "Friendly Match", date: "2026-08-18", playerId: "player-123", mark: true };

      expect(createMatchSchema.safeParse(missingName).success).toBe(false);
      expect(createMatchSchema.safeParse(missingPlayerId).success).toBe(false);
      expect(createMatchSchema.safeParse(wrongTypeDate).success).toBe(false);
      expect(createMatchSchema.safeParse(wrongTypeMark).success).toBe(false);
    });

    it("should accept but result in NaN / Invalid Date when string coercions fail", () => {
      const invalidDate = { name: "Friendly Match", date: "not-a-date", playerId: "player-123" };
      const invalidNumber = { name: "Friendly Match", date: "2026-08-18", playerId: "player-123", mark: "not-a-number" };

      const parsedDate = createMatchSchema.safeParse(invalidDate);
      expect(parsedDate.success).toBe(true);
      if (parsedDate.success) {
        expect(isNaN(parsedDate.data.date.getTime())).toBe(true);
      }

      const parsedNumber = createMatchSchema.safeParse(invalidNumber);
      expect(parsedNumber.success).toBe(true);
      if (parsedNumber.success) {
        expect(Number.isNaN(parsedNumber.data.mark)).toBe(true);
      }
    });
  });

  describe("updateMatchSchema", () => {
    it("should allow partial payload updates", () => {
      const payload = { name: "Updated Name" };
      const parsed = updateMatchSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe("Updated Name");
        expect((parsed.data as any).playerId).toBeUndefined();
      }
    });

    it("should strip/ignore playerId if it is passed in the payload (security boundary check)", () => {
      const payload = {
        name: "Updated Name",
        playerId: "hacker-player-id",
      };
      const parsed = updateMatchSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe("Updated Name");
        // Verify that playerId is stripped because updateMatchSchema omits playerId
        expect((parsed.data as any).playerId).toBeUndefined();
      }
    });
  });
});
