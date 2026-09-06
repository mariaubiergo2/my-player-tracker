"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { montserrat, poppins } from "./fonts";

export default function NexaHero() {
  const { t } = useTranslation();

  return (
    <section 
      className={`relative min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-5rem)] flex flex-col items-center justify-center text-center px-4 sm:px-8 lg:px-12 py-[clamp(1rem,3vh,3rem)] overflow-hidden bg-[#1A1B1B] text-[#EDEDED] ${poppins.className}`}
    >
      {/* Background Geometric Grid & 45° Angular Vectors */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(to right, #EDEDED 1px, transparent 1px), linear-gradient(to bottom, #EDEDED 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* 45-degree angled vector light streaks */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#BFF137]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#BFF137]/5 rounded-full blur-3xl" />

        {/* Diagonal architectural 45° line across background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          preserveAspectRatio="none"
          viewBox="0 0 1200 800"
          fill="none"
        >
          <line x1="0" y1="800" x2="800" y2="0" stroke="#EDEDED" strokeWidth="1" strokeDasharray="6 6" />
          <line x1="200" y1="800" x2="1000" y2="0" stroke="#BFF137" strokeWidth="1.5" strokeOpacity="0.4" />
          <line x1="400" y1="800" x2="1200" y2="0" stroke="#EDEDED" strokeWidth="1" strokeOpacity="0.3" />
        </svg>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center w-full gap-[clamp(0.75rem,2.2vh,1.75rem)]">
        
        {/* Badge / Category indicator */}
        <div className="inline-flex items-center gap-2 px-[clamp(0.6rem,1vw,1rem)] py-[clamp(0.2rem,0.5vh,0.375rem)] rounded-sm border border-[#BFF137]/40 bg-[#BFF137]/10 text-[#BFF137] text-[clamp(0.65rem,0.85vw,0.75rem)] font-mono uppercase tracking-[0.2em]">
          <span className="w-1.5 h-1.5 bg-[#BFF137] rounded-none rotate-45" />
          <span>{t("landing.hero.badge")}</span>
        </div>

        {/* Brand Typographic Hero Logo */}
        <div className="flex flex-col items-center select-none">
          <div className="flex items-center gap-[clamp(0.5rem,1vw,0.85rem)]">
            <h1 
              className={`text-[clamp(2.75rem,6vw+1.5vh,6.5rem)] font-black tracking-[0.12em] text-[#EDEDED] leading-none ${montserrat.className}`}
            >
              NEXA
            </h1>
            <span 
              className="w-[clamp(0.5rem,1.1vw,1.15rem)] h-[clamp(0.5rem,1.1vw,1.15rem)] bg-[#BFF137] self-end mb-[clamp(0.35rem,0.8vw,0.85rem)] shadow-[0_0_20px_#BFF137]" 
            />
          </div>
        </div>

        {/* Motto: "SEE. UNDERSTAND. EVOLVE." */}
        <div className="space-y-[clamp(0.25rem,0.8vh,0.75rem)] max-w-3xl">
          <h2 
            className={`text-[clamp(1.15rem,2.2vw+0.6vh,2.25rem)] font-extrabold tracking-[0.18em] text-[#EDEDED] uppercase leading-tight ${montserrat.className}`}
          >
            {t("landing.motto_see_understand")}{" "}
            <span className="text-[#BFF137]">{t("landing.motto_evolve")}</span>
          </h2>
          
          {/* Brand Promise / Positioning Statement */}
          <p 
            className="text-[clamp(0.875rem,1.1vw+0.4vh,1.25rem)] text-[#EDEDED]/85 font-light max-w-2xl mx-auto leading-relaxed pt-[clamp(0.15rem,0.5vh,0.5rem)]"
          >
            {t("landing.hero.promise")}
          </p>
        </div>

        {/* CTA to Doors */}
        <div className="pt-[clamp(0.4rem,1.5vh,1.25rem)] flex flex-col sm:flex-row items-center justify-center gap-[clamp(0.5rem,1vw,1rem)] w-full sm:w-auto">
          <a
            href="#entornos"
            className={`inline-flex items-center justify-center gap-2.5 px-[clamp(1.25rem,2vw,2rem)] py-[clamp(0.6rem,1.4vh,0.95rem)] bg-[#BFF137] text-[#1A1B1B] font-bold text-[clamp(0.72rem,0.85vw,0.875rem)] tracking-widest uppercase rounded-sm hover:bg-white transition-all duration-300 shadow-[0_0_25px_rgba(191,241,55,0.25)] hover:shadow-[0_0_35px_rgba(191,241,55,0.45)] group w-full sm:w-auto ${montserrat.className}`}
          >
            <span>{t("landing.hero.cta_doors")}</span>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-4 h-4 stroke-current stroke-[2.5] transform group-hover:translate-x-1 transition-transform"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>

          <a
            href="#que-es-nexa"
            className={`inline-flex items-center justify-center px-[clamp(1.25rem,2vw,2rem)] py-[clamp(0.6rem,1.4vh,0.95rem)] border border-[#EDEDED]/30 text-[#EDEDED] hover:text-[#BFF137] hover:border-[#BFF137] font-semibold text-[clamp(0.72rem,0.85vw,0.875rem)] tracking-widest uppercase rounded-sm transition-all duration-300 w-full sm:w-auto ${montserrat.className}`}
          >
            {t("landing.hero.cta_about")}
          </a>
        </div>

      </div>

      {/* 45° Corner Decorative Accent */}
      <div className="absolute bottom-3 right-8 hidden lg:flex items-center gap-3 font-mono text-[10px] text-[#EDEDED]/40 tracking-widest uppercase pointer-events-none">
        <span className="w-6 h-[1px] bg-[#BFF137]/60" />
        <span>{t("landing.hero.bottom_accent")}</span>
      </div>

    </section>
  );
}
