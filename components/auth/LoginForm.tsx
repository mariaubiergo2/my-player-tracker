"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import { UserRole } from "@prisma/client";

export interface LoginFormProps {
  expectedRole?: UserRole;
  expectedSex?: "MALE" | "FEMALE";
  doorName?: string;
  onSwitchToRegister?: () => void;
  registerHref?: string;
  showCardHeader?: boolean;
}

interface MismatchInfo {
  actualRole: string;
  actualSex?: string | null;
  targetDoorHref: string;
  targetDoorLabel: string;
  message: string;
}

/**
 * Returns correct door URL and labels based on user's real role and sex
 */
export function getCorrectDoorInfo(role: string, sex?: string | null) {
  if (role === "TRAINER") {
    return {
      href: "/entrar/staff",
      label: "NEXA Staff (Entrenadores)",
      roleName: "Entrenador / Staff",
    };
  }
  if (role === "GOAL_KEEPER") {
    return {
      href: "/entrar/portero",
      label: "NEXA Goalkeeper (Porteros)",
      roleName: "Portero",
    };
  }
  if (role === "PLAYER") {
    if (sex === "FEMALE") {
      return {
        href: "/entrar/jugadora",
        label: "NEXA Women (Jugadoras)",
        roleName: "Jugadora (Femenino)",
      };
    }
    return {
      href: "/entrar/jugador",
      label: "NEXA Player (Jugadores)",
      roleName: "Jugador (Masculino)",
    };
  }
  if (role === "ADMIN") {
    return {
      href: "/admin/users",
      label: "Panel de Administración",
      roleName: "Administrador",
    };
  }
  return {
    href: "/login",
    label: "Iniciar sesión general",
    roleName: role,
  };
}

/**
 * Reusable Login Form
 * Supports checking expected role and sex for specialized entrance doors
 */
