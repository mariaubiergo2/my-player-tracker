"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";
import { montserrat, poppins } from "./fonts";

interface NexaDoorCardProps {
  name: string;
  href: string;
  roleCode: string;
  description: string;
  vector: React.ReactNode;
}

export default function NexaDoorCard({
  name,
  href,
  roleCode,
  description,
  vector,
}: NexaDoorCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      href={href}
      className={`group relative flex flex-col bg-[#141515] border border-[#EDEDED]/12 hover:border-[#BFF137] rounded-sm overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(191,241,55,0.15)] focus:outline-none focus:ring-1 focus:ring-[#BFF137] ${poppins.className}`}
    >
      {/* 45-degree angle corner accent on hover */}
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden z-20">
        <div className="w-12 h-1.5 bg-[#BFF137] rotate-45 transform origin-top-left -translate-y-2 translate-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Vector Illustration Container */}
      <div className="relative w-full h-56 bg-[#0E0F0F] border-b border-[#EDEDED]/10 overflow-hidden flex items-center justify-center">
        {vector}
        
        {/* Subtle hover gradient wash */}
        <div className="absolute inset-0 bg-[#BFF137]/0 group-hover:bg-[#BFF137]/[0.03] transition-colors duration-300 pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="p-7 flex flex-col flex-1 justify-between space-y-6">
        <div className="space-y-3">
          {/* Overline Code */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#BFF137] tracking-[0.2em] uppercase font-semibold">
              {roleCode}
            </span>
            <span className="text-[10px] font-mono text-[#EDEDED]/30 tracking-widest group-hover:text-[#BFF137] transition-colors">
              {t("landing.door_card.active_env")}
            </span>
          </div>

          {/* Door Name */}
          <h3 className={`text-2xl font-bold tracking-tight text-[#EDEDED] group-hover:text-white transition-colors ${montserrat.className}`}>
            {name}
          </h3>

          {/* Description */}
          <p className="text-sm text-[#EDEDED]/70 leading-relaxed font-light">
            {description}
          </p>
        </div>

        {/* Action Link Footer */}
        <div className="pt-4 border-t border-[#EDEDED]/10 flex items-center justify-between">
          <span className={`text-xs font-mono font-bold tracking-[0.2em] text-[#EDEDED]/80 group-hover:text-[#BFF137] transition-colors uppercase ${montserrat.className}`}>
            {t("landing.door_card.cta")}
          </span>
          <div className="w-7 h-7 rounded-sm border border-[#EDEDED]/20 group-hover:border-[#BFF137] group-hover:bg-[#BFF137] flex items-center justify-center transition-all duration-300">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-3.5 h-3.5 text-[#EDEDED] group-hover:text-[#1A1B1B] stroke-current stroke-[2.5] transform group-hover:translate-x-0.5 transition-transform"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
