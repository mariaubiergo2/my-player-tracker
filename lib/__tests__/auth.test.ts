import { describe, it, expect, vi } from "vitest";
import { UserRole } from "@prisma/client";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

// Define mock get function for cookies dynamically
const mockGetCookie = vi.fn();

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(() => {
    return Promise.resolve({
      get: mockGetCookie,
    });
  }),
}));

import {
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  extractTokenFromRequest,
  setAuthCookie,
  clearAuthCookie,
  getAuthToken,
  getCurrentUser,
} from "../auth";

describe("Authentication Helpers (Group A - Pure Functions)", () => {
  describe("hashPassword and verifyPassword", () => {
    const password = "mySecurePassword123";

    it("should hash and verify a password successfully", async () => {
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("wrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("should generate different hashes for the same password due to random salt", async () => {
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("generateToken and verifyToken (Round-trip)", () => {
    const mockUser = {
      id: "user-123",
      email: "player@tracker.com",
      name: "Juan Pérez",
      role: UserRole.PLAYER,
      avatarUrl: "http://example.com/avatar.png",
    };

    it("should generate a token and decode it correctly for each role", async () => {
      const roles = [UserRole.PLAYER, UserRole.TRAINER, UserRole.ADMIN, UserRole.GOAL_KEEPER];

      for (const role of roles) {
        const user = { ...mockUser, role };
        const token = await generateToken(user);
        expect(token).toBeDefined();
        expect(typeof token).toBe("string");

        const decoded = await verifyToken(token);
        expect(decoded).not.toBeNull();
        expect(decoded?.userId).toBe(user.id);
        expect(decoded?.email).toBe(user.email);
        expect(decoded?.name).toBe(user.name);
        expect(decoded?.role).toBe(user.role);
        expect(decoded?.avatarUrl).toBe(user.avatarUrl);
        expect(decoded?.exp).toBeDefined();
      }
    });

    it("should handle optional/null avatarUrl correctly", async () => {
      const userWithoutAvatar = { ...mockUser, avatarUrl: null };
      const token = await generateToken(userWithoutAvatar);
      const decoded = await verifyToken(token);
      expect(decoded?.avatarUrl).toBeNull();
    });

    it("should reject a token with a manipulated signature", async () => {
      const token = await generateToken(mockUser);
      
      const parts = token.split(".");
      expect(parts.length).toBe(3);
      
      const signature = parts[2];
      const alteredSignature = (signature[0] === "A" ? "B" : "A") + signature.slice(1);
      const tamperedToken = `${parts[0]}.${parts[1]}.${alteredSignature}`;

      const decoded = await verifyToken(tamperedToken);
      expect(decoded).toBeNull();
    });

    it("should reject a token generated with a different secret", async () => {
      const badSecret = new TextEncoder().encode("another_different_secret_key_of_32_chars");
      const payload = {
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        avatarUrl: mockUser.avatarUrl,
      };

      const tokenWithDifferentSecret = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(badSecret);

      const decoded = await verifyToken(tokenWithDifferentSecret);
      expect(decoded).toBeNull();
    });

    it("should reject a non-JWT string without throwing an exception", async () => {
      const invalidToken = "randomStringThatIsNotAJWTRightHere";
      const decoded1 = await verifyToken(invalidToken);
      expect(decoded1).toBeNull();

      const jsonToken = Buffer.from(JSON.stringify({ userId: "123", role: "PLAYER" })).toString("base64");
      const decoded2 = await verifyToken(jsonToken);
      expect(decoded2).toBeNull();
    });

    it("should expire the token and reject it after validation time has passed", async () => {
      vi.useFakeTimers();
      
      const date = new Date(2026, 8, 18, 12, 0, 0);
      vi.setSystemTime(date);

      const token = await generateToken(mockUser);
      const validDecoded = await verifyToken(token);
      expect(validDecoded).not.toBeNull();

      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      const expiredDecoded = await verifyToken(token);
      expect(expiredDecoded).toBeNull();

      vi.useRealTimers();
    });
  });

  describe("extractTokenFromRequest", () => {
    it("should extract token from a well-formed auth_token cookie in headers", () => {
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: "auth_token=my-secret-jwt-token; other_cookie=xyz",
        },
      });

      const token = extractTokenFromRequest(request);
      expect(token).toBe("my-secret-jwt-token");
    });

    it("should return null if no cookie header is present", () => {
      const request = new Request("http://localhost:3000");

      const token = extractTokenFromRequest(request);
      expect(token).toBeNull();
    });

    it("should return null if cookies are present but auth_token is not among them", () => {
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: "session_id=12345; other_cookie=abc",
        },
      });

      const token = extractTokenFromRequest(request);
      expect(token).toBeNull();
    });
  });
});

