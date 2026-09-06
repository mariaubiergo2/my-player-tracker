"use client";

import { useTranslation } from "@/components/LanguageProvider";
import NexaDoorCard from "./NexaDoorCard";
import PlayerVector from "./vectors/PlayerVector";
import WomenVector from "./vectors/WomenVector";
import GoalkeeperVector from "./vectors/GoalkeeperVector";
import StaffVector from "./vectors/StaffVector";
import { montserrat, poppins } from "./fonts";

export default function NexaDoors() {
  const { t } = useTranslation();

  const doors = [
    {
      name: t("landing.doors.player.name"),
      href: "/entrar/jugador",
      roleCode: t("landing.doors.player.role_code"),
      description: t("landing.doors.player.desc"),
      vector: <PlayerVector />,
    },
    {
      name: t("landing.doors.women.name"),
      href: "/entrar/jugadora",
      roleCode: t("landing.doors.women.role_code"),
      description: t("landing.doors.women.desc"),
      vector: <WomenVector />,
    },
    {
      name: t("landing.doors.goalkeeper.name"),
      href: "/entrar/portero",
      roleCode: t("landing.doors.goalkeeper.role_code"),
      description: t("landing.doors.goalkeeper.desc"),
      vector: <GoalkeeperVector />,
    },
    {
      name: t("landing.doors.staff.name"),
      href: "/entrar/staff",
      roleCode: t("landing.doors.staff.role_code"),
      description: t("landing.doors.staff.desc"),
      vector: <StaffVector />,
    },
  ];

  return (
    <section 
      id="entornos"
      className={`relative py-28 px-6 sm:px-8 lg:px-12 bg-[#1A1B1B] text-[#EDEDED] border-t border-[#EDEDED]/10 ${poppins.className}`}
    >
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[#BFF137] font-mono text-xs tracking-[0.25em] uppercase">
            <span>// 02</span>
            <span className="w-4 h-[1px] bg-[#BFF137]" />
            <span>{t("landing.doors.tag")}</span>
          </div>

          <h2 className={`text-3xl sm:text-5xl font-black tracking-tight text-[#EDEDED] uppercase ${montserrat.className}`}>
            {t("landing.doors.title_prefix")}{" "}
            <span className="text-[#BFF137]">{t("landing.doors.title_highlight")}</span>
          </h2>

          <p className="text-lg text-[#EDEDED]/75 font-light leading-relaxed">
            {t("landing.doors.subtitle")}
          </p>
        </div>

        {/* 4 Door Cards Grid (2x2 on desktop, 1 col on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {doors.map((door) => (
            <NexaDoorCard
              key={door.name}
              name={door.name}
              href={door.href}
              roleCode={door.roleCode}
              description={door.description}
              vector={door.vector}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
