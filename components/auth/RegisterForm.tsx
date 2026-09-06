"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import { UserRole } from "@prisma/client";

export interface RegisterFormProps {
  fixedRole?: UserRole;
  fixedSex?: "MALE" | "FEMALE" | null;
  showSexSelector?: boolean;
  onSwitchToLogin?: () => void;
  loginHref?: string;
  showCardHeader?: boolean;
}

/**
 * Reusable Register Form
 * Supports pre-fixing role and sex according to entrance door
 */
export default function RegisterForm({
  fixedRole,
  fixedSex,
  showSexSelector = false,
  onSwitchToLogin,
  loginHref = "/login",
  showCardHeader = true,
}: RegisterFormProps) {
  const router = useRouter();
  const { register, isAuthenticated, isLoading, user } = useAuth();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedSex, setSelectedSex] = useState<string>(fixedSex || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // TODO: Update redirect destinations when routes are reorganized to /player, /goalkeeper, /staff
      if (user.role === "ADMIN") {
        router.push("/admin/users");
      } else if (user.role === "TRAINER") {
        router.push("/trainer/players/my-players");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

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

    if (password !== confirmPassword) {
      setError(t("register_page.error_match"));
      return;
    }

    if (password.length < 6) {
      setError(t("register_page.error_length"));
      return;
    }

    if (showSexSelector && !selectedSex) {
      setError(t("profile_page.sex_placeholder") || "Por favor, selecciona sexo");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload with fixed or selected role & sex
      const sexToSend = fixedSex || (showSexSelector ? selectedSex : null);
      const roleToSend = fixedRole || "PLAYER";

      const res = await register({
        email,
        password,
        name,
        surname,
        role: roleToSend,
        sex: sexToSend || null,
      });

      const params = new URLSearchParams();
      if (res && (res as any).userId) params.set("userId", (res as any).userId);
      if (res && (res as any).email) params.set("email", (res as any).email);
      router.push(`/verify-email?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar cuenta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {showCardHeader && (
        <>
          <h2 className="card-title text-2xl justify-center font-bold tracking-tight">
            {t("register_page.title")}
          </h2>
          <p className="text-center text-base-content/70 text-sm mt-1">
            {t("register_page.subtitle")}
          </p>
        </>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && (
          <div className="alert alert-error my-2">
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-medium text-xs tracking-wide">
                {t("register_page.name")}
              </span>
            </label>
            <input
              type="text"
              placeholder="Nombre"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="given-name"
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-medium text-xs tracking-wide">
                {t("register_page.surname")}
              </span>
            </label>
            <input
              type="text"
              placeholder="Apellidos"
              className="input input-bordered w-full"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label py-1">
            <span className="label-text font-medium text-xs tracking-wide">
              {t("register_page.email")}
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

        {/* Optional Sex Selector (only rendered for doors like portero / staff where sex is asked) */}
        {showSexSelector && (
          <div className="form-control">
            <label className="label py-1" htmlFor="register-sex-select">
              <span className="label-text font-medium text-xs tracking-wide">
                {t("profile_page.sex")}
              </span>
            </label>
            <select
              id="register-sex-select"
              className="select select-bordered w-full"
              value={selectedSex}
              onChange={(e) => setSelectedSex(e.target.value)}
              required
            >
              <option value="" disabled>
                {t("profile_page.sex_placeholder")}
              </option>
              <option value="MALE">{t("profile_page.sex_male")}</option>
              <option value="FEMALE">{t("profile_page.sex_female")}</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-medium text-xs tracking-wide">
                {t("register_page.password")}
              </span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-medium text-xs tracking-wide">
                {t("register_page.confirm_password")}
              </span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="input input-bordered w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
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
              t("register_page.create_btn")
            )}
          </button>
        </div>
      </form>

      <div className="divider text-xs opacity-60 my-4">{t("register_page.or")}</div>

      <p className="text-center text-sm">
        {t("register_page.have_account")}{" "}
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="link link-primary font-semibold underline"
          >
            {t("register_page.signin_link")}
          </button>
        ) : (
          <Link href={loginHref} className="link link-primary font-semibold">
            {t("register_page.signin_link")}
          </Link>
        )}
      </p>
    </div>
  );
}
