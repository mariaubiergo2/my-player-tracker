"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAssignedPlayersMatches } from "@/actions/trainer";
import { useTranslation } from "@/components/LanguageProvider";
import MatchCard from "@/components/matches/MatchCard";
import type { Match } from "@/types/match";
import PageContainer from "@/components/ui/PageContainer";
import StatsBlock from "@/components/ui/StatsBlock";

interface CompleteMatchWithPlayer extends Match {
  player?: {
    id: string;
    name: string;
    surname: string;
    avatarUrl: string | null;
  } | null;
}

export default function VideoAnalysisMatchesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const [matches, setMatches] = useState<CompleteMatchWithPlayer[]>([]);
  const [players, setPlayers] = useState<{ id: string; name: string; surname: string; avatarUrl: string | null }[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters State
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPlayerId, setFilterPlayerId] = useState<string>("ALL");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterMatchType, setFilterMatchType] = useState<string>("ALL");

  const fetchMatches = async () => {
    setLoadingMatches(true);
    try {
      const res = await getAssignedPlayersMatches();
      if (res.success && res.matches) {
        setMatches(res.matches);
        if (res.players) {
          setPlayers(res.players);
        }
      } else {
        setErrorMessage(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t("common.error"));
    } finally {
      setLoadingMatches(false);
    }
  };

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "TRAINER") {
        router.push("/dashboard");
      } else {
        fetchMatches();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const toggleMatchExpansion = (matchId: string) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  };

  // Combined Filtering Logic
  const filteredMatches = matches.filter((match) => {
    // 1. Status Filter
    if (filterStatus === "REVIEWED" && !match.isReviewed) return false;
    if (filterStatus === "PENDING" && match.isReviewed) return false;

    // 2. Player Filter
    if (filterPlayerId !== "ALL" && match.player?.id !== filterPlayerId) return false;

    // 3. Match Type Filter
    if (filterMatchType !== "ALL" && match.matchType?.toUpperCase() !== filterMatchType.toUpperCase()) return false;

    // 4. Date Range Filter
    const matchDate = new Date(match.date);
    const matchDateTime = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate()).getTime();

    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      const fromDateTime = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime();
      if (matchDateTime < fromDateTime) return false;
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      const toDateTime = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()).getTime();
      if (matchDateTime > toDateTime) return false;
    }

    return true;
  });

  const hasActiveFilters = filterStatus !== "ALL" ||
    filterPlayerId !== "ALL" ||
    filterDateFrom !== "" ||
    filterDateTo !== "" ||
    filterMatchType !== "ALL";

  const resetFilters = () => {
    setFilterStatus("ALL");
    setFilterPlayerId("ALL");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterMatchType("ALL");
  };

  if (isLoading || loadingMatches) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/60 font-medium">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "TRAINER") {
    return null;
  }

  return (
    <PageContainer className="py-10 animate-fade-in">
      {errorMessage && (
        <div className="alert alert-error shadow-lg mb-6 border border-error/20">
          <div>
            <span>❌ {errorMessage}</span>
          </div>
        </div>
      )}

      {/* Header Title */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("video_analysis_page.all_matches_title")}
          </h1>
          <p className="text-base-content/70 mt-2">
            {t("video_analysis_page.all_matches_subtitle")}
          </p>
        </div>
      </div>

      {matches.length > 0 && (
        <>
          {/* Statistics Block */}
          <StatsBlock className="mb-8"
            items={[
              { title: t("video_analysis_page.stat_total_matches"), value: matches.length },
              {
                title: t("video_analysis_page.stat_reviewed_matches"),
                value: matches.filter((m) => m.isReviewed).length,
                valueClassName: "text-primary",
              },
              {
                title: t("video_analysis_page.stat_pending_matches"),
                value: matches.filter((m) => !m.isReviewed).length,
                valueClassName: "text-secondary",
              },]}
          />

          {/* Filters Bar */}
          <div className="card bg-base-100 shadow-md border border-base-200 mb-8">
            <div className="card-body p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                {/* Status Filter */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-base-content/70">{t("video_analysis_page.filter_status")}</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">{t("video_analysis_page.filter_status_all")}</option>
                    <option value="REVIEWED">{t("video_analysis_page.filter_status_reviewed")}</option>
                    <option value="PENDING">{t("video_analysis_page.filter_status_pending")}</option>
                  </select>
                </div>

                {/* Player Filter */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-base-content/70">{t("video_analysis_page.filter_player")}</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={filterPlayerId}
                    onChange={(e) => setFilterPlayerId(e.target.value)}
                  >
                    <option value="ALL">{t("video_analysis_page.filter_player_all")}</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.surname}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-base-content/70">{t("video_analysis_page.filter_date_from")}</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>

                {/* Date To */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-base-content/70">{t("video_analysis_page.filter_date_to")}</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>

                {/* Match Type */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-base-content/70">{t("video_analysis_page.filter_match_type")}</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={filterMatchType}
                    onChange={(e) => setFilterMatchType(e.target.value)}
                  >
                    <option value="ALL">{t("video_analysis_page.filter_match_type_all")}</option>
                    <option value="LEAGUE">{t("common.type_league")}</option>
                    <option value="FRIENDLY">{t("common.type_friendly")}</option>
                    <option value="CUP">{t("common.type_cup")}</option>
                    <option value="TRAINING">{t("common.type_training")}</option>
                  </select>
                </div>
              </div>

              {/* Action Row */}
              {hasActiveFilters && (
                <div className="flex justify-end mt-4">
                  <button
                    className="btn btn-ghost btn-sm text-error font-semibold hover:bg-error/10 rounded-xl"
                    onClick={resetFilters}
                  >
                    🧹 {t("video_analysis_page.filter_clear")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Matches Flat List */}
      {matches.length === 0 ? (
        <div className="hero bg-base-200 rounded-3xl p-10 text-center border border-base-content/5 shadow-inner">
          <div className="max-w-md">
            <span className="text-6xl mb-4 block">⚽</span>
            <h3 className="text-2xl font-bold">{t("trainer_my_players.no_matches_title")}</h3>
            <p className="py-4 text-base-content/60">
              {t("trainer_my_players.no_matches_desc")}
            </p>
          </div>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="hero bg-base-200 rounded-3xl p-10 text-center border border-base-content/5 shadow-inner">
          <div className="max-w-md">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-2xl font-bold">{t("admin_users.no_users") || "No matches found"}</h3>
            <p className="py-4 text-base-content/60">
              {t("admin_users.adjust_filter") || "Try adjusting your filters to find what you are looking for."}
            </p>
            <button className="btn btn-primary rounded-2xl" onClick={resetFilters}>
              {t("video_analysis_page.filter_clear") || "Clear Filters"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              role="TRAINER"
              isExpanded={expandedMatchId === match.id}
              onToggleExpand={() => toggleMatchExpansion(match.id)}
              readOnly={false}
              disableTitleLink={true}
              returnTo="/trainer/video-analysis/matches"
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
