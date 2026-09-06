import type { Metadata } from "next";
import "./globals.css";
import ConditionalChrome from "@/components/layout/ConditionalChrome";
import { Providers } from "@/components/Providers";
import { cookies } from "next/headers";
import { defaultLocale, Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "NEXA | See. Understand. Evolve.",
  description:
    "Convertimos rendimiento en conocimiento y conocimiento en evolución. Metodología de desarrollo y rendimiento aplicada al fútbol.",
  icons: {
    icon: "/favicon.svg?v=1",
  },
  openGraph: {
    title: "NEXA | See. Understand. Evolve.",
    description: "Convertimos rendimiento en conocimiento y conocimiento en evolución.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as Locale) || defaultLocale;
  const theme = (cookieStore.get("theme")?.value as "light" | "dark") || "light";

  return (
    <html lang={locale} data-theme={theme} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@400;600;800&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const cookieTheme = document.cookie.split('; ').find(row => row.startsWith('theme='))?.split('=')[1];
                  let theme = cookieTheme;
                  if (!theme) {
                    theme = localStorage.getItem('theme');
                  }
                  if (!theme) {
                    theme = 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })()
            `
          }}
        />
      </head>
      <body
        className="antialiased min-h-screen flex flex-col"
      >
        <Providers initialLocale={locale} initialTheme={theme}>
          <ConditionalChrome>{children}</ConditionalChrome>
        </Providers>
      </body>
    </html>
  );
}