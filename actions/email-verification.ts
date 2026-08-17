"use server"

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import crypto from "crypto";
import { Resend } from "resend";
import { getTranslationsServer } from "@/lib/i18n-server";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// TODO: Before running in production, verify your domain in the Resend dashboard and configure RESEND_SENDER_EMAIL in your environment variables.
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || "Foot-Tracker <noreply@foot-tracker.com>";

/**
 * Generate a 6-digit verification code, hash it, save to DB, and send via Resend
 */
export async function generateAndSendVerificationCode(userId: string, db: any = prisma) {
  // Invalidate any existing verification codes for this user
  await db.emailVerificationCode.updateMany({
    where: {
      userId,
      consumedAt: null,
      invalidatedAt: null,
    },
    data: {
      invalidatedAt: new Date(),
    },
  });

  // Generate 6-digit code
  const code = crypto.randomInt(100000, 1000000).toString();

  // Hash code
  const codeHash = await hashPassword(code);

  // Set expiration: 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Get user details
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Save hash to database
  await db.emailVerificationCode.create({
    data: {
      userId,
      codeHash,
      expiresAt,
    },
  });

  // Check API key configuration. If not defined, fallback to console logging for local development.
  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY is not defined in environment variables.");
    console.log("====================================================");
    console.log(`[DEVELOPMENT] Verification code for ${user.email} (${user.name}): ${code}`);
    console.log("====================================================");
    return { success: true };
  }

  // Get server-side translations based on user locale cookie
  const t = await getTranslationsServer();

  // Send email via Resend
  const subject = t("email.subject") || "Código de Verificación - Foot-Tracker";
  const emailTitle = t("email.title") || "Verifica tu correo electrónico";
  const greeting = t("email.greeting", { name: user.name }) || `Hola ${user.name},`;
  const body = t("email.body") || "Gracias por registrarte en Foot-Tracker. Por favor, usa el siguiente código de verificación para completar tu registro:";
  const expirationText = t("email.expiration") || "Este código caducará en 10 minutos.";
  const securityNotice = t("email.security_notice") || "Si no has solicitado este registro, por favor ignora este correo electrónico.";

  const { error } = await resend.emails.send({
    from: SENDER_EMAIL,
    to: user.email,
    subject: subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff; color: #1f2937;">
        <h2 style="color: #2563eb; text-align: center; margin-top: 0;">${emailTitle}</h2>
        <p style="font-size: 16px; line-height: 1.5;">${greeting}</p>
        <p style="font-size: 16px; line-height: 1.5;">${body}</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 12px 24px; background-color: #f3f4f6; border-radius: 8px; color: #111827; border: 1px solid #e5e7eb; display: inline-block;">${code}</span>
        </div>
        <p style="color: #dc2626; font-weight: 500; font-size: 14px; text-align: center;">${expirationText}</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center; margin-bottom: 0;">${securityNotice}</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend API error:", error);
    throw new Error("Failed to send verification email");
  }

  return { success: true };
}

/**
 * Verify a user's entered 6-digit code
 */
export async function verifyEmailCode(userId: string, code: string) {
  try {
    if (!userId || !code || code.length !== 6) {
      console.warn(`[verifyEmailCode] Invalid inputs: userId=${userId}, codeLength=${code?.length}`);
      return { success: false, error: "verification.error_generic" };
    }

    // Run verification in transaction to ensure atomic updates
    const result = await prisma.$transaction(async (tx) => {
      // Find the most recent non-consumed, non-invalidated verification code
      const codeRecord = await tx.emailVerificationCode.findFirst({
        where: {
          userId,
          consumedAt: null,
          invalidatedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!codeRecord) {
        console.warn(`[verifyEmailCode] No active code found for userId=${userId}`);
        return { success: false, error: "verification.error_generic" };
      }

      // Check expiration
      const now = new Date();
      if (codeRecord.expiresAt < now) {
        console.warn(`[verifyEmailCode] Code expired for userId=${userId}. Expired at ${codeRecord.expiresAt}`);
        return { success: false, error: "verification.error_generic" };
      }

      // Check max attempts
      if (codeRecord.attempts >= 5) {
        console.warn(`[verifyEmailCode] Code attempts limit exceeded (>=5) for userId=${userId}`);
        // If not already marked as invalidated, invalidate it
        await tx.emailVerificationCode.update({
          where: { id: codeRecord.id },
          data: { invalidatedAt: now },
        });
        return { success: false, error: "verification.error_generic" };
      }

      // Compare hash
      const isValid = await verifyPassword(code, codeRecord.codeHash);
      if (!isValid) {
        const newAttempts = codeRecord.attempts + 1;
        console.warn(`[verifyEmailCode] Code mismatch for userId=${userId}. Incrementing attempts to ${newAttempts}`);
        
        await tx.emailVerificationCode.update({
          where: { id: codeRecord.id },
          data: {
            attempts: newAttempts,
            invalidatedAt: newAttempts >= 5 ? now : null,
          },
        });
        return { success: false, error: "verification.error_generic" };
      }

      // Code is valid! Consume it and verify the user
      await tx.emailVerificationCode.update({
        where: { id: codeRecord.id },
        data: { consumedAt: now },
      });

      await tx.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      });

      return { success: true };
    });

    return result;
  } catch (error) {
    console.error("[verifyEmailCode] Error occurred:", error);
    return { success: false, error: "verification.error_generic" };
  }
}

/**
 * Handle verification code resending with rate limiting
 */
export async function resendVerificationCode(email: string) {
  try {
    if (!email) {
      return { success: false, error: "verification.error_email_required" };
    }

    const emailClean = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: emailClean },
      select: { id: true, emailVerified: true },
    });

    // If user does not exist, return success dummy response to prevent enumeration
    if (!user) {
      console.warn(`[resendVerificationCode] Non-existent email requested: ${emailClean}`);
      return { success: true };
    }

    // If already verified, return success as well
    if (user.emailVerified) {
      console.log(`[resendVerificationCode] User already verified: ${emailClean}`);
      return { success: true };
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Enforce 60 seconds rate limit
    const recentCode = await prisma.emailVerificationCode.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentCode) {
      return { success: false, error: "verification.error_rate_limit_60s" };
    }

    // Enforce 5 requests per hour limit
    const hourlyCount = await prisma.emailVerificationCode.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (hourlyCount >= 5) {
      return { success: false, error: "verification.error_rate_limit_hourly" };
    }

    // Generate and send code inside transaction
    await prisma.$transaction(async (tx) => {
      await generateAndSendVerificationCode(user.id, tx);
    });

    return { success: true };
  } catch (error) {
    console.error("[resendVerificationCode] Error occurred:", error);
    return { success: false, error: "verification.error_resend_failed" };
  }
}
