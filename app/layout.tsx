import type { Metadata } from "next";
import "./globals.css";
import ConditionalChrome from "@/components/layout/ConditionalChrome";
import { Providers } from "@/components/Providers";
import { cookies } from "next/headers";
import { defaultLocale, Locale } from "@/lib/i18n";
import { montserrat, poppins } from "@/lib/fonts";

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