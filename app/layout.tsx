import type { Metadata } from "next";
import "./globals.css";
import ConditionalChrome from "@/components/layout/ConditionalChrome";
import { Providers } from "@/components/Providers";
import { cookies } from "next/headers";
import { defaultLocale, Locale } from "@/lib/i18n";
import { montserrat, poppins } from "@/lib/fonts";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "NEXA | See. Understand. Evolve.",
  description:
    "Convertimos rendimiento en conocimiento y conocimiento en evolución. Metodología de desarrollo y rendimiento aplicada al fútbol.",
  icons: {
    icon: [
      { url: "/brand/logo/favicon.svg" },
      { url: "/brand/logo/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/brand/logo/apple-touch-icon.png",
  },
  openGraph: {
    title: "NEXA | See. Understand. Evolve.",
    description: "Convertimos rendimiento en conocimiento y conocimiento en evolución.",
    type: "website",
    images: [
      {
        url: "/brand/social/og-image.png",
        width: 1200,
        height: 630,
        alt: "NEXA | See. Understand. Evolve.",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as Locale) || defaultLocale;

  return (
    <html
      lang={locale}
      data-theme="nexa"
      className={`${montserrat.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased min-h-screen flex flex-col"
      >
        <Providers initialLocale={locale}>
          <ConditionalChrome>{children}</ConditionalChrome>
        </Providers>
      </body>
    </html>
  );
}