describe("Authentication Helpers (Group B - Next.js/Cookies dependent)", () => {
  describe("setAuthCookie", () => {
    it("should set the cookie on response with correct options in non-production environment", () => {
      const mockSetCookie = vi.fn();
      const mockResponse = {
        cookies: {
          set: mockSetCookie,
        },
      } as unknown as NextResponse;

      setAuthCookie(mockResponse, "test-token-value");

      expect(mockSetCookie).toHaveBeenCalledWith(
        "auth_token",
        "test-token-value",
        {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 24 * 60 * 60, // 24 hours in seconds
          path: "/",
        }
      );
    });

    it("should set the cookie with secure: true in production environment", () => {
      vi.stubEnv("NODE_ENV", "production");

      const mockSetCookie = vi.fn();
      const mockResponse = {
        cookies: {
          set: mockSetCookie,
        },
      } as unknown as NextResponse;

      setAuthCookie(mockResponse, "test-token-value");

      expect(mockSetCookie).toHaveBeenCalledWith(
        "auth_token",
        "test-token-value",
        expect.objectContaining({
          secure: true,
        })
      );

      vi.unstubAllEnvs();
    });
  });

  describe("clearAuthCookie", () => {
    it("should clear the cookie on response by setting an empty string and maxAge to 0", () => {
      const mockSetCookie = vi.fn();
      const mockResponse = {
        cookies: {
          set: mockSetCookie,
        },
      } as unknown as NextResponse;

      clearAuthCookie(mockResponse);

      expect(mockSetCookie).toHaveBeenCalledWith(
        "auth_token",
        "",
        {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 0,
          path: "/",
        }
      );
    });
  });

  describe("getAuthToken", () => {
    it("should return the token from cookies if present", async () => {
      mockGetCookie.mockReturnValue({ value: "my-mock-cookie-token" });

      const token = await getAuthToken();
      expect(token).toBe("my-mock-cookie-token");
      expect(mockGetCookie).toHaveBeenCalledWith("auth_token");
    });

    it("should return null if the cookie is not present", async () => {
      mockGetCookie.mockReturnValue(undefined);

      const token = await getAuthToken();
      expect(token).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    const mockUser = {
      id: "user-123",
      email: "player@tracker.com",
      name: "Juan Pérez",
      role: UserRole.PLAYER,
      avatarUrl: "http://example.com/avatar.png",
    };

    it("should decode and return user payload for a valid JWT token", async () => {
      const token = await generateToken(mockUser);
      mockGetCookie.mockReturnValue({ value: token });

      const user = await getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.userId).toBe(mockUser.id);
      expect(user?.email).toBe(mockUser.email);
      expect(user?.name).toBe(mockUser.name);
      expect(user?.role).toBe(mockUser.role);
    });

    it("should return null if the token in the cookie is expired", async () => {
      vi.useFakeTimers();
      
      const date = new Date(2026, 8, 18, 12, 0, 0);
      vi.setSystemTime(date);

      const token = await generateToken(mockUser);
      mockGetCookie.mockReturnValue({ value: token });

      const userBefore = await getCurrentUser();
      expect(userBefore).not.toBeNull();

      // Fast-forward past 24 hours
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      const userAfter = await getCurrentUser();
      expect(userAfter).toBeNull();

      vi.useRealTimers();
    });

    it("should return null if the token signature is manipulated", async () => {
      const token = await generateToken(mockUser);
      
      // Manipulate signature part by shifting the last char
      const parts = token.split(".");
      const signature = parts[2];
      const alteredSignature = (signature[0] === "A" ? "B" : "A") + signature.slice(1);
      const tamperedToken = `${parts[0]}.${parts[1]}.${alteredSignature}`;

      mockGetCookie.mockReturnValue({ value: tamperedToken });

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it("should return null if there is no auth_token cookie", async () => {
      mockGetCookie.mockReturnValue(undefined);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });
});
