"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { updateMatch } from "@/actions/matches"
import { MatchType, MatchStatus } from "@/matches/[identifier]/MATCHES"
import type { CompleteMatch } from "@/types/match";
import { toDateInput, toDateTimeInput } from "@/lib/utils"

const matchTypes = ["FRIENDLY", "LEAGUE", "CUP", "TRAINING"]
const matchStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED"]


export default function EditMatchForm({ 
  match, 
  currentUserRole 
}: { 
  match: CompleteMatch
  currentUserRole?: string 
}) {
  const router = useRouter()

  const [name, setName] = useState(match.name ?? "")
  const [description, setDescription] = useState(match.description ?? "")
  const [location, setLocation] = useState(match.location ?? "")
  const [opponent, setOpponent] = useState(match.opponent ?? "")
  const [matchType, setMatchType] = useState(match.matchType ?? "")
  const [status, setStatus] = useState(match.status ?? "SCHEDULED")
  const [date, setDate] = useState(toDateInput(match.date))
  const [startTime, setStartTime] = useState(match.startTime ?? "")
  const [endTime, setEndTime] = useState(match.endTime ?? "")

  const [playerId, setPlayerId] = useState(match.playerId ?? "")
  const [trainerId, setTrainerId] = useState(match.trainerId ?? "")
  const [teamId, setTeamId] = useState(match.teamId ?? "")

  const [mark, setMark] = useState(match.mark != null ? String(match.mark) : "")
  const [intensity, setIntensity] = useState(match.intensity != null ? String(match.intensity) : "")
  const [attitude, setAttitude] = useState(match.attitude != null ? String(match.attitude) : "")
  const [performance, setPerformance] = useState(match.performance != null ? String(match.performance) : "")
  const [goals, setGoals] = useState(String(match.goals ?? 0))
  const [assists, setAssists] = useState(String(match.assists ?? 0))
  const [minutesPlayed, setMinutesPlayed] = useState(String(match.minutesPlayed ?? 0))

  const [comment, setComment] = useState(match.comment ?? "")
  const [trainerFeedback, setTrainerFeedback] = useState(match.trainerFeedback ?? "")
  const [playerReflection, setPlayerReflection] = useState(match.playerReflection ?? "")
  const [strengths, setStrengths] = useState((match.strengths ?? []).join(", "))
  const [weaknesses, setWeaknesses] = useState((match.weaknesses ?? []).join(", "))
  const [improvementAreas, setImprovementAreas] = useState((match.improvementAreas ?? []).join(", "))

  const [offensiveActionsOwnHalf, setOffensiveActionsOwnHalf] = useState(match.offensiveActionsOwnHalf ?? "")
  const [offensiveActionsOpponentHalf, setOffensiveActionsOpponentHalf] = useState(match.offensiveActionsOpponentHalf ?? "")
  const [defensiveActionsOwnHalf, setDefensiveActionsOwnHalf] = useState(match.defensiveActionsOwnHalf ?? "")
  const [defensiveActionsOpponentHalf, setDefensiveActionsOpponentHalf] = useState(match.defensiveActionsOpponentHalf ?? "")

  const [isReviewed, setIsReviewed] = useState(!!match.isReviewed)
  const [reviewedAt, setReviewedAt] = useState(toDateTimeInput(match.reviewedAt ?? null))

  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toIntOrUndefined = (val: string) =>
    val.trim() === "" ? undefined : parseInt(val, 10)

  const toListOrEmpty = (val: string) =>
    val.split(",").map((s) => s.trim()).filter(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim() || !date || !playerId.trim() || !trainerId.trim()) {
      setError("Name, date, player, and trainer are required")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateMatch(match.id, {
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

        offensiveActionsOwnHalf: offensiveActionsOwnHalf.trim() || null,
        offensiveActionsOpponentHalf: offensiveActionsOpponentHalf.trim() || null,
        defensiveActionsOwnHalf: defensiveActionsOwnHalf.trim() || null,
        defensiveActionsOpponentHalf: defensiveActionsOpponentHalf.trim() || null,

        isReviewed,
        reviewedAt: reviewedAt ? new Date(reviewedAt).toISOString() : undefined,
      })

      if (result.success) {
        router.push("/dashboard")
      } else {
        setError(result.error || "Failed to update match")
      }
    } catch (err) {
      setError("An error occurred while updating the match")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="container mx-auto px-6 py-10">
      <div className="mb-10">
        <Link href="/dashboard" className="btn btn-ghost btn-sm gap-2 mb-4">
          ← Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-primary">Edit Match</h1>
        <p className="text-base-content/70 mt-2">
          Update the match details and feedback.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Match details */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">Match Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Match name"
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <input
                placeholder="Opponent"
                className="input input-bordered w-full"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
              />

              <input
                placeholder="Location"
                className="input input-bordered w-full"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <select
                className="select select-bordered w-full"
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
              >
                <option value="">Match type</option>
                {matchTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                className="select select-bordered w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {matchStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <input
                type="date"
                className="input input-bordered w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              <input
                type="time"
                className="input input-bordered w-full"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <input
                type="time"
                className="input input-bordered w-full"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />

              <textarea
                placeholder="Description"
                className="textarea textarea-bordered w-full md:col-span-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* People */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">People & Team</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                placeholder="Player ID"
                className="input input-bordered w-full"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                required
              />

              <input
                placeholder="Trainer ID"
                className="input input-bordered w-full"
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value)}
                required
              />

              <input
                placeholder="Team ID"
                className="input input-bordered w-full"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">Performance</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                placeholder="Mark"
                type="number"
                className="input input-bordered w-full"
                value={mark}
                onChange={(e) => setMark(e.target.value)}
              />

              <input
                placeholder="Intensity"
                type="number"
                className="input input-bordered w-full"
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
              />

              <input
                placeholder="Attitude"
                type="number"
                className="input input-bordered w-full"
                value={attitude}
                onChange={(e) => setAttitude(e.target.value)}
              />

              <input
                placeholder="Performance"
                type="number"
                className="input input-bordered w-full"
                value={performance}
                onChange={(e) => setPerformance(e.target.value)}
              />

              <input
                placeholder="Goals"
                type="number"
                className="input input-bordered w-full"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />

              <input
                placeholder="Assists"
                type="number"
                className="input input-bordered w-full"
                value={assists}
                onChange={(e) => setAssists(e.target.value)}
              />

              <input
                placeholder="Minutes played"
                type="number"
                className="input input-bordered w-full"
                value={minutesPlayed}
                onChange={(e) => setMinutesPlayed(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">Feedback</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                placeholder="Comment"
                className="textarea textarea-bordered w-full"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <textarea
                placeholder="Trainer feedback"
                className="textarea textarea-bordered w-full"
                value={trainerFeedback}
                onChange={(e) => setTrainerFeedback(e.target.value)}
              />

              <textarea
                placeholder="Player reflection"
                className="textarea textarea-bordered w-full"
                value={playerReflection}
                onChange={(e) => setPlayerReflection(e.target.value)}
              />

              <textarea
                placeholder="Strengths (comma separated)"
                className="textarea textarea-bordered w-full"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
              />

              <textarea
                placeholder="Weaknesses (comma separated)"
                className="textarea textarea-bordered w-full"
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
              />

              <textarea
                placeholder="Improvement areas (comma separated)"
                className="textarea textarea-bordered w-full"
                value={improvementAreas}
                onChange={(e) => setImprovementAreas(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tactical Actions */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">Tactical Actions</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Offensive actions in own half</span>
                </label>
                <textarea
                  placeholder="Offensive actions in own half"
                  className="textarea textarea-bordered w-full"
                  value={offensiveActionsOwnHalf}
                  onChange={(e) => setOffensiveActionsOwnHalf(e.target.value)}
                  disabled={currentUserRole === "PLAYER"}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Offensive actions in opponent's half</span>
                </label>
                <textarea
                  placeholder="Offensive actions in opponent's half"
                  className="textarea textarea-bordered w-full"
                  value={offensiveActionsOpponentHalf}
                  onChange={(e) => setOffensiveActionsOpponentHalf(e.target.value)}
                  disabled={currentUserRole === "PLAYER"}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Defensive actions in own half</span>
                </label>
                <textarea
                  placeholder="Defensive actions in own half"
                  className="textarea textarea-bordered w-full"
                  value={defensiveActionsOwnHalf}
                  onChange={(e) => setDefensiveActionsOwnHalf(e.target.value)}
                  disabled={currentUserRole === "PLAYER"}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Defensive actions in opponent's half</span>
                </label>
                <textarea
                  placeholder="Defensive actions in opponent's half"
                  className="textarea textarea-bordered w-full"
                  value={defensiveActionsOpponentHalf}
                  onChange={(e) => setOffensiveActionsOpponentHalf(e.target.value)}
                  disabled={currentUserRole === "PLAYER"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Review */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">Review Status</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={isReviewed}
                  onChange={(e) => setIsReviewed(e.target.checked)}
                />
                <span className="label-text">Reviewed</span>
              </label>

              <input
                type="datetime-local"
                className="input input-bordered w-full"
                value={reviewedAt}
                onChange={(e) => setReviewedAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
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
    </section>
  )
}