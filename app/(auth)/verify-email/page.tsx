"use client"

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LanguageProvider";
import { verifyEmailCode, resendVerificationCode } from "@/actions/email-verification";
import Link from "next/link";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const userId = searchParams.get("userId") || "";
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60); // 60 seconds cooldown initially
  const [resendMessage, setResendMessage] = useState("");

  // Countdown timer for resending verification code
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResendMessage("");

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError(t("verification.error_generic"));
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await verifyEmailCode(userId, code);
      if (res.success) {
        setSuccess(t("verification.success_verified"));
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        // Translate error key returned by server action or fallback
        const errKey = res.error || "verification.error_generic";
        setError(t(errKey));
      }
    } catch (err) {
      setError(t("verification.error_generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setError("");
    setSuccess("");
    setResendMessage("");
    setIsResending(true);

    try {
      const res = await resendVerificationCode(email);
      if (res.success) {
        setResendMessage(t("verification.resend_success"));
        setCooldown(60); // Reset countdown timer to 60s
      } else {
        const errKey = res.error || "verification.error_resend_failed";
        setError(t(errKey));
      }
    } catch (err) {
      setError(t("verification.error_resend_failed"));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <h2 className="card-title text-2xl justify-center font-bold tracking-tight text-primary">
        {t("verification.title")}
      </h2>
      <p className="text-center text-sm text-base-content/70 mt-1">
        {t("verification.subtitle", { email })}
      </p>

      <form onSubmit={handleVerify} className="mt-6 space-y-4">
        {success && (
          <div className="alert alert-success">
            <span className="text-sm font-semibold">{success}</span>
          </div>
        )}

        {resendMessage && (
          <div className="alert alert-info">
            <span className="text-sm font-semibold">{resendMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">{t("verification.code_label")}</span>
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder={t("verification.code_placeholder")}
            className="input input-bordered w-full text-center text-3xl font-extrabold tracking-[0.5em] focus:border-primary focus:ring-2 focus:ring-primary/20 py-6"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            disabled={isSubmitting || success !== ""}
          />
        </div>

        <div className="form-control mt-6">
          <button
            type="submit"
            className="btn btn-primary w-full font-bold shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.01]"
            disabled={isSubmitting || success !== "" || code.length !== 6}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              t("verification.verify_btn")
            )}
          </button>
        </div>
      </form>

      <div className="divider my-6"></div>

      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={handleResend}
          className="btn btn-outline btn-ghost w-full font-semibold border-base-300 hover:border-primary hover:text-primary transition-all duration-200"
          disabled={cooldown > 0 || isResending || success !== ""}
        >
          {isResending ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : cooldown > 0 ? (
            t("verification.resend_countdown", { seconds: cooldown })
          ) : (
            t("verification.resend_btn")
          )}
        </button>

        <Link href="/login" className="link link-hover text-sm font-medium text-base-content/60 hover:text-primary">
          {t("register_page.signin_link")}
        </Link>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-10">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
