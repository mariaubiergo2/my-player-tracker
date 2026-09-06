import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, verifyToken } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Role-protected environments mapping: route prefix -> required UserRole
const ROLE_ENVIRONMENTS: Record<string, UserRole> = {
  "/player": "PLAYER",
  "/goalkeeper": "GOAL_KEEPER",
  "/staff": "TRAINER",
  "/admin": "ADMIN",
};

// General protected routes that require any valid authenticated session (any role)
const GENERAL_PROTECTED_PREFIXES = [
  "/matches",
  "/questionnaires",
  "/notifications",
  "/profile",
];

/**
 * Returns the home route for a given user role
 */
function getRoleHome(role: UserRole): string {
  switch (role) {
    case "PLAYER":
      return "/player";
    case "GOAL_KEEPER":
      return "/goalkeeper";
    case "TRAINER":
      return "/staff";
    case "ADMIN":
      return "/admin";
    default:
      return "/";
  }
}

/**
 * Returns the unauthenticated login/entrance route based on the target role
 */
function getUnauthenticatedRedirect(targetRole?: UserRole): string {
  switch (targetRole) {
    case "PLAYER":
      return "/entrar/jugador";
    case "GOAL_KEEPER":
      return "/entrar/portero";
    case "TRAINER":
      return "/entrar/staff";
    case "ADMIN":
      // Until a dedicated admin login exists, use the generic /login page
      return "/login";
    default:
      return "/login";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the path targets a role-specific environment (/player, /goalkeeper, /staff, /admin)
  const roleEntry = Object.entries(ROLE_ENVIRONMENTS).find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // 2. Check if the path targets a general authenticated route (/matches, /questionnaires, /notifications, /profile)
  const isGeneralProtected = GENERAL_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // If the path is neither role-specific nor general protected, it is public (/, /about, /entrar/*, etc.)
  if (!roleEntry && !isGeneralProtected) {
    return NextResponse.next();
  }

  // Read and verify the session token from the cookie using existing auth functions
  const token = await getAuthToken(request);
  const user = token ? await verifyToken(token) : null;

  // 3. If there is no valid session and the route requires one, redirect to the appropriate entry point
  if (!user) {
    const targetRole = roleEntry ? roleEntry[1] : undefined;
    const redirectPath = getUnauthenticatedRedirect(targetRole);
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // 4. If there is a valid session but the user's role does not match the environment prefix,
  // redirect them to the home of their own environment based on their real role
  if (roleEntry) {
    const requiredRole = roleEntry[1];
    if (user.role !== requiredRole) {
      const userHome = getRoleHome(user.role);
      return NextResponse.redirect(new URL(userHome, request.url));
    }
  }

  // Authorized request
  return NextResponse.next();
}

export default middleware;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - API routes (/api/*)
     * - Next.js internal files and static assets (/_next/*)
     * - Static asset files (.ico, .png, .jpg, .svg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
