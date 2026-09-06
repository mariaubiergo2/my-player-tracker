"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";
import { montserrat, poppins } from "./fonts";

export default function NexaNavbar() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <header className={`sticky top-0 z-50 w-full bg-[#1A1B1B]/95 backdrop-blur-md border-b border-[#EDEDED]/10 transition-colors ${poppins.className}`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Typographic NEXA Logo */}
        <Link href="/" className="group flex items-center gap-2.5 focus:outline-none">
          <div className="w-8 h-8 rounded-sm bg-[#BFF137] flex items-center justify-center font-extrabold text-[#1A1B1B] text-base select-none shadow-[0_0_15px_rgba(191,241,55,0.3)] group-hover:scale-105 transition-transform duration-200">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#1A1B1B] stroke-current stroke-[2.5]" strokeLinecap="square">
              <path d="M4 18 L4 6 L12 18 L20 6 L20 18" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className={`text-2xl font-black tracking-[0.2em] text-[#EDEDED] group-hover:text-white transition-colors leading-none ${montserrat.className}`}>
              NEXA
            </span>
            <span className="text-[9px] font-mono tracking-[0.25em] text-[#BFF137] uppercase leading-tight mt-0.5">
              {t("landing.performance")}
            </span>
          </div>
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
