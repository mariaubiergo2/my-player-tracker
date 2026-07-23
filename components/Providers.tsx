"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Locale } from "@/lib/i18n";
import { ThemeProvider, Theme } from "@/components/ThemeProvider";

export function Providers({
  children,
  initialLocale,
  initialTheme,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialTheme?: Theme;
}) {
  return (
    <LanguageProvider initialLocale={initialLocale}>
      <ThemeProvider initialTheme={initialTheme}>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}