"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";
import { montserrat, poppins } from "./fonts";

export default function NexaFooter() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-[#141515] border-t border-[#EDEDED]/10 text-[#EDEDED] py-14 px-6 sm:px-8 lg:px-12 ${poppins.className}`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Top Tier */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#EDEDED]/10">
          
          {/* Brand Identity */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black tracking-[0.2em] text-[#EDEDED] ${montserrat.className}`}>
                NEXA
              </span>
              <span className="w-2 h-2 bg-[#BFF137]" />
            </div>
            <p className="text-xs font-mono tracking-[0.15em] text-[#EDEDED]/60 uppercase">
              {t("landing.motto")}
            </p>
          </div>

          {/* In-page Navigation */}
          <nav className="flex items-center gap-6 text-xs font-mono text-[#EDEDED]/60 tracking-wider uppercase">
            <a href="#que-es-nexa" className="hover:text-[#BFF137] transition-colors">
              {t("landing.footer.nav_about")}
            </a>
            <a href="#entornos" className="hover:text-[#BFF137] transition-colors">
              {t("landing.footer.nav_doors")}
            </a>
          </nav>

        </div>

        {/* Bottom Tier: Legal & Discreet Team Access */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#EDEDED]/40">
          
          {/* Copyright with variable substitution */}
          <p className="font-light">
            {t("landing.footer.copyright", { year: currentYear })}
          </p>

          {/* Discreet Access Link for NEXA Team (Admin route /login) */}
          <div>
            <Link 
              href="/login" 
              className="text-xs text-[#EDEDED]/40 hover:text-[#EDEDED]/70 transition-colors"
            >
              {t("landing.footer.team_access")}
            </Link>
          </div>

        </div>

      </div>
    </footer>
  );
}
