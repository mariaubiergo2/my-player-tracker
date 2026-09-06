"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { montserrat, poppins } from "./fonts";

export default function NexaAbout() {
  const { t } = useTranslation();

  return (
    <section 
      id="que-es-nexa"
      className={`relative py-28 px-6 sm:px-8 lg:px-12 bg-[#1A1B1B] text-[#EDEDED] border-t border-[#EDEDED]/10 overflow-hidden ${poppins.className}`}
    >
      {/* Subtle 45° line decoration */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#BFF137]/5 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header Block */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[#BFF137] font-mono text-xs tracking-[0.25em] uppercase">
            <span>// 01</span>
            <span className="w-4 h-[1px] bg-[#BFF137]" />
            <span>{t("landing.about.tag")}</span>
          </div>
          
          <h2 className={`text-3xl sm:text-5xl font-black tracking-tight text-[#EDEDED] uppercase ${montserrat.className}`}>
            {t("landing.about.title_prefix")} <span className="text-[#BFF137]">{t("landing.about.title_highlight")}</span>
          </h2>
          
          <div className="space-y-4 pt-2 text-[#EDEDED]/80 text-lg sm:text-xl font-light leading-relaxed">
            <p className="text-[#EDEDED] font-normal">
              {t("landing.about.p1")}
            </p>
            <p>
              {t("landing.about.p2")}
            </p>
            <p className="text-base sm:text-lg text-[#EDEDED]/70">
              {t("landing.about.p3")}
            </p>
          </div>
        </div>

        {/* 3 Pillars: SEE. UNDERSTAND. EVOLVE. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Pillar 1: SEE */}
          <div className="relative p-8 bg-[#141515] border border-[#EDEDED]/10 rounded-sm hover:border-[#BFF137]/60 transition-all duration-300 group space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#BFF137] tracking-widest uppercase">
                {t("landing.about.phase1_tag")}
              </span>
              <span className="text-xs font-mono text-[#EDEDED]/30 group-hover:text-[#BFF137] transition-colors">
                {t("landing.about.phase1_code")}
              </span>
            </div>

            <h3 className={`text-2xl font-extrabold text-[#EDEDED] tracking-wide ${montserrat.className}`}>
              {t("landing.about.phase1_title")}
            </h3>

            <p className="text-sm text-[#EDEDED]/70 leading-relaxed">
              {t("landing.about.phase1_desc")}
            </p>

            <div className="pt-2">
              <div className="w-full h-[2px] bg-[#EDEDED]/10 group-hover:bg-[#BFF137]/60 transition-colors" />
            </div>
          </div>

          {/* Pillar 2: UNDERSTAND */}
          <div className="relative p-8 bg-[#141515] border border-[#EDEDED]/10 rounded-sm hover:border-[#BFF137]/60 transition-all duration-300 group space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#BFF137] tracking-widest uppercase">
                {t("landing.about.phase2_tag")}
              </span>
              <span className="text-xs font-mono text-[#EDEDED]/30 group-hover:text-[#BFF137] transition-colors">
                {t("landing.about.phase2_code")}
              </span>
            </div>

            <h3 className={`text-2xl font-extrabold text-[#EDEDED] tracking-wide ${montserrat.className}`}>
              {t("landing.about.phase2_title")}
            </h3>

            <p className="text-sm text-[#EDEDED]/70 leading-relaxed">
              {t("landing.about.phase2_desc")}
            </p>

            <div className="pt-2">
              <div className="w-full h-[2px] bg-[#EDEDED]/10 group-hover:bg-[#BFF137]/60 transition-colors" />
            </div>
          </div>

          {/* Pillar 3: EVOLVE */}
          <div className="relative p-8 bg-[#141515] border border-[#EDEDED]/10 rounded-sm hover:border-[#BFF137]/60 transition-all duration-300 group space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#BFF137] tracking-widest uppercase">
                {t("landing.about.phase3_tag")}
              </span>
              <span className="text-xs font-mono text-[#EDEDED]/30 group-hover:text-[#BFF137] transition-colors">
                {t("landing.about.phase3_code")}
              </span>
            </div>

            <h3 className={`text-2xl font-extrabold text-[#EDEDED] tracking-wide ${montserrat.className}`}>
              {t("landing.about.phase3_title")}
            </h3>

            <p className="text-sm text-[#EDEDED]/70 leading-relaxed">
              {t("landing.about.phase3_desc")}
            </p>

            <div className="pt-2">
              <div className="w-full h-[2px] bg-[#EDEDED]/10 group-hover:bg-[#BFF137]/60 transition-colors" />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
