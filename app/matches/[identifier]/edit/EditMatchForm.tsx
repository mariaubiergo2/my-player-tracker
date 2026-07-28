"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { updateMatch } from "@/actions/matches"
import { MatchType } from "@/types/match"
import type { CompleteMatch } from "@/types/match"
import { toDateInput, toDateTimeInput } from "@/lib/utils"
import { useTranslation } from "@/components/LanguageProvider"
import { canEditMatchField } from "@/lib/permissions"
import MatchFeedbackThread from "@/components/matches/MatchFeedbackThread"

const matchTypes = ["FRIENDLY", "LEAGUE", "CUP", "TRAINING"]

export default function EditMatchForm({ 
  match, 
  currentUserRole,
  currentUserId,
  matchTrainerId
}: { 
  match: CompleteMatch
  currentUserRole?: string 
  currentUserId?: string
  matchTrainerId?: string
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const isPlayerLike = currentUserRole === "PLAYER" || currentUserRole === "GOAL_KEEPER"

  // State hooks for all Match fields
  const [name, setName] = useState(match.name ?? "")
  const [description, setDescription] = useState(match.description ?? "")
  const [location, setLocation] = useState(match.location ?? "")
  const [isHome, setIsHome] = useState(!!match.isHome)

  const [matchUrl, setMatchUrl] = useState(match.matchUrl ?? "")
  const [kitColor, setKitColor] = useState(match.kitColor ?? "")
  const [shirtNumber, setShirtNumber] = useState(match.shirtNumber ?? "")
  const [position, setPosition] = useState(match.position ?? "")
  const [minutesPlayed, setMinutesPlayed] = useState(match.minutesPlayed ?? "0")

  const [date, setDate] = useState(toDateInput(match.date))
  const [startTime, setStartTime] = useState(match.startTime ?? "")
  const [endTime, setEndTime] = useState(match.endTime ?? "")

  const [opponent, setOpponent] = useState(match.opponent ?? "")
  const [category, setCategory] = useState(match.category ?? "")
  const [leaguePosition, setLeaguePosition] = useState(match.leaguePosition ?? "")
  const [matchType, setMatchType] = useState(match.matchType ?? "")
  const [competitionType, setCompetitionType] = useState(match.competitionType ?? "")

  const [mark, setMark] = useState(match.mark != null ? String(match.mark) : "")
  const [intensity, setIntensity] = useState(match.intensity != null ? String(match.intensity) : "")
  const [attitude, setAttitude] = useState(match.attitude != null ? String(match.attitude) : "")
  const [performance, setPerformance] = useState(match.performance != null ? String(match.performance) : "")
  const [goals, setGoals] = useState(match.goals != null ? String(match.goals) : "")
  const [assists, setAssists] = useState(match.assists != null ? String(match.assists) : "")

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

    if (!name.trim() || !date) {
      setError(t("match_form.error_name_date"))
      return
    }

    if (isPlayerLike) {
      if (!kitColor.trim() || !shirtNumber.trim() || !position.trim() || !matchUrl.trim()) {
        setError(t("match_form.error_player_fields"))
        return
      }
    }

    setIsSubmitting(true)

    try {
      const result = await updateMatch(match.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        isHome,
        matchUrl: matchUrl.trim() || undefined,
        kitColor: kitColor.trim() || undefined,
        shirtNumber: shirtNumber.trim() || undefined,
        position: position.trim() || undefined,
        minutesPlayed: minutesPlayed.trim() || undefined,
        date: new Date(date).toISOString(),
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        opponent: opponent.trim() || undefined,
        category: category.trim() || undefined,
        leaguePosition: leaguePosition.trim() || undefined,
        matchType: (matchType || undefined) as MatchType | undefined,
        competitionType: competitionType.trim() || undefined,

        mark: toIntOrUndefined(mark),
        intensity: toIntOrUndefined(intensity),
        attitude: toIntOrUndefined(attitude),
        performance: toIntOrUndefined(performance),
        goals: goals.trim() !== "" ? parseInt(goals, 10) : null,
        assists: assists.trim() !== "" ? parseInt(assists, 10) : null,

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
        setError(result.error || t("common.error"))
      }
    } catch (err) {
      setError(t("common.error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="container mx-auto px-6 py-10">
      <div className="mb-10">
        <Link href="/dashboard" className="btn btn-ghost btn-sm gap-2 mb-4">
          {t("match_details.back_dashboard")}
        </Link>
        <h1 className="text-4xl font-bold text-primary">{t("match_form.edit_title")}</h1>
        <p className="text-base-content/70 mt-2">
          {t("match_form.edit_subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Top Grid: Match Info & Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Match details (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match details card */}
            <div className="card bg-base-100 shadow-md border border-base-200 h-full">
              <div className="card-body">
                <h2 className="card-title">{t("match_details.info_title")}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.match_name")}</span>
                    </label>
                    <input
                      placeholder={t("match_form.match_name")}
                      className="input input-bordered w-full"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "name")}
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("common.opponent")}</span>
                    </label>
                    <input
                      placeholder={t("common.opponent")}
                      className="input input-bordered w-full"
                      value={opponent}
                      onChange={(e) => setOpponent(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "opponent")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("common.location")}</span>
                    </label>
                    <input
                      placeholder={t("common.location")}
                      className="input input-bordered w-full"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "location")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.date")}</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "date")}
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.start_time")}</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "startTime")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.end_time")}</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "endTime")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.category")}</span>
                    </label>
                    <input
                      placeholder="ej. Juvenil B"
                      className="input input-bordered w-full"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "category")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.league_position")}</span>
                    </label>
                    <input
                      placeholder="ej. 3º"
                      className="input input-bordered w-full"
                      value={leaguePosition}
                      onChange={(e) => setLeaguePosition(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "leaguePosition")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.competition_type")}</span>
                    </label>
                    <input
                      placeholder="ej. División de Honor"
                      className="input input-bordered w-full"
                      value={competitionType}
                      onChange={(e) => setCompetitionType(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "competitionType")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.match_type")}</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={matchType}
                      onChange={(e) => setMatchType(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "matchType")}
                    >
                      <option value="">{t("match_form.match_type")}</option>
                      {matchTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control w-full flex items-center pt-2">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={isHome}
                        onChange={(e) => setIsHome(e.target.checked)}
                        disabled={!canEditMatchField(currentUserRole, "isHome")}
                      />
                      <span className="label-text font-semibold">{t("match_form.is_home_label")}</span>
                    </label>
                  </div>

                  <div className="form-control w-full md:col-span-2">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.description")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.description")}
                      className="textarea textarea-bordered w-full"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "description")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Actions and Review Status (1/3 width) */}
          <div className="space-y-6">
            {/* Actions Card */}
            <div className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body">
                <h2 className="card-title">{t("common.actions")}</h2>
                <div className="flex flex-col gap-2 w-full mt-2">
                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        {t("match_form.submitting")}
                      </>
                    ) : (
                      t("match_form.save_btn")
                    )}
                  </button>
                  <Link href="/dashboard" className="btn btn-ghost w-full">
                    {t("common.cancel")}
                  </Link>
                </div>
              </div>
            </div>

            {/* Review Card */}
            {!isPlayerLike && (
              <div className="card bg-base-100 shadow-md border border-base-200">
                <div className="card-body">
                  <h2 className="card-title">{t("match_details.review_status")}</h2>
                  <div className="space-y-4">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={isReviewed}
                        onChange={(e) => setIsReviewed(e.target.checked)}
                        disabled={!canEditMatchField(currentUserRole, "isReviewed")}
                      />
                      <span className="label-text font-semibold">{t("match_form.mark_reviewed")}</span>
                    </label>

                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold text-xs text-base-content/60">{t("match_details.reviewed_at_label")}</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="input input-bordered w-full"
                        value={reviewedAt}
                        onChange={(e) => setReviewedAt(e.target.value)}
                        disabled={!canEditMatchField(currentUserRole, "reviewedAt")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full-width container for all other parts */}
        <div className="space-y-6">
          {/* Player Technical Sheet */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">{t("match_form.technical_file")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">
                      {t("match_form.kit_color")} {isPlayerLike && " *"}
                    </span>
                  </label>
                  <input
                    placeholder="ej. Camiseta verde, medias blancas"
                    className="input input-bordered w-full"
                    value={kitColor}
                    onChange={(e) => setKitColor(e.target.value)}
                    disabled={!canEditMatchField(currentUserRole, "kitColor")}
                    required={isPlayerLike}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">
                      {t("match_form.shirt_number")} {isPlayerLike && " *"}
                    </span>
                  </label>
                  <input
                    placeholder="ej. 10"
                    className="input input-bordered w-full"
                    value={shirtNumber}
                    onChange={(e) => setShirtNumber(e.target.value)}
                    disabled={!canEditMatchField(currentUserRole, "shirtNumber")}
                    required={isPlayerLike}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">
                      {t("match_form.position")} {isPlayerLike && " *"}
                    </span>
                  </label>
                  <input
                    placeholder="ej. Mediocentro, Interior izquierdo"
                    className="input input-bordered w-full"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    disabled={!canEditMatchField(currentUserRole, "position")}
                    required={isPlayerLike}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">
                      {t("match_form.match_url")} {isPlayerLike && " *"}
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/..."
                    className="input input-bordered w-full"
                    value={matchUrl}
                    onChange={(e) => setMatchUrl(e.target.value)}
                    disabled={!canEditMatchField(currentUserRole, "matchUrl")}
                    required={isPlayerLike}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Player Performance */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">{t("match_details.perf_title")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">{t("common.goals")}</span>
                  </label>
                  <input
                    placeholder={t("common.goals")}
                    type="number"
                    className="input input-bordered w-full"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    disabled={!canEditMatchField(currentUserRole, "goals")}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">{t("common.assists")}</span>
                  </label>
                  <input
                    placeholder={t("common.assists")}
                    type="number"
                    className="input input-bordered w-full"
                    value={assists}
                    onChange={(e) => setAssists(e.target.value)}
                    disabled={!canEditMatchField(currentUserRole, "assists")}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">{t("common.minutes")}</span>
                  </label>
                  <input
                    placeholder={t("common.minutes")}
                    type="text"
                    className="input input-bordered w-full"
                    value={minutesPlayed}
                    onChange={(e) => setMinutesPlayed(e.target.value)}
                    disabled={!canEditMatchField(currentUserRole, "minutesPlayed")}
                  />
                </div>
              </div>

              {!isPlayerLike && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("common.mark")}</span>
                    </label>
                    <input
                      placeholder={t("common.mark")}
                      type="number"
                      className="input input-bordered w-full"
                      value={mark}
                      onChange={(e) => setMark(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "mark")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("common.intensity")}</span>
                    </label>
                    <input
                      placeholder={t("common.intensity")}
                      type="number"
                      className="input input-bordered w-full"
                      value={intensity}
                      onChange={(e) => setIntensity(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "intensity")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("common.attitude")}</span>
                    </label>
                    <input
                      placeholder={t("common.attitude")}
                      type="number"
                      className="input input-bordered w-full"
                      value={attitude}
                      onChange={(e) => setAttitude(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "attitude")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("common.performance")}</span>
                    </label>
                    <input
                      placeholder={t("common.performance")}
                      type="number"
                      className="input input-bordered w-full"
                      value={performance}
                      onChange={(e) => setPerformance(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "performance")}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Development / Strengths etc. */}
          {!isPlayerLike && (
            <div className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body">
                <h2 className="card-title">{t("match_form.analysis_section")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold text-success">{t("match_form.strengths")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.strengths")}
                      className="textarea textarea-bordered w-full"
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "strengths")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold text-warning">{t("match_form.weaknesses")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.weaknesses")}
                      className="textarea textarea-bordered w-full"
                      value={weaknesses}
                      onChange={(e) => setWeaknesses(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "weaknesses")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold text-info">{t("match_form.improvement")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.improvement")}
                      className="textarea textarea-bordered w-full"
                      value={improvementAreas}
                      onChange={(e) => setImprovementAreas(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "improvementAreas")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback & Comments */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">{t("match_details.feedback_title")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isPlayerLike && (
                  <>
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold">{t("match_details.comment_label")}</span>
                      </label>
                      <textarea
                        placeholder={t("match_details.comment_label")}
                        className="textarea textarea-bordered w-full"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={!canEditMatchField(currentUserRole, "comment")}
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold">{t("match_details.trainer_feedback_label")}</span>
                      </label>
                      <textarea
                        placeholder={t("match_details.trainer_feedback_label")}
                        className="textarea textarea-bordered w-full"
                        value={trainerFeedback}
                        onChange={(e) => setTrainerFeedback(e.target.value)}
                        disabled={!canEditMatchField(currentUserRole, "trainerFeedback")}
                      />
                    </div>
                  </>
                )}

                <div className="form-control w-full md:col-span-2">
                  <label className="label">
                    <span className="label-text font-semibold">{t("match_details.player_reflection_label")}</span>
                  </label>
                  <textarea
                    placeholder={t("match_details.player_reflection_label")}
                    className="textarea textarea-bordered w-full"
                    value={playerReflection}
                    onChange={(e) => setPlayerReflection(e.target.value)}
                    disabled={!canEditMatchField(currentUserRole, "playerReflection")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Actions */}
          {!isPlayerLike && (
            <div className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body">
                <h2 className="card-title">{t("match_form.tactical_actions_section")}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.offensive_actions_own_half")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.offensive_actions_own_half")}
                      className="textarea textarea-bordered w-full"
                      value={offensiveActionsOwnHalf}
                      onChange={(e) => setOffensiveActionsOwnHalf(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "offensiveActionsOwnHalf")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.offensive_actions_opponent_half")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.offensive_actions_opponent_half")}
                      className="textarea textarea-bordered w-full"
                      value={offensiveActionsOpponentHalf}
                      onChange={(e) => setOffensiveActionsOpponentHalf(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "offensiveActionsOpponentHalf")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.defensive_actions_own_half")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.defensive_actions_own_half")}
                      className="textarea textarea-bordered w-full"
                      value={defensiveActionsOwnHalf}
                      onChange={(e) => setDefensiveActionsOwnHalf(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "defensiveActionsOwnHalf")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.defensive_actions_opponent_half")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.defensive_actions_opponent_half")}
                      className="textarea textarea-bordered w-full"
                      value={defensiveActionsOpponentHalf}
                      onChange={(e) => setDefensiveActionsOpponentHalf(e.target.value)}
                      disabled={!canEditMatchField(currentUserRole, "defensiveActionsOpponentHalf")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      <div className="mt-8">
        <MatchFeedbackThread
          matchId={match.id}
          currentUserId={currentUserId || ""}
          currentUserRole={currentUserRole || "PLAYER"}
          matchPlayerId={match.playerId}
          matchTrainerId={matchTrainerId || match.trainerId || ""}
          readOnly={false}
        />
      </div>
    </section>
  )
}