import { z } from "zod";

export const verifyEmailCodeSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  code: z.string().length(6, "Verification code must be exactly 6 digits"),
});

export const resendVerificationCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
});
