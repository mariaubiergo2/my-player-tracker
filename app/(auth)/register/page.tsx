"use client";

import RegisterForm from "@/components/auth/RegisterForm";

/**
 * Register Page - CSR (Client-Side Rendering)
 * Reuses the modular RegisterForm component without forcing any door-specific role or sex selector
 */
export default function RegisterPage() {
  return <RegisterForm />;
}