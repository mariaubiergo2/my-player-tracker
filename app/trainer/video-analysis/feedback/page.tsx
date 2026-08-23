"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getMyPlayersWithMatches } from "@/actions/trainer";
import { useTranslation } from "@/components/LanguageProvider";
import MatchCard from "@/components/matches/MatchCard";
import type { Match } from "@/types/match";
import PageContainer from "@/components/ui/PageContainer";

interface PlayerWithMatches {
  id: string;
  name: string;
  surname: string;
  avatarUrl: string | null;
  matches: Match[];
}

export default function VideoAnalysisFeedbackPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  
  const [players, setPlayers] = useState<PlayerWithMatches[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "matches">("name");

  // Sync collapsed state with localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("video-analysis-list-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Force expand if no player is selected but players list has elements
  useEffect(() => {
    if (selectedPlayerId === null && players.length > 0) {
      setIsCollapsed(false);
    }
  }, [selectedPlayerId, players.length]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("video-analysis-list-collapsed", String(next));
      return next;
    });
  };

  const fetchMyPlayers = async (preserveSelection = false) => {
    setLoadingPlayers(true);
    try {
      const res = await getMyPlayersWithMatches();
      if (res.success && res.players) {
        const fetchedPlayers = res.players;
        setPlayers(fetchedPlayers);
        
        setSelectedPlayerId((prev) => {
          if (fetchedPlayers.length === 0) return null;
          
          if (preserveSelection && prev) {
            const stillExists = fetchedPlayers.some((p) => p.id === prev);
            if (stillExists) return prev;
          }
          
          return fetchedPlayers[0].id;
        });
      } else {
        setErrorMessage(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t("common.error"));
    } finally {
      setLoadingPlayers(false);
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
        fetchMyPlayers();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const filteredPlayers = players.filter((p) => {
    const fullName = `${p.name} ${p.surname}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Client-side sorting (consistent with my-players)
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === "name") {
      return `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`);
    } else {
      return b.matches.length - a.matches.length;
    }
  });

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  const toggleMatchExpansion = (matchId: string) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  };

  if (isLoading || loadingPlayers) {
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

      {/* Title */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t("video_analysis_page.title")}
        </h1>
        <p className="text-base-content/70 mt-2">
          {t("video_analysis_page.subtitle")}
        </p>
      </div>

      {players.length === 0 ? (
        <div className="hero bg-base-200 rounded-3xl p-10 text-center border border-base-content/5 shadow-inner">
          <div className="max-w-md">
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-2xl font-bold">{t("trainer_my_players.no_assigned_title")}</h3>
            <p className="py-4 text-base-content/60">
              {t("trainer_my_players.no_assigned_desc")}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Players Selector (Asymmetric Span 4) */}
          <div className={`transition-all duration-300 ${isCollapsed ? "lg:col-span-1" : "lg:col-span-4"} space-y-4`}>
            {/* Title / Collapsible Toggle Header */}
            <div
              onClick={handleToggleCollapse}
              className="flex items-center gap-2 font-bold text-lg text-base-content/80 px-2 cursor-pointer select-none hover:text-base-content transition-colors group/header"
            >
              <span className={`transform transition-transform duration-300 ${isCollapsed ? "-rotate-90" : ""}`}>
                ▼
              </span>
              {!isCollapsed && <span className="text-sm font-black uppercase tracking-wider">{t("trainer_my_players.roster_title")}</span>}
            </div>

            {/* Collapsible Content with animation */}
            <div className={`space-y-4 transition-all duration-300 ease-in-out origin-top ${
              isCollapsed
                ? "max-h-0 opacity-0 overflow-hidden pointer-events-none"
                : "max-h-[600px] opacity-100"
            }`}>
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("trainer_my_players.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered w-full pr-10 input-sm text-sm"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-base-content/40 pointer-events-none">
                  🔍
                </span>
              </div>

              {/* Sorting Controls */}
              <div className="flex items-center gap-2 p-1.5 bg-base-200/40 rounded-lg text-xs w-full select-none justify-between border border-base-content/5">
                <span className="font-semibold text-base-content/60 pl-1">
                  {t("trainer_my_players.sort_label")}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSortBy("name")}
                    className={`px-2 py-1 rounded transition-colors text-[10px] md:text-xs ${
                      sortBy === "name"
                        ? "bg-primary text-primary-content font-semibold"
                        : "hover:bg-base-200 text-base-content/70"
                    }`}
                  >
                    {t("trainer_my_players.sort_by_name")}
                  </button>
                  <button
                    onClick={() => setSortBy("matches")}
                    className={`px-2 py-1 rounded transition-colors text-[10px] md:text-xs ${
                      sortBy === "matches"
                        ? "bg-primary text-primary-content font-semibold"
                        : "hover:bg-base-200 text-base-content/70"
                    }`}
                  >
                    {t("trainer_my_players.sort_by_matches")}
                  </button>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="menu w-full bg-base-100 rounded-box border border-base-200 shadow-md p-1.5 space-y-1 max-h-[380px] overflow-y-auto overflow-x-hidden scrollbar-thin">
                {sortedPlayers.length === 0 ? (
                  <div className="text-center py-6 text-xs text-base-content/50">
                    {t("trainer_my_players.no_players_found")}
                  </div>
                ) : (
                  sortedPlayers.map((p) => {
                    const pendingReviews = p.matches.filter((m) => !m.isReviewed).length;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPlayerId(p.id);
                          setExpandedMatchId(null);
                        }}
                        className={`group w-full flex items-center justify-between gap-2 p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                          selectedPlayerId === p.id
                            ? "bg-primary text-primary-content shadow-md font-semibold"
                            : "hover:bg-base-200 text-base-content/85"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`avatar placeholder ${selectedPlayerId === p.id ? "" : "bg-neutral text-neutral-content"} rounded-full w-7 h-7 flex items-center justify-center overflow-hidden flex-shrink-0`}>
                            {p.avatarUrl ? (
                              <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-neutral-content">
                                {p.name.charAt(0).toUpperCase()}{p.surname.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 truncate text-xs font-semibold flex items-center justify-between min-w-0">
                            <span className="truncate">{p.name} {p.surname}</span>
                            {pendingReviews > 0 && (
                              <span
                                title={t("video_analysis_page.pending_reviews_tooltip", { count: pendingReviews })}
                                className={`badge badge-xs font-black ${selectedPlayerId === p.id ? "badge-secondary text-secondary-content" : "badge-warning text-white"} flex-shrink-0 ml-1`}
                              >
                                {pendingReviews}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Main Area - Selected Player Profile & Matches (Asymmetric Span 8) */}
          <div className={`transition-all duration-300 ${isCollapsed ? "lg:col-span-11" : "lg:col-span-8"} space-y-8`}>
            {selectedPlayer && (
              <>
                {/* Header showing current selected player name */}
                <div className="border-b border-base-200 pb-3 flex items-center justify-between">
                  <h3 className="text-2xl font-extrabold text-base-content/80">
                    👤 {selectedPlayer.name} {selectedPlayer.surname}
                  </h3>
                  <div className="badge badge-primary gap-1">
                    {selectedPlayer.matches.length} {t("trainer_my_players.history_title").toLowerCase()}
                  </div>
                </div>

                {/* Match History */}
                <div>
                  {selectedPlayer.matches.length === 0 ? (
                    <div className="card bg-base-100 shadow-md border border-base-200 p-8 text-center">
                      <span className="text-4xl mb-2 block">📝</span>
                      <h4 className="font-bold text-lg">{t("trainer_my_players.no_matches_title")}</h4>
                      <p className="text-sm text-base-content/60 mt-1">
                        {t("trainer_my_players.no_matches_desc")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedPlayer.matches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          role="TRAINER"
                          isExpanded={expandedMatchId === match.id}
                          onToggleExpand={() => toggleMatchExpansion(match.id)}
                          readOnly={false}
                          returnTo="/trainer/video-analysis/feedback"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
