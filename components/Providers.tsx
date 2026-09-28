"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Locale } from "@/lib/i18n";
import { ThemeProvider } from "@/components/ThemeProvider";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <LanguageProvider initialLocale={initialLocale}>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}