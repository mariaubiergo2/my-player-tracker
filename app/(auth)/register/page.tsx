"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";

/**
 * Register Page - CSR (Client-Side Rendering)
 * Uses client-side state for form handling and registration
 */
export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading, user } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === "ADMIN") {
        router.push("/admin/users");
      } else if (user?.role === "TRAINER") {
        router.push("/trainer/my-players");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="loading loading-spinner loading-lg"></span>
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

    setIsSubmitting(true);
 
    try {
      const res = await register({ email, password, name, surname });
      const params = new URLSearchParams();
      if (res && (res as any).userId) params.set("userId", (res as any).userId);
      if (res && (res as any).email) params.set("email", (res as any).email);
      router.push(`/verify-email?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h2 className="card-title text-2xl justify-center">{t("register_page.title")}</h2>
      <p className="text-center text-base-content/70">
        {t("register_page.subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t("register_page.name")}</span>
          </label>
          <input
            type="text"
            placeholder="Your name"
            className="input input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-control mt-4">
          <label className="label">
            <span className="label-text">{t("register_page.surname")}</span>
          </label>
          <input
            type="text"
            placeholder="Your surname"
            className="input input-bordered w-full"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            required
          />
        </div>

        <div className="form-control mt-4">
          <label className="label">
            <span className="label-text">{t("register_page.email")}</span>
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-control mt-4">
          <label className="label">
            <span className="label-text">{t("register_page.password")}</span>
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="input input-bordered w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div className="form-control mt-4">
          <label className="label">
            <span className="label-text">{t("register_page.confirm_password")}</span>
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="input input-bordered w-full"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-control mt-6">
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

      <div className="divider">{t("register_page.or")}</div>

      <p className="text-center">
        {t("register_page.have_account")}{" "}
        <Link href="/login" className="link link-primary">
          {t("register_page.signin_link")}
        </Link>
      </p>
    </>
  );
}