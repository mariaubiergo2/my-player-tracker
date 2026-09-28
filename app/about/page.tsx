"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

export default function AboutPage() {
  const { t } = useTranslation();

  const phases = [
    {
      tag: t("landing.about.phase1_tag"),
      code: t("landing.about.phase1_code"),
      title: t("landing.about.phase1_title"),
      desc: t("landing.about.phase1_desc"),
    },
    {
      tag: t("landing.about.phase2_tag"),
      code: t("landing.about.phase2_code"),
      title: t("landing.about.phase2_title"),
      desc: t("landing.about.phase2_desc"),
    },
    {
      tag: t("landing.about.phase3_tag"),
      code: t("landing.about.phase3_code"),
      title: t("landing.about.phase3_title"),
      desc: t("landing.about.phase3_desc"),
    },
  ];

  const doors = [
    {
      name: t("landing.doors.player.name"),
      roleCode: t("landing.doors.player.role_code"),
      desc: t("landing.doors.player.desc"),
      href: "/entrar/jugador",
    },
    {
      name: t("landing.doors.women.name"),
      roleCode: t("landing.doors.women.role_code"),
      desc: t("landing.doors.women.desc"),
      href: "/entrar/jugadora",
    },
    {
      name: t("landing.doors.goalkeeper.name"),
      roleCode: t("landing.doors.goalkeeper.role_code"),
      desc: t("landing.doors.goalkeeper.desc"),
      href: "/entrar/portero",
    },
    {
      name: t("landing.doors.staff.name"),
      roleCode: t("landing.doors.staff.role_code"),
      desc: t("landing.doors.staff.desc"),
      href: "/entrar/staff",
    },
  ];

  return (
    <div className="min-h-screen bg-base-100 text-base-content py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-20">

        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-base-200 border border-primary/25 text-primary text-xs font-mono uppercase tracking-wider">
            {t("landing.about.tag")}
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight">
            {t("landing.about.title_prefix")}{" "}
            <span className="text-primary">{t("landing.about.title_highlight")}</span>
          </h1>

          <p className="text-lg sm:text-xl text-base-content/80 leading-relaxed font-light">
            {t("landing.hero.promise")}
          </p>

          <p className="text-xs font-mono tracking-widest text-base-content/50 uppercase">
            {t("landing.hero.bottom_accent")}
          </p>
        </section>

        {/* Narrative Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-base-200/70 border border-base-content/10 p-8 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-mono text-primary/80 uppercase tracking-widest mb-4">
              01 // ORIGIN
            </span>
            <p className="text-sm text-base-content/85 leading-relaxed">
              {t("landing.about.p1")}
            </p>
          </div>

          <div className="bg-base-200/70 border border-base-content/10 p-8 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-mono text-primary/80 uppercase tracking-widest mb-4">
              02 // ANALYSIS
            </span>
            <p className="text-sm text-base-content/85 leading-relaxed">
              {t("landing.about.p2")}
            </p>
          </div>

          <div className="bg-base-200/70 border border-base-content/10 p-8 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-mono text-primary/80 uppercase tracking-widest mb-4">
              03 // DIRECTION
            </span>
            <p className="text-sm text-base-content/85 leading-relaxed">
              {t("landing.about.p3")}
            </p>
          </div>
        </section>

        {/* Methodology: The 3 Phases */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <div className="text-xs font-mono text-primary tracking-widest uppercase">
              {t("landing.hero.badge")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight">
              {t("landing.motto")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {phases.map((phase, idx) => (
              <div
                key={idx}
                className="bg-base-200 border border-base-content/10 p-8 rounded-2xl hover:border-primary/40 transition-colors space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-primary uppercase tracking-widest">
                    {phase.tag}
                  </span>
                  <span className="text-[11px] font-mono text-base-content/50">
                    {phase.code}
                  </span>
                </div>
                <h3 className="text-2xl font-display font-extrabold text-base-content">
                  {phase.title}
                </h3>
                <p className="text-sm text-base-content/75 leading-relaxed">
                  {phase.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Specialized Environments / Doors */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <div className="text-xs font-mono text-primary tracking-widest uppercase">
              {t("landing.doors.tag")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight">
              {t("landing.doors.title_prefix")}{" "}
              <span className="text-primary">{t("landing.doors.title_highlight")}</span>
            </h2>
            <p className="text-sm text-base-content/70 max-w-xl mx-auto">
              {t("landing.doors.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {doors.map((door, idx) => (
              <Link
                key={idx}
                href={door.href}
                className="group bg-base-200/80 border border-base-content/10 hover:border-primary/50 p-6 rounded-2xl transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-primary/80 uppercase tracking-widest block">
                    {door.roleCode}
                  </span>
                  <h4 className="font-display font-bold text-lg text-base-content group-hover:text-primary transition-colors">
                    {door.name}
                  </h4>
                  <p className="text-xs text-base-content/70 leading-relaxed">
                    {door.desc}
                  </p>
                </div>
                <span className="text-xs font-mono text-primary group-hover:underline flex items-center gap-1 pt-2">
                  {t("landing.door_card.cta")} &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}