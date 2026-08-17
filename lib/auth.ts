import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_HOURS = parseInt(process.env.AUTH_TOKEN_EXPIRY_HOURS || "24");
const AUTH_COOKIE_NAME = "auth_token";

const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;

if (!secret) {
  throw new Error(
    "FATAL CONFIG ERROR: The authentication session secret key is missing!\n" +
    "Please define the JWT_SECRET (or AUTH_SECRET) environment variable in your .env or .env.local file.\n" +
    "You can generate a secure 32-byte key (encoded in base64) by running the following command:\n" +
    "node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
  );
}

if (secret.length < 32) {
  throw new Error(
    "FATAL CONFIG ERROR: The authentication session secret key (JWT_SECRET/AUTH_SECRET) is too short!\n" +
    "To use HS256, the key must be at least 32 characters/bytes long to ensure cryptographic safety.\n" +
    "You can generate a secure 32-byte key (encoded in base64) by running the following command:\n" +
    "node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
  );
}

const JWT_SECRET = new TextEncoder().encode(secret);

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  exp: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a signed JWT token with expiration
 */
export async function generateToken(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}): Promise<string> {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl || null,
  };

  const expirationString = `${TOKEN_EXPIRY_HOURS}h`;

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationString)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a signed JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      avatarUrl: payload.avatarUrl as string | null | undefined,
      exp: payload.exp as number,
    };
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Set auth cookie (httpOnly, secure in production)
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_EXPIRY_HOURS * 60 * 60, // in seconds
    path: "/",
  });
}

/**
 * Clear auth cookie
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Get auth token from cookies (for server components/actions)
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/**
 * Get current user from cookie (for server components/actions)
 */
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return await verifyToken(token);
}

/**
 * Extract token from cookie in request
 */
export function extractTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies[AUTH_COOKIE_NAME] ?? null;
}