"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "@/components/LanguageProvider";

export default function AboutPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("tracking");

  const tabKeys = ["tracking", "performance", "metrics", "collaboration", "growth"];
  const tabEmojis: Record<string, string> = {
    tracking: "⚽",
    performance: "📈",
    metrics: "🎯",
    collaboration: "💬",
    growth: "🚀"
  };

  const activeTabBadge = t(`about_page.tabs.${activeTab}.badge`);
  const activeTabTitle = t(`about_page.tabs.${activeTab}.title`);
  const activeTabDescription = t(`about_page.tabs.${activeTab}.description`);
  
  // Safely parse array / object from translations
  const activeTabFeatures = (t(`about_page.tabs.${activeTab}.features`) as unknown as string[]) || [];
  const activeTabMockData = (t(`about_page.tabs.${activeTab}.mockData`) as unknown as Record<string, string | number | string[]>) || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{t("about_page.badge")}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {t("about_page.title")}
          </h1>
          <p className="text-lg text-base-content/75 leading-relaxed">
            {t("about_page.subtitle")}
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/dashboard" className="btn btn-primary shadow-lg hover:scale-105 active:scale-95 transition-all">
              {t("about_page.btn_dashboard")}
            </Link>
            <a href="#features" className="btn btn-outline btn-secondary hover:scale-105 active:scale-95 transition-all">
              {t("about_page.btn_explore")}
            </a>
          </div>
        </div>

        {/* Highlight Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-base-100/50 backdrop-blur-md rounded-2xl border border-base-content/10 shadow-xl">
          <div className="text-center space-y-1">
            <span className="text-3xl sm:text-4xl">⚽</span>
            <div className="text-2xl font-bold text-primary">{t("about_page.stats.log")}</div>
            <div className="text-xs text-base-content/65">{t("about_page.stats.log_sub")}</div>
          </div>
          <div className="text-center space-y-1">
            <span className="text-3xl sm:text-4xl">📊</span>
            <div className="text-2xl font-bold text-secondary">{t("about_page.stats.track")}</div>
            <div className="text-xs text-base-content/65">{t("about_page.stats.track_sub")}</div>
          </div>
          <div className="text-center space-y-1">
            <span className="text-3xl sm:text-4xl">🎯</span>
            <div className="text-2xl font-bold text-accent">{t("about_page.stats.rate")}</div>
            <div className="text-xs text-base-content/65">{t("about_page.stats.rate_sub")}</div>
          </div>
          <div className="text-center space-y-1">
            <span className="text-3xl sm:text-4xl">🤝</span>
            <div className="text-2xl font-bold text-info">{t("about_page.stats.collab")}</div>
            <div className="text-xs text-base-content/65">{t("about_page.stats.collab_sub")}</div>
          </div>
        </div>

        {/* Main Features Exploration Section */}
        <div id="features" className="space-y-8 scroll-mt-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">{t("about_page.features_title")}</h2>
            <p className="text-base-content/60 mt-1">{t("about_page.features_subtitle")}</p>
          </div>

          {/* Feature Tabs Buttons */}
          <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-base-300 rounded-xl max-w-4xl mx-auto">
            {tabKeys.map((tabKey) => {
              const tabTitle = t(`about_page.tabs.${tabKey}.title`);
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === tabKey
                      ? "bg-primary text-primary-content shadow-md scale-105"
                      : "hover:bg-base-200 text-base-content/80"
                  }`}
                >
                  <span>{tabEmojis[tabKey]}</span>
                  <span>{tabTitle.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-5xl mx-auto bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-content/10 shadow-2xl transition-all duration-300">
            {/* Tab Info */}
            <div className="lg:col-span-3 space-y-6 flex flex-col justify-center">
              <div className="space-y-3">
                <div className="badge badge-accent font-semibold">{activeTabBadge}</div>
                <h3 className="text-2xl sm:text-3xl font-bold text-base-content flex items-center gap-3">
                  <span>{tabEmojis[activeTab]}</span>
                  <span>{activeTabTitle}</span>
                </h3>
                <p className="text-base-content/75 leading-relaxed text-base sm:text-lg">
                  {activeTabDescription}
                </p>
              </div>

              <div className="divider">{t("about_page.core_highlights")}</div>

              <ul className="space-y-3">
                {activeTabFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-base-content/85">
                    <span className="text-success text-lg mt-0.5">✔</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Preview / Mockup Card */}
            <div className="lg:col-span-2 bg-base-200/80 rounded-2xl p-6 border border-base-300/50 shadow-inner flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-base-300 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/40">{t("about_page.db_preview")}</span>
                  <span className="badge badge-sm badge-success">{t("about_page.live_fields")}</span>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(activeTabMockData).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="text-xs font-semibold text-base-content/50">{key}</div>
                      {Array.isArray(val) ? (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {val.map((item) => (
                            <span key={item} className="badge badge-sm badge-outline text-xs">{item}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm font-bold bg-base-100 p-2.5 rounded-lg border border-base-300 shadow-sm text-primary">
                          {val}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-base-300 text-center">
                <span className="text-xs text-base-content/40 italic">
                  {t("about_page.db_note")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Target Roles section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Player Role Card */}
          <div className="card bg-gradient-to-br from-primary/10 to-base-100 border border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-xl">
            <div className="card-body space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏃‍♂️</span>
                <div>
                  <h3 className="card-title text-xl font-bold">{t("about_page.roles.player_title")}</h3>
                  <p className="text-xs text-primary font-semibold">{t("about_page.roles.player_subtitle")}</p>
                </div>
              </div>
              <p className="text-sm text-base-content/75 leading-relaxed">
                {t("about_page.roles.player_desc")}
              </p>
              <div className="card-actions justify-end pt-2">
                <div className="badge badge-primary badge-outline text-xs">{t("about_page.roles.self_reflection")}</div>
                <div className="badge badge-primary badge-outline text-xs">{t("about_page.roles.personal_ledger")}</div>
              </div>
            </div>
          </div>

          {/* Trainer Role Card */}
          <div className="card bg-gradient-to-br from-secondary/10 to-base-100 border border-secondary/20 hover:border-secondary/40 transition-all duration-300 shadow-xl">
            <div className="card-body space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <div>
                  <h3 className="card-title text-xl font-bold">{t("about_page.roles.trainer_title")}</h3>
                  <p className="text-xs text-secondary font-semibold">{t("about_page.roles.trainer_subtitle")}</p>
                </div>
              </div>
              <p className="text-sm text-base-content/75 leading-relaxed">
                {t("about_page.roles.trainer_desc")}
              </p>
              <div className="card-actions justify-end pt-2">
                <div className="badge badge-secondary badge-outline text-xs">{t("about_page.roles.grading_metrics")}</div>
                <div className="badge badge-secondary badge-outline text-xs">{t("about_page.roles.review_portal")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Closing Call to Action */}
        <div className="hero bg-base-100 rounded-3xl border border-base-content/10 shadow-2xl p-6 sm:p-12 text-center max-w-5xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          <div className="max-w-md mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl font-extrabold">{t("about_page.ready_title")}</h2>
            <p className="text-sm sm:text-base text-base-content/70">
              {t("about_page.ready_desc")}
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard" className="btn btn-primary hover:scale-105 active:scale-95 transition-all px-6">
                {t("about_page.btn_dashboard")}
              </Link>
              <Link href="/" className="btn btn-ghost hover:scale-105 active:scale-95 transition-all">
                {t("about_page.btn_home")}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}