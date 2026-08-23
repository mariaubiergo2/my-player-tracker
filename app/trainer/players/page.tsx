"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getPlayerDashboardStats } from "@/actions/trainer";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";

export default function PlayersDashboardPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<{
    ownPlayersCount: number;
    totalPlayersCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "TRAINER") {
        router.push("/dashboard");
      } else {
        loadStats();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await getPlayerDashboardStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      } else {
        setError(res.error || "Failed to load stats");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading || (user && user.role !== "TRAINER")) {
    return null;
  }

  return (
    <PageContainer className="py-10 animate-fade-in">
      {/* Title */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t("trainer_players_dashboard.title")}
        </h1>
        <p className="text-base-content/70 mt-2 max-w-2xl leading-relaxed">
          {t("trainer_players_dashboard.subtitle")}
        </p>
      </div>

      {error && (
        <div className="alert alert-error shadow-lg mb-6 border border-error/20">
          <div>
            <span>❌ {error}</span>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* My Players Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
          <div className="card-body p-8 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-4xl p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">👥</span>
                {loading ? (
                  <div className="skeleton w-12 h-8 rounded-lg"></div>
                ) : (
                  <div className="text-4xl font-black text-primary">
                    {stats?.ownPlayersCount ?? 0}
                  </div>
                )}
              </div>
              <h2 className="card-title text-2xl font-bold text-base-content mt-6">
                {t("header.my_players")}
              </h2>
              <p className="text-sm text-base-content/60 leading-relaxed mt-2">
                {t("trainer_players_dashboard.my_players_desc")}
              </p>
            </div>
            <div className="card-actions justify-end mt-8">
              <Link
                href="/trainer/players/my-players"
                className="btn btn-primary btn-md rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 w-full md:w-auto"
              >
                {t("common.manage")} &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Assign Players Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
          <div className="card-body p-8 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-4xl p-3 bg-secondary/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">🔍</span>
                {loading ? (
                  <div className="skeleton w-12 h-8 rounded-lg"></div>
                ) : (
                  <div className="text-4xl font-black text-secondary">
                    {stats?.totalPlayersCount ?? 0}
                  </div>
                )}
              </div>
              <h2 className="card-title text-2xl font-bold text-base-content mt-6">
                {t("header.all_players")}
              </h2>
              <p className="text-sm text-base-content/60 leading-relaxed mt-2">
                {t("trainer_players_dashboard.assign_players_desc")}
              </p>
            </div>
            <div className="card-actions justify-end mt-8">
              <Link
                href="/trainer/players/assign"
                className="btn btn-secondary btn-md rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 w-full md:w-auto text-secondary-content"
              >
                {t("common.manage")} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