export default function LoginForm({
  expectedRole,
  expectedSex,
  doorName,
  onSwitchToRegister,
  registerHref = "/register",
  showCardHeader = true,
}: LoginFormProps) {
  const router = useRouter();
  const { login, logout, isAuthenticated, isLoading, user } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unverifiedData, setUnverifiedData] = useState<{ userId: string; email: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mismatchInfo, setMismatchInfo] = useState<MismatchInfo | null>(null);

  // Helper to redirect authenticated user to their role destination
  const redirectToRoleHome = (role: string) => {
    // TODO: Update redirect destinations when routes are reorganized to /player, /goalkeeper, /staff
    if (role === "ADMIN") {
      router.push("/admin/users");
    } else if (role === "TRAINER") {
      router.push("/trainer/players/my-players");
    } else {
      router.push("/dashboard");
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Check if current user already has role or sex mismatch for this door
      const roleMismatch = expectedRole && user.role !== expectedRole;
      const sexMismatch =
        expectedSex &&
        user.role === "PLAYER" &&
        (user.sex ? user.sex !== expectedSex : expectedSex === "FEMALE");

      if (roleMismatch || sexMismatch) {
        const doorInfo = getCorrectDoorInfo(user.role, user.sex);
        const reason = roleMismatch
          ? `Tu cuenta activa tiene el rol de ${doorInfo.roleName}. Esta puerta está configurada para ${doorName || expectedRole}.`
          : `Tu cuenta es de ${doorInfo.roleName}. Esta puerta requiere acceso ${expectedSex === "FEMALE" ? "Femenino" : "Masculino"}.`;

        setMismatchInfo({
          actualRole: user.role,
          actualSex: user.sex,
          targetDoorHref: doorInfo.href,
          targetDoorLabel: doorInfo.label,
          message: reason,
        });
      } else {
        redirectToRoleHome(user.role);
      }
    }
  }, [isLoading, isAuthenticated, user, expectedRole, expectedSex, doorName]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMismatchInfo(null);
    setUnverifiedData(null);
    setIsSubmitting(true);

    try {
      const res = await login({ email, password });
      const loggedUser = res.user;

      // Check role mismatch
      const roleMismatch = expectedRole && loggedUser.role !== expectedRole;

      // Check sex mismatch (specifically for /entrar/jugador and /entrar/jugadora)
      const sexMismatch =
        expectedSex &&
        loggedUser.role === "PLAYER" &&
        (loggedUser.sex ? loggedUser.sex !== expectedSex : expectedSex === "FEMALE");

      if (roleMismatch || sexMismatch) {
        // Invalidate session immediately to prevent unauthorized access through this door
        await logout();

        const doorInfo = getCorrectDoorInfo(loggedUser.role, loggedUser.sex);
        const reason = roleMismatch
          ? `Tu cuenta tiene el rol de ${doorInfo.roleName}. No puedes acceder a través de la puerta de ${doorName || expectedRole}.`
          : `Tu cuenta de jugador está registrada como ${doorInfo.roleName}. Esta puerta es exclusiva para ${expectedSex === "FEMALE" ? "Jugadoras" : "Jugadores"}.`;

        setMismatchInfo({
          actualRole: loggedUser.role,
          actualSex: loggedUser.sex,
          targetDoorHref: doorInfo.href,
          targetDoorLabel: doorInfo.label,
          message: reason,
        });
        return;
      }

      // Valid credentials and matching door
      redirectToRoleHome(loggedUser.role);
    } catch (err: any) {
      if (err.message === "email_not_verified") {
        setUnverifiedData({ userId: err.userId, email: err.email });
      } else {
        setError(err instanceof Error ? err.message : "Error al iniciar sesión");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {showCardHeader && (
        <>
          <h2 className="card-title text-2xl justify-center font-bold tracking-tight">
            {t("login_page.title")}
          </h2>
          <p className="text-center text-base-content/70 text-sm mt-1">
            {t("login_page.subtitle")}
          </p>
        </>
      )}

      {/* Role / Sex Mismatch Notice */}
      {mismatchInfo && (
        <div className="alert alert-warning my-4 p-4 rounded-md border border-warning/40 shadow-sm flex flex-col items-start gap-3">
          <div className="flex items-start gap-2.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0 stroke-current text-warning mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="space-y-1">
              <h4 className="font-bold text-sm tracking-wide uppercase text-warning-content">
                Puerta de acceso incorrecta
              </h4>
              <p className="text-xs leading-relaxed text-warning-content/90">
                {mismatchInfo.message}
              </p>
            </div>
          </div>

          <div className="w-full pt-2 border-t border-warning/20 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-warning-content/70">Tu puerta correcta:</span>
            <Link
              href={mismatchInfo.targetDoorHref}
              className="btn btn-sm btn-neutral text-xs font-semibold uppercase tracking-wider"
            >
              Ir a {mismatchInfo.targetDoorLabel} →
            </Link>
          </div>
        </div>
      )}

      {/* Unverified Email Warning */}
      {unverifiedData && (
        <div className="alert alert-warning my-4 flex flex-col items-start gap-2">
          <span>{t("login_page.unverified_error")}</span>
          <Link
            href={`/verify-email?userId=${unverifiedData.userId}&email=${unverifiedData.email}`}
            className="link font-semibold underline"
          >
            {t("login_page.verify_now_link")} →
          </Link>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error my-4">
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text font-medium text-xs tracking-wide">
              {t("login_page.email")}
            </span>
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-control">
          <label className="label py-1">
            <span className="label-text font-medium text-xs tracking-wide">
              {t("login_page.password")}
            </span>
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="input input-bordered w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <div className="form-control pt-2">
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              t("login_page.signin_btn")
            )}
          </button>
        </div>
      </form>

      <div className="divider text-xs opacity-60 my-4">{t("login_page.or")}</div>

      <p className="text-center text-sm">
        {t("login_page.no_account")}{" "}
        {onSwitchToRegister ? (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="link link-primary font-semibold underline"
          >
            {t("login_page.signup_link")}
          </button>
        ) : (
          <Link href={registerHref} className="link link-primary font-semibold">
            {t("login_page.signup_link")}
          </Link>
        )}
      </p>
    </div>
  );
}
