"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getMyPlayersWithMatches } from "@/actions/trainer";

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
        setErrorMessage(res.error || "Failed to load assigned players.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred while fetching your players.");
    } finally {
      setLoadingPlayers(false);
    }
  };

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  const toggleMatchExpansion = (matchId: string) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  };

  const getMatchTypeBadge = (type: string | null) => {
    if (!type) return null;
    switch (type.toUpperCase()) {
      case "LEAGUE":
        return <span className="badge badge-primary badge-sm font-semibold">{type}</span>;
      case "CUP":
        return <span className="badge badge-secondary badge-sm font-semibold">{type}</span>;
      case "FRIENDLY":
        return <span className="badge badge-accent badge-sm font-semibold">{type}</span>;
      case "TRAINING":
        return <span className="badge badge-info badge-sm font-semibold text-white">{type}</span>;
      default:
        return <span className="badge badge-ghost badge-sm">{type}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return <span className="badge badge-success badge-sm font-semibold text-white">Completed</span>;
      case "SCHEDULED":
        return <span className="badge badge-warning badge-sm font-semibold">Scheduled</span>;
      case "CANCELLED":
        return <span className="badge badge-error badge-sm font-semibold text-white">Cancelled</span>;
      default:
        return <span className="badge badge-ghost badge-sm">{status}</span>;
    }
  };

  if (isLoading || loadingPlayers) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/60 font-medium">Loading your players database...</p>
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
          My Assigned Players
        </h1>
        <p className="text-base-content/70 mt-2">
          Review, evaluate, and track matches for players assigned to you.
        </p>
      </div>

      {players.length === 0 ? (
        <div className="hero bg-base-200 rounded-3xl p-10 text-center border border-base-content/5 shadow-inner">
          <div className="max-w-md">
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-2xl font-bold">No players assigned yet</h3>
            <p className="py-4 text-base-content/60">
              You haven&apos;t assigned any players to yourself. Go to the Players Directory to add players to your roster.
            </p>
            <Link href="/trainer/players" className="btn btn-primary shadow-md hover:scale-105 active:scale-95 transition-all">
              Go to Players Directory
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Players Selector */}
          <div className="lg:col-span-1 space-y-4">
            <div className="font-bold text-lg text-base-content/80 px-2">Player Roster</div>
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
              + Assign More Players
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
                          <div>📞 <span className="font-semibold text-base-content/90">{selectedPlayer.phone || "Not set"}</span></div>
                          <div>📅 Birth: <span className="font-semibold text-base-content/90">{selectedPlayer.birthDate || "Not set"}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match History */}
                <div>
                  <h3 className="text-2xl font-bold mb-4 px-2">Match History ({selectedPlayer.matches.length})</h3>
                  
                  {selectedPlayer.matches.length === 0 ? (
                    <div className="card bg-base-100 shadow-md border border-base-200 p-8 text-center">
                      <span className="text-4xl mb-2 block">📝</span>
                      <h4 className="font-bold text-lg">No matches logged yet</h4>
                      <p className="text-sm text-base-content/60 mt-1">
                        This player hasn&apos;t logged any match performance records.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedPlayer.matches.map((match) => {
                        const isExpanded = expandedMatchId === match.id;
                        const matchDateFormatted = new Date(match.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });

                        return (
                          <div
                            key={match.id}
                            className="card bg-base-100 shadow-md hover:shadow-lg transition-all border border-base-200 overflow-hidden"
                          >
                            {/* Match Header (Always visible) */}
                            <div className="card-body p-5">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1 cursor-pointer" onClick={() => toggleMatchExpansion(match.id)}>
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h4 className="font-extrabold text-lg hover:text-primary transition-colors">
                                      {match.name}
                                    </h4>
                                    {getMatchTypeBadge(match.matchType)}
                                    {getStatusBadge(match.status)}
                                    {match.isReviewed && (
                                      <span className="badge badge-success badge-sm font-semibold text-white">Reviewed</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-base-content/60 flex items-center gap-4">
                                    <span>📅 {matchDateFormatted} {match.startTime ? `@ ${match.startTime}` : ""}</span>
                                    {match.location && <span>📍 {match.location}</span>}
                                    {match.opponent && <span>⚔️ vs {match.opponent}</span>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 justify-between md:justify-end">
                                  {match.mark != null && (
                                    <div className="stat-value text-xl font-black bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
                                      {match.mark} <span className="text-xs font-normal text-base-content/60">/10</span>
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <Link href={`/matches/${match.id}/edit`} className="btn btn-ghost btn-sm text-primary hover:bg-primary/10">
                                      Edit Feedback
                                    </Link>
                                    <button
                                      onClick={() => toggleMatchExpansion(match.id)}
                                      className="btn btn-ghost btn-sm font-bold text-lg"
                                      aria-label={isExpanded ? "Collapse match details" : "Expand match details"}
                                    >
                                      {isExpanded ? "▲" : "▼"}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Expandable Match Details Section */}
                              {isExpanded && (
                                <div className="mt-5 border-t border-base-200 pt-5 space-y-6 animate-slide-down">
                                  
                                  {/* Stats Row */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-base-200/50 rounded-xl p-3 text-center border border-base-content/5">
                                      <div className="text-xs text-base-content/60 font-semibold mb-0.5">Goals</div>
                                      <div className="text-xl font-bold text-primary">{match.goals}</div>
                                    </div>
                                    <div className="bg-base-200/50 rounded-xl p-3 text-center border border-base-content/5">
                                      <div className="text-xs text-base-content/60 font-semibold mb-0.5">Assists</div>
                                      <div className="text-xl font-bold text-primary">{match.assists}</div>
                                    </div>
                                    <div className="bg-base-200/50 rounded-xl p-3 text-center border border-base-content/5">
                                      <div className="text-xs text-base-content/60 font-semibold mb-0.5">Minutes Played</div>
                                      <div className="text-xl font-bold text-primary">{match.minutesPlayed} mins</div>
                                    </div>
                                    <div className="bg-base-200/50 rounded-xl p-3 text-center border border-base-content/5">
                                      <div className="text-xs text-base-content/60 font-semibold mb-0.5">Location & time</div>
                                      <div className="text-sm font-medium">{match.location || "N/A"}<br/>{match.startTime || "N/A"}</div>
                                    </div>
                                  </div>

                                  {/* Ratings Matrix */}
                                  <div className="bg-base-200/20 rounded-2xl p-4 border border-base-200">
                                    <div className="font-bold text-sm mb-3 text-base-content/80">Evaluation Scorecard</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                      <div>
                                        <div className="text-xs text-base-content/60">Overall Rating</div>
                                        <div className="text-lg font-bold text-secondary">{match.performance ?? "-"} <span className="text-xs font-normal">/10</span></div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-base-content/60">Intensity Level</div>
                                        <div className="text-lg font-bold text-secondary">{match.intensity ?? "-"} <span className="text-xs font-normal">/10</span></div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-base-content/60">Attitude & Focus</div>
                                        <div className="text-lg font-bold text-secondary">{match.attitude ?? "-"} <span className="text-xs font-normal">/10</span></div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-base-content/60">Mark</div>
                                        <div className="text-lg font-bold text-secondary">{match.mark ?? "-"} <span className="text-xs font-normal">/10</span></div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Feedback Commentary */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="card bg-base-200/30 p-4 border border-base-content/5">
                                      <div className="font-bold text-xs text-base-content/60 mb-2 uppercase tracking-wide">Player Reflections</div>
                                      <p className="text-sm text-base-content/85 whitespace-pre-line italic">
                                        &ldquo;{match.playerReflection || "No reflections provided."}&rdquo;
                                      </p>
                                    </div>
                                    <div className="card bg-base-200/30 p-4 border border-base-content/5">
                                      <div className="font-bold text-xs text-base-content/60 mb-2 uppercase tracking-wide">Match Notes (General)</div>
                                      <p className="text-sm text-base-content/85 whitespace-pre-line">
                                        {match.comment || "No general comments."}
                                      </p>
                                    </div>
                                    <div className="card bg-base-200/30 p-4 border border-base-content/5">
                                      <div className="font-bold text-xs text-base-content/60 mb-2 uppercase tracking-wide">Trainer Feedback</div>
                                      <p className="text-sm text-base-content/85 whitespace-pre-line font-medium">
                                        {match.trainerFeedback || "No trainer feedback logged yet."}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Bullet Lists (Strengths, Weaknesses, Improvement) */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                      <div className="font-bold text-xs text-success uppercase tracking-wide">🔥 Key Strengths</div>
                                      {match.strengths && match.strengths.length > 0 ? (
                                        <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1">
                                          {match.strengths.map((item, idx) => <li key={idx}>{item}</li>)}
                                        </ul>
                                      ) : (
                                        <div className="text-xs text-base-content/40 italic">None logged.</div>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      <div className="font-bold text-xs text-error uppercase tracking-wide">⚠️ Weaknesses</div>
                                      {match.weaknesses && match.weaknesses.length > 0 ? (
                                        <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1">
                                          {match.weaknesses.map((item, idx) => <li key={idx}>{item}</li>)}
                                        </ul>
                                      ) : (
                                        <div className="text-xs text-base-content/40 italic">None logged.</div>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      <div className="font-bold text-xs text-info uppercase tracking-wide">📈 Improvement Areas</div>
                                      {match.improvementAreas && match.improvementAreas.length > 0 ? (
                                        <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1">
                                          {match.improvementAreas.map((item, idx) => <li key={idx}>{item}</li>)}
                                        </ul>
                                      ) : (
                                        <div className="text-xs text-base-content/40 italic">None logged.</div>
                                      )}
                                    </div>
                                  </div>

                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
