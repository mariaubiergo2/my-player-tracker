"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getMyPlayersWithMatches } from "@/actions/trainer";
import { useTranslation } from "@/components/LanguageProvider";
import MatchCard from "@/components/matches/MatchCard";

interface MatchItem {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  date: Date | string;
  startTime: string | null;
  endTime: string | null;
  opponent: string | null;
  matchType: string | null;
  status: string;
  mark: number | null;
  intensity: number | null;
  attitude: number | null;
  performance: number | null;
  goals: number;
  assists: number;
  minutesPlayed: number;
  comment: string | null;
  trainerFeedback: string | null;
  playerReflection: string | null;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  offensiveActionsOwnHalf: string | null;
  offensiveActionsOpponentHalf: string | null;
  defensiveActionsOwnHalf: string | null;
  defensiveActionsOpponentHalf: string | null;
  isReviewed: boolean;
  reviewedAt: Date | string | null;
}

interface PlayerWithMatches {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  avatarUrl: string | null;
  matches: MatchItem[];
}

export default function MyPlayersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  
  const [players, setPlayers] = useState<PlayerWithMatches[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

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

  const fetchMyPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const res = await getMyPlayersWithMatches();
      if (res.success && res.players) {
        setPlayers(res.players);
        if (res.players.length > 0) {
          setSelectedPlayerId(res.players[0].id);
        }
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
    <section className="container mx-auto px-6 py-10 animate-fade-in">
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
          {t("trainer_my_players.title")}
        </h1>
        <p className="text-base-content/70 mt-2">
          {t("trainer_my_players.subtitle")}
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
            <Link href="/trainer/players" className="btn btn-primary shadow-md hover:scale-105 active:scale-95 transition-all">
              {t("trainer_my_players.go_directory")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Players Selector */}
          <div className="lg:col-span-1 space-y-4">
            <div className="font-bold text-lg text-base-content/80 px-2">{t("trainer_my_players.roster_title")}</div>
            <div className="menu bg-base-100 rounded-box border border-base-200 shadow-md p-2 space-y-1">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPlayerId(p.id);
                    setExpandedMatchId(null);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    selectedPlayerId === p.id
                      ? "bg-primary text-primary-content shadow-md font-semibold"
                      : "hover:bg-base-200 text-base-content/80"
                  }`}
                >
                  <div className={`avatar placeholder ${selectedPlayerId === p.id ? "" : "bg-neutral text-neutral-content"} rounded-full w-8 h-8 flex items-center justify-center overflow-hidden`}>
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold">
                        {p.name.charAt(0).toUpperCase()}{p.surname.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    {p.name} {p.surname}
                  </div>
                </button>
              ))}
            </div>
            
            <Link href="/trainer/players" className="btn btn-outline btn-block text-xs mt-2 border-dashed">
              {t("trainer_my_players.assign_more")}
            </Link>
          </div>

          {/* Main Area - Selected Player Profile & Matches */}
          <div className="lg:col-span-3 space-y-8">
            {selectedPlayer && (
              <>
                {/* Player Profile Card */}
                <div className="card bg-base-100 shadow-md border border-base-200">
                  <div className="card-body">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-2xl w-24 h-24 flex items-center justify-center text-3xl font-bold shadow-lg overflow-hidden">
                          {selectedPlayer.avatarUrl ? (
                            <img src={selectedPlayer.avatarUrl} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>
                              {selectedPlayer.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <h2 className="text-3xl font-bold">
                          {selectedPlayer.name} {selectedPlayer.surname}
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-sm text-base-content/70">
                          <div>📧 <span className="font-semibold text-base-content/90">{selectedPlayer.email}</span></div>
                          <div>📞 <span className="font-semibold text-base-content/90">{selectedPlayer.phone || t("common.not_specified")}</span></div>
                          <div>📅 {t("trainer_my_players.birth_label")}: <span className="font-semibold text-base-content/90">{selectedPlayer.birthDate || t("common.not_specified")}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match History */}
                <div>
                  <h3 className="text-2xl font-bold mb-4 px-2">{t("trainer_my_players.history_title")} ({selectedPlayer.matches.length})</h3>
                  
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
    </section>
  );
}
