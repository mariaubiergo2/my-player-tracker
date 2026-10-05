"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";
import { UserRole } from "@prisma/client";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import PlayerVector from "@/components/landing/vectors/PlayerVector";
import WomenVector from "@/components/landing/vectors/WomenVector";
import GoalkeeperVector from "@/components/landing/vectors/GoalkeeperVector";
import StaffVector from "@/components/landing/vectors/StaffVector";
import { montserrat, poppins } from "@/components/landing/fonts";

export type DoorType = "jugador" | "jugadora" | "portero" | "staff";

interface DoorAuthPortalProps {
  door: DoorType;
  initialMode?: "login" | "register";
}

interface DoorConfig {
  nameKey: string;
  roleCodeKey: string;
  descKey: string;
  vector: React.ReactNode;
  fixedRole: UserRole;
  fixedSex?: "MALE" | "FEMALE";
  expectedRole: UserRole;
  expectedSex?: "MALE" | "FEMALE";
  showSexSelector: boolean;
}

const DOOR_CONFIGS: Record<DoorType, DoorConfig> = {
  jugador: {
    nameKey: "landing.doors.player.name",
    roleCodeKey: "landing.doors.player.role_code",
    descKey: "landing.doors.player.desc",
    vector: <PlayerVector />,
    fixedRole: UserRole.PLAYER,
    fixedSex: "MALE",
    expectedRole: UserRole.PLAYER,
    expectedSex: "MALE",
    showSexSelector: false,
  },
  jugadora: {
    nameKey: "landing.doors.women.name",
    roleCodeKey: "landing.doors.women.role_code",
    descKey: "landing.doors.women.desc",
    vector: <WomenVector />,
    fixedRole: UserRole.PLAYER,
    fixedSex: "FEMALE",
    expectedRole: UserRole.PLAYER,
    expectedSex: "FEMALE",
    showSexSelector: false,
  },
  portero: {
    nameKey: "landing.doors.goalkeeper.name",
    roleCodeKey: "landing.doors.goalkeeper.role_code",
    descKey: "landing.doors.goalkeeper.desc",
    vector: <GoalkeeperVector />,
    fixedRole: UserRole.GOAL_KEEPER,
    expectedRole: UserRole.GOAL_KEEPER,
    showSexSelector: true,
  },
  staff: {
    nameKey: "landing.doors.staff.name",
    roleCodeKey: "landing.doors.staff.role_code",
    descKey: "landing.doors.staff.desc",
    vector: <StaffVector />,
    fixedRole: UserRole.TRAINER,
    expectedRole: UserRole.TRAINER,
    showSexSelector: true,
  },
};

export default function DoorAuthPortal({
  door,
  initialMode = "login",
}: DoorAuthPortalProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"login" | "register">(initialMode);

  const config = DOOR_CONFIGS[door];
  const doorTitle = t(config.nameKey);
  const doorRoleCode = t(config.roleCodeKey);
  const doorDesc = t(config.descKey);

  return (
    <div
      className={`min-h-[calc(100vh-8rem)] py-12 px-4 sm:px-6 flex flex-col items-center justify-center ${poppins.className}`}
    >
      <div className="w-full max-w-lg">
        {/* Portal Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/#entornos"
            className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#EDEDED]/60 hover:text-[#BFF137] transition-colors uppercase"
          >
            <span>←</span>
            <span>Volver a entornos</span>
          </Link>
          <Link href="/" aria-label="NEXA" className="hover:opacity-80 transition-opacity">
            <img
              src="/brand/logo/nexa-wordmark-on-dark.svg"
              alt="NEXA"
              className="h-5 sm:h-6 w-auto"
            />
          </Link>
        </div>

        {/* Main Portal Container */}
        <div className="relative bg-[#141515] border border-[#EDEDED]/12 rounded-sm shadow-2xl overflow-hidden">
          {/* Neon Top Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-[#BFF137]" />

          {/* Door Header with Illustration */}
          <div className="relative w-full h-44 bg-[#0E0F0F] border-b border-[#EDEDED]/10 overflow-hidden flex items-center justify-center">
            {config.vector}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141515] via-transparent to-transparent opacity-90 pointer-events-none" />

            {/* Overline Code Badge */}
            <div className="absolute top-3 left-4 z-10">
              <span className="inline-block text-[11px] font-mono text-[#BFF137] tracking-[0.2em] uppercase font-bold bg-[#141515]/90 px-2.5 py-1 border border-[#BFF137]/30 rounded-sm">
                {doorRoleCode}
              </span>
            </div>
          </div>

          {/* Door Description & Title */}
          <div className="px-6 pt-6 pb-4 border-b border-[#EDEDED]/10">
            <h1
              className={`text-2xl sm:text-3xl font-black tracking-tight text-[#EDEDED] uppercase ${montserrat.className}`}
            >
              {doorTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#EDEDED]/70 leading-relaxed font-light mt-2">
              {doorDesc}
            </p>

            {/* Tab Selector: Iniciar sesión / Registrarse */}
            <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-[#0E0F0F] border border-[#EDEDED]/10 rounded-sm">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`py-2 text-xs font-mono tracking-wider font-semibold uppercase transition-all duration-200 rounded-sm ${
                  tab === "login"
                    ? "bg-[#BFF137] text-[#141515] shadow-sm"
                    : "text-[#EDEDED]/70 hover:text-white"
                }`}
              >
                {t("login_page.signin_btn")}
              </button>
              <button
                type="button"
                onClick={() => setTab("register")}
                className={`py-2 text-xs font-mono tracking-wider font-semibold uppercase transition-all duration-200 rounded-sm ${
                  tab === "register"
                    ? "bg-[#BFF137] text-[#141515] shadow-sm"
                    : "text-[#EDEDED]/70 hover:text-white"
                }`}
              >
                {t("register_page.create_btn")}
              </button>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="p-6 sm:p-7">
            {tab === "login" ? (
              <LoginForm
                expectedRole={config.expectedRole}
                expectedSex={config.expectedSex}
                doorName={doorTitle}
                onSwitchToRegister={() => setTab("register")}
                showCardHeader={false}
              />
            ) : (
              <RegisterForm
                fixedRole={config.fixedRole}
                fixedSex={config.fixedSex}
                showSexSelector={config.showSexSelector}
                onSwitchToLogin={() => setTab("login")}
                showCardHeader={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
