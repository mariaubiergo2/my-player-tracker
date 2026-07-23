import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Providers } from "@/components/Providers";
import { cookies } from "next/headers";
import { defaultLocale, Locale } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Player Tracker",
  description:
    "Track player matches and give feedback. A Next.js application showcasing player performance monitoring with Prisma and DaisyUI.",
  openGraph: {
    title: "Player Tracker",
    description: "Track player matches and give feedback publicly",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers initialLocale={locale} initialTheme={theme}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}