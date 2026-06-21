// app/matches/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { updateMatch } from "@/actions/matches";
import { MatchStatus, MatchType } from "@/matches/[identifier]/MATCHES";

interface PageProps {
  params: Promise<{ id: string }>;
}

const matchTypes = ["FRIENDLY", "LEAGUE", "CUP", "TRAINING"];
const matchStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED"];

/**
 * Edit Match Page - CSR (Client-Side Rendering)
 * Uses client state for form handling with dynamic route
 */
export default function EditMatchPage({ params }: PageProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [matchId, setMatchId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [opponent, setOpponent] = useState("");
  const [matchType, setMatchType] = useState("");
  const [status, setStatus] = useState("SCHEDULED");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [playerId, setPlayerId] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [teamId, setTeamId] = useState("");

  const [comment, setComment] = useState("");
  const [trainerFeedback, setTrainerFeedback] = useState("");
  const [playerReflection, setPlayerReflection] = useState("");

  const [mark, setMark] = useState("");
  const [intensity, setIntensity] = useState("");
  const [attitude, setAttitude] = useState("");
  const [performance, setPerformance] = useState("");

  const [goals, setGoals] = useState("0");
  const [assists, setAssists] = useState("0");
  const [minutesPlayed, setMinutesPlayed] = useState("0");

  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [improvementAreas, setImprovementAreas] = useState("");

  const [isReviewed, setIsReviewed] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(true);

  // Get params
  useEffect(() => {
    params.then((p) => setMatchId(p.id));
  }, [params]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch match data
  useEffect(() => {
    if (matchId && user) {
      fetchMatch();
    }
  }, [matchId, user]);

  const fetchMatch = async () => {
    try {
      if (!matchId) return;

      // Cookies are automatically sent with fetch
      const response = await fetch(`/api/matches/${matchId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.match) {
          const m = data.match;
          setName(m.name ?? "");
          setDescription(m.description ?? "");
          setLocation(m.location ?? "");
          setOpponent(m.opponent ?? "");
          setMatchType(m.matchType ?? "");
          setStatus(m.status ?? "SCHEDULED");
          setDate(m.date ? new Date(m.date).toISOString().slice(0, 10) : "");
          setStartTime(m.startTime ?? "");
          setEndTime(m.endTime ?? "");

          setPlayerId(m.playerId ?? "");
          setTrainerId(m.trainerId ?? "");
          setTeamId(m.teamId ?? "");

          setComment(m.comment ?? "");
          setTrainerFeedback(m.trainerFeedback ?? "");
          setPlayerReflection(m.playerReflection ?? "");

          setMark(m.mark === null || m.mark === undefined ? "" : String(m.mark));
          setIntensity(m.intensity === null || m.intensity === undefined ? "" : String(m.intensity));
          setAttitude(m.attitude === null || m.attitude === undefined ? "" : String(m.attitude));
          setPerformance(m.performance === null || m.performance === undefined ? "" : String(m.performance));

          setGoals(String(m.goals ?? 0));
          setAssists(String(m.assists ?? 0));
          setMinutesPlayed(String(m.minutesPlayed ?? 0));

          setStrengths((m.strengths ?? []).join(", "));
          setWeaknesses((m.weaknesses ?? []).join(", "));
          setImprovementAreas((m.improvementAreas ?? []).join(", "));

          setIsReviewed(!!m.isReviewed);
        }
      } else if (response.status === 404) {
        setError("Match not found");
      } else if (response.status === 403) {
        setError("You don't have permission to edit this match");
      }
    } catch (err) {
      setError("Failed to load match");
    } finally {
      setLoadingMatch(false);
    }
  };

  const toIntOrUndefined = (val: string) => (val.trim() === "" ? undefined : parseInt(val, 10));
  const toListOrEmpty = (val: string) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !date || !playerId.trim() || !trainerId.trim()) {
      setError("Name, date, player, and trainer are required");
      return;
    }

    if (!matchId || !user) return;

    setIsSubmitting(true);

    try {
      const result = await updateMatch(
        matchId,
        {
                  name: name.trim(),
                  description: description.trim() || undefined,
                  location: location.trim() || undefined,
                  opponent: opponent.trim() || undefined,
                  matchType: (matchType || undefined) as MatchType | undefined,
                  status: status as MatchStatus,
                  date: new Date(date).toISOString(),
                  startTime: startTime || undefined,
                  endTime: endTime || undefined,
        
                  playerId: playerId.trim(),
                  trainerId: trainerId.trim(),
                  teamId: teamId.trim() || undefined,
        
                  mark: toIntOrUndefined(mark),
                  intensity: toIntOrUndefined(intensity),
                  attitude: toIntOrUndefined(attitude),
                  performance: toIntOrUndefined(performance),
                  goals: parseInt(goals, 10) || 0,
                  assists: parseInt(assists, 10) || 0,
                  minutesPlayed: parseInt(minutesPlayed, 10) || 0,
        
                  comment: comment.trim() || undefined,
                  trainerFeedback: trainerFeedback.trim() || undefined,
                  playerReflection: playerReflection.trim() || undefined,
                  strengths: toListOrEmpty(strengths),
                  weaknesses: toListOrEmpty(weaknesses),
                  improvementAreas: toListOrEmpty(improvementAreas),
        
                  isReviewed,
                  reviewedAt: isReviewed ? new Date().toISOString() : undefined,
                }
      );

      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Failed to update match");
      }
    } catch (err) {
      setError("An error occurred while updating the match");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadingMatch) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
        <Link href="/dashboard" className="btn btn-ghost mt-4">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard" className="btn btn-ghost btn-sm gap-2">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">Edit Match</h1>
          <p className="text-base-content/70">
            Update the match details and feedback
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Match Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Derby vs City FC"
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Opponent</span>
              </label>
              <input
                type="text"
                placeholder="Opponent team"
                className="input input-bordered w-full"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Location</span>
              </label>
              <input
                type="text"
                placeholder="Match location"
                className="input input-bordered w-full"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Match Type</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value)}
                >
                  <option value="">Select type</option>
                  {matchTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Status</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {matchStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Start Time</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered w-full"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">End Time</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered w-full"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              <textarea
                placeholder="Match description"
                className="textarea textarea-bordered w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="divider">People & Team</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Player ID</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Trainer ID</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Team ID</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                />
              </div>
            </div>

            <div className="divider">Performance</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Mark</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={mark}
                  onChange={(e) => setMark(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Intensity</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Attitude</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={attitude}
                  onChange={(e) => setAttitude(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Performance</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={performance}
                  onChange={(e) => setPerformance(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Goals</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Assists</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={assists}
                  onChange={(e) => setAssists(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">
                    Minutes Played
                  </span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={minutesPlayed}
                  onChange={(e) => setMinutesPlayed(e.target.value)}
                />
              </div>
            </div>

            <div className="divider">Feedback</div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Comment</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">
                  Trainer Feedback
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={trainerFeedback}
                onChange={(e) => setTrainerFeedback(e.target.value)}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">
                  Player Reflection
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={playerReflection}
                onChange={(e) => setPlayerReflection(e.target.value)}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">
                  Strengths (comma separated)
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">
                  Weaknesses (comma separated)
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">
                  Improvement Areas (comma separated)
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={improvementAreas}
                onChange={(e) => setImprovementAreas(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={isReviewed}
                  onChange={(e) => setIsReviewed(e.target.checked)}
                />
                <span className="label-text">Mark as reviewed</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/dashboard" className="btn btn-ghost">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}