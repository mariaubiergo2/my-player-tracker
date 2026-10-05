"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";
import { poppins } from "./fonts";

export default function NexaNavbar() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <header className={`sticky top-0 z-50 w-full bg-[#1A1B1B]/95 backdrop-blur-md border-b border-[#EDEDED]/10 transition-colors ${poppins.className}`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
        
        {/* NEXA Brand Logo */}
        <Link href="/" className="group flex items-center focus:outline-none" aria-label="NEXA">
          <img
            src="/brand/logo/nexa-wordmark-on-dark.svg"
            alt="NEXA"
            className="h-6 sm:h-7 w-auto transition-opacity duration-200 group-hover:opacity-90"
          />
        </Link>

        {/* Motto Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#BFF137]/30 bg-[#BFF137]/5 text-xs font-mono text-[#EDEDED]/90 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFF137] animate-pulse" />
          <span>{t("landing.motto")}</span>
        </div>

        {/* Right action group: Language selector + Quick Door Anchor */}
        <div className="flex items-center gap-3">
          {/* Subtle Language Selector */}
          <div className="flex items-center gap-1 text-[11px] font-mono border border-[#EDEDED]/15 px-2 py-1 rounded-sm">
            {(["ca", "es", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={`px-1.5 py-0.5 uppercase transition-colors rounded-[2px] ${
                  locale === lang
                    ? "bg-[#BFF137] text-[#1A1B1B] font-bold"
                    : "text-[#EDEDED]/50 hover:text-[#EDEDED]"
                }`}
                aria-label={`Canviar idioma a ${lang}`}
              >
                {lang}
              </button>
            ))}
          </div>

          <a
            href="#entornos"
            className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#BFF137] hover:text-white px-3.5 py-1.5 border border-[#BFF137]/40 hover:border-[#BFF137] rounded-sm transition-all duration-200 group"
          >
            <span>{t("landing.navbar.environments")}</span>
            <span className="group-hover:translate-y-0.5 transition-transform">↓</span>
          </a>
        </div>

      </div>
    </header>
  );
}
