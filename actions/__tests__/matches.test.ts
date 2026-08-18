import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { generateToken } from "@/lib/auth";
import { createMatch, updateMatch, deleteMatch } from "../matches";

// Define mock get functions and state using vi.hoisted to prevent hoisting reference errors
const { mockRevalidatePath, mockRedirect, mockGetCookie, authState } = vi.hoisted(() => {
  const authState = { currentAuthToken: null as string | null };
  const mockGetCookie = vi.fn((key: string) => {
    if (key === "auth_token") {
      return authState.currentAuthToken ? { value: authState.currentAuthToken } : undefined;
    }
    if (key === "locale") {
      return { value: "es" };
    }
    return undefined;
  });

  return {
    mockRevalidatePath: vi.fn(),
    mockRedirect: vi.fn(),
    mockGetCookie,
    authState,
  };
});

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(() => {
    return Promise.resolve({
      get: mockGetCookie,
    });
  }),
}));

// Mock next/navigation redirect
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`Redirect to ${url}`);
  },
}));

// Mock next/cache revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

async function authenticateUser(user: { id: string; email: string; name: string; role: UserRole }) {
  authState.currentAuthToken = await generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

function clearAuthentication() {
  authState.currentAuthToken = null;
}

function buildMatchFormData(fields: Record<string, string>) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, val]) => {
    formData.append(key, val);
  });
  return formData;
}

describe("Matches Server Actions - Authorization Tests", () => {
  beforeEach(() => {
    clearAuthentication();
    vi.clearAllMocks();
  });

  describe("deleteMatch", () => {
    it("should allow a player to delete their own match", async () => {
      // Seed user and match
      const player = await prisma.user.create({
        data: {
          name: "John",
          surname: "Doe",
          email: "john@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const match = await prisma.match.create({
        data: {
          name: "Match 1",
          date: new Date("2026-08-18"),
          playerId: player.id,
        },
      });

      await authenticateUser(player);

      const result = await deleteMatch(match.id);
      expect(result).toEqual({ success: true });

      // Verify DB
      const deletedMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(deletedMatch).toBeNull();
    });

    it("should prevent a player from deleting another player's match (regression detector)", async () => {
      // Seed two players and a match
      const player1 = await prisma.user.create({
        data: {
          name: "Player1",
          surname: "One",
          email: "p1@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const player2 = await prisma.user.create({
        data: {
          name: "Player2",
          surname: "Two",
          email: "p2@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const match = await prisma.match.create({
        data: {
          name: "Match 2",
          date: new Date("2026-08-18"),
          playerId: player1.id,
        },
      });

      await authenticateUser(player2);

      const result = await deleteMatch(match.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized to delete this match");

      // Verify DB: match must still exist
      const existingMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(existingMatch).not.toBeNull();
    });

    it("should allow a trainer linked to the match/player to delete it", async () => {
      // Seed trainer and player linked to trainer
      const trainer = await prisma.user.create({
        data: {
          name: "Trainer",
          surname: "One",
          email: "t1@test.com",
          password: "hash",
          role: UserRole.TRAINER,
        },
      });

      const player = await prisma.user.create({
        data: {
          name: "Player",
          surname: "One",
          email: "p@test.com",
          password: "hash",
          role: UserRole.PLAYER,
          trainers: {
            connect: { id: trainer.id },
          },
        },
      });

      const match = await prisma.match.create({
        data: {
          name: "Match 3",
          date: new Date("2026-08-18"),
          playerId: player.id,
        },
      });

      await authenticateUser(trainer);

      const result = await deleteMatch(match.id);
      expect(result).toEqual({ success: true });

      // Verify DB
      const deletedMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(deletedMatch).toBeNull();
    });

    it("should prevent a trainer not linked to the match/player from deleting it", async () => {
      // Seed trainer and player not linked
      const trainerNotLinked = await prisma.user.create({
        data: {
          name: "TrainerNotLinked",
          surname: "One",
          email: "tnl@test.com",
          password: "hash",
          role: UserRole.TRAINER,
        },
      });

      const player = await prisma.user.create({
        data: {
          name: "Player",
          surname: "One",
          email: "p@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const match = await prisma.match.create({
        data: {
          name: "Match 4",
          date: new Date("2026-08-18"),
          playerId: player.id,
        },
      });

      await authenticateUser(trainerNotLinked);

      const result = await deleteMatch(match.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized to delete this match");

      // Verify DB
      const existingMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(existingMatch).not.toBeNull();
    });

    it("should allow an admin to delete any match", async () => {
      const admin = await prisma.user.create({
        data: {
          name: "Admin",
          surname: "One",
          email: "admin@test.com",
          password: "hash",
          role: UserRole.ADMIN,
        },
      });

      const player = await prisma.user.create({
        data: {
          name: "Player",
          surname: "One",
          email: "p@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const match = await prisma.match.create({
        data: {
          name: "Match 5",
          date: new Date("2026-08-18"),
          playerId: player.id,
        },
      });

      await authenticateUser(admin);

      const result = await deleteMatch(match.id);
      expect(result).toEqual({ success: true });

      // Verify DB
      const deletedMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(deletedMatch).toBeNull();
    });

    it("should reject delete if no user session is present", async () => {
      const player = await prisma.user.create({
        data: {
          name: "Player",
          surname: "One",
          email: "p@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const match = await prisma.match.create({
        data: {
          name: "Match 6",
          date: new Date("2026-08-18"),
          playerId: player.id,
        },
      });

      clearAuthentication();

      const result = await deleteMatch(match.id);
      expect(result).toEqual({ success: false, error: "Unauthorized" });

      // Verify DB
      const existingMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(existingMatch).not.toBeNull();
    });
  });

  describe("updateMatch", () => {
    it("should allow a player to update PLAYER_EDITABLE_FIELDS of their own match", async () => {
      const player = await prisma.user.create({
        data: {
          name: "John",
          surname: "Doe",
          email: "john@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const match = await prisma.match.create({
        data: {
          name: "Original Name",
          date: new Date("2026-08-18"),
          playerId: player.id,
          kitColor: "Red",
          shirtNumber: "7",
          position: "Striker",
          matchUrl: "http://original.com",
        },
      });

      await authenticateUser(player);

      const updates = {
        name: "Updated Name",
        description: "New Description",
      };

      const result = await updateMatch(match.id, updates);
      expect(result.success).toBe(true);

      // Verify DB
      const updatedMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(updatedMatch?.name).toBe("Updated Name");
      expect(updatedMatch?.description).toBe("New Description");
    });

    it("should ignore TRAINER_EDITABLE_FIELDS when updated by a player", async () => {
      const player = await prisma.user.create({
        data: {
          name: "John",
          surname: "Doe",
          email: "john@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const match = await prisma.match.create({
        data: {
          name: "Original Name",
          date: new Date("2026-08-18"),
          playerId: player.id,
          kitColor: "Red",
          shirtNumber: "7",
          position: "Striker",
          matchUrl: "http://original.com",
          comment: "Original Comment",
          mark: 5,
        },
      });

      await authenticateUser(player);

      const updates = {
        name: "Updated Name",
        comment: "Hacked Comment", // Trainer field!
        mark: 10,                 // Trainer field!
      };

      const result = await updateMatch(match.id, updates as any);
      expect(result.success).toBe(true);

      // Verify DB: Player field updated, trainer fields ignored
      const updatedMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(updatedMatch?.name).toBe("Updated Name");
      expect(updatedMatch?.comment).toBe("Original Comment");
      expect(updatedMatch?.mark).toBe(5);
    });

    it("should prevent a player from updating another player's match", async () => {
      const player1 = await prisma.user.create({
        data: {
          name: "Player 1",
          surname: "One",
          email: "p1@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const player2 = await prisma.user.create({
        data: {
          name: "Player 2",
          surname: "Two",
          email: "p2@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const match = await prisma.match.create({
        data: {
          name: "Original Name",
          date: new Date("2026-08-18"),
          playerId: player1.id,
        },
      });

      await authenticateUser(player2);

      const result = await updateMatch(match.id, { name: "Updated Name" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized to edit this match");

      // Verify DB
      const dbMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(dbMatch?.name).toBe("Original Name");
    });

    it("should allow a trainer to update TRAINER_EDITABLE_FIELDS of their player's match", async () => {
      const trainer = await prisma.user.create({
        data: {
          name: "Trainer",
          surname: "One",
          email: "t1@test.com",
          password: "hash",
          role: UserRole.TRAINER,
        },
      });

      const player = await prisma.user.create({
        data: {
          name: "Player",
          surname: "One",
          email: "p@test.com",
          password: "hash",
          role: UserRole.PLAYER,
          trainers: {
            connect: { id: trainer.id },
          },
        },
      });

      const match = await prisma.match.create({
        data: {
          name: "Match Name",
          date: new Date("2026-08-18"),
          playerId: player.id,
          comment: "Old comment",
          mark: 5,
        },
      });

      await authenticateUser(trainer);

      const updates = {
        comment: "Excellent performance",
        mark: 9,
        name: "Hacked Player Name", // Player field!
      };

      const result = await updateMatch(match.id, updates as any);
      expect(result.success).toBe(true);

      // Verify DB: Trainer fields updated, player field ignored
      const updatedMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(updatedMatch?.comment).toBe("Excellent performance");
      expect(updatedMatch?.mark).toBe(9);
      expect(updatedMatch?.name).toBe("Match Name");
    });

    it("should allow an admin to update any field on any match", async () => {
      const admin = await prisma.user.create({
        data: {
          name: "Admin",
          surname: "One",
          email: "admin@test.com",
          password: "hash",
          role: UserRole.ADMIN,
        },
      });

      const player = await prisma.user.create({
        data: {
          name: "Player",
          surname: "One",
          email: "p@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const match = await prisma.match.create({
        data: {
          name: "Match Name",
          date: new Date("2026-08-18"),
          playerId: player.id,
          comment: "Old comment",
          mark: 5,
        },
      });

      await authenticateUser(admin);

      const updates = {
        name: "Admin Updated Name",
        comment: "Admin Updated Comment",
        mark: 10,
      };

      const result = await updateMatch(match.id, updates as any);
      expect(result.success).toBe(true);

      // Verify DB
      const updatedMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(updatedMatch?.name).toBe("Admin Updated Name");
      expect(updatedMatch?.comment).toBe("Admin Updated Comment");
      expect(updatedMatch?.mark).toBe(10);
    });
  });

  describe("createMatch", () => {
    it("should allow a player to create a match for themselves", async () => {
      const player = await prisma.user.create({
        data: {
          name: "John",
          surname: "Doe",
          email: "john@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      await authenticateUser(player);

      const formData = buildMatchFormData({
        name: "New Player Match",
        date: "2026-08-18",
        kitColor: "Blue",
        shirtNumber: "10",
        position: "Midfielder",
        matchUrl: "https://youtube.com/match",
      });

      // It redirects to /dashboard upon success
      try {
        await createMatch(null, formData);
      } catch (err: any) {
        expect(err.message).toContain("Redirect to /dashboard");
      }

      // Verify DB
      const createdMatches = await prisma.match.findMany({
        where: { playerId: player.id },
      });
      expect(createdMatches.length).toBe(1);
      expect(createdMatches[0].name).toBe("New Player Match");
      expect(createdMatches[0].kitColor).toBe("Blue");
    });

    it("should prevent a player from creating a match for another player (auto-override playerId)", async () => {
      const player1 = await prisma.user.create({
        data: {
          name: "Player 1",
          surname: "One",
          email: "p1@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      const player2 = await prisma.user.create({
        data: {
          name: "Player 2",
          surname: "Two",
          email: "p2@test.com",
          password: "hash",
          role: UserRole.PLAYER,
        },
      });

      await authenticateUser(player1);

      const formData = buildMatchFormData({
        name: "Hacked Match Target",
        date: "2026-08-18",
        kitColor: "Blue",
        shirtNumber: "10",
        position: "Midfielder",
        matchUrl: "https://youtube.com/match",
        playerId: player2.id, // Player 1 tries to assign it to Player 2
      });

      try {
        await createMatch(null, formData);
      } catch (err: any) {
        expect(err.message).toContain("Redirect to /dashboard");
      }

      // Verify DB: The match should have been created, but playerId MUST be player1.id, NOT player2.id!
      const player2Matches = await prisma.match.findMany({ where: { playerId: player2.id } });
      expect(player2Matches.length).toBe(0);

      const player1Matches = await prisma.match.findMany({ where: { playerId: player1.id } });
      expect(player1Matches.length).toBe(1);
      expect(player1Matches[0].name).toBe("Hacked Match Target");
    });
  });
});
