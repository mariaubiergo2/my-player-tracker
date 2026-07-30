// app/matches/create/page.tsx
"use client"

import Link from "next/link"
import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { createMatch, getSelectablePlayers } from "@/actions/matches"
import { useTranslation } from "@/components/LanguageProvider"
import { canEditMatchField } from "@/lib/permissions"

const initialState = {
  message: "",
}

const matchTypes = ["FRIENDLY", "LEAGUE", "CUP", "TRAINING"]

export default function NewMatchPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { t } = useTranslation()

  const [state, formAction, pending] = useActionState(
    createMatch,
    initialState
  )

  const [players, setPlayers] = useState<{ id: string; name: string; surname: string; email?: string }[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role === "TRAINER" || user?.role === "ADMIN") {
        loadSelectablePlayers()
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  const loadSelectablePlayers = async () => {
    setLoadingPlayers(true)
    try {
      const res = await getSelectablePlayers()
      if (res.success && res.players) {
        setPlayers(res.players)
      }
    } catch (err) {
      console.error("Failed to load players list", err)
    } finally {
      setLoadingPlayers(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const role = user.role
  const isPlayerLike = role === "PLAYER" || role === "GOAL_KEEPER"

  return (
    <section className="container mx-auto px-6 py-10 animate-fade-in">
      <div className="mb-10">
        <Link href="/dashboard" className="btn btn-ghost mb-4">
          {t("match_details.back_dashboard")}
        </Link>

        <h1 className="text-4xl font-bold text-primary">
          {t("match_form.create_title")}
        </h1>

        <p className="text-base-content/70 mt-2">
          {t("match_form.create_subtitle")}
        </p>
      </div>

      <form action={formAction} className="space-y-8">
        {/* Top Grid: Match Info & Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Player Selection & Match details (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Player Dropdown / Relation Fields */}
            {!isPlayerLike && (
              <div className="card bg-base-100 shadow-md border border-base-200">
                <div className="card-body">
                  <h2 className="card-title">{t("match_form.player")}</h2>
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.select_player_label")}</span>
                    </label>
                    {loadingPlayers ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <select className="select select-bordered w-full" name="playerId" required>
                        <option value="">{t("match_form.select_player")}</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.surname}{p.email ? ` (${p.email})` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Hidden Input for Player Role */}
            {isPlayerLike && (
              <input type="hidden" name="playerId" value={user.id} />
            )}

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
                      name="name"
                      required
                      disabled={!canEditMatchField(role, "name")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("common.opponent")}</span>
                    </label>
                    <input
                      placeholder={t("common.opponent")}
                      className="input input-bordered w-full"
                      name="opponent"
                      disabled={!canEditMatchField(role, "opponent")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("common.location")}</span>
                    </label>
                    <input
                      placeholder={t("common.location")}
                      className="input input-bordered w-full"
                      name="location"
                      disabled={!canEditMatchField(role, "location")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.date")}</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      name="date"
                      required
                      disabled={!canEditMatchField(role, "date")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.start_time")}</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      name="startTime"
                      disabled={!canEditMatchField(role, "startTime")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.end_time")}</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      name="endTime"
                      disabled={!canEditMatchField(role, "endTime")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.category")}</span>
                    </label>
                    <input
                      placeholder="ej. Juvenil B"
                      className="input input-bordered w-full"
                      name="category"
                      disabled={!canEditMatchField(role, "category")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.league_position")}</span>
                    </label>
                    <input
                      placeholder="ej. 3º"
                      className="input input-bordered w-full"
                      name="leaguePosition"
                      disabled={!canEditMatchField(role, "leaguePosition")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.competition_type")}</span>
                    </label>
                    <input
                      placeholder="ej. División de Honor"
                      className="input input-bordered w-full"
                      name="competitionType"
                      disabled={!canEditMatchField(role, "competitionType")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.match_type")}</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      name="matchType"
                      disabled={!canEditMatchField(role, "matchType")}
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
                        name="isHome"
                        disabled={!canEditMatchField(role, "isHome")}
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
                      name="description"
                      disabled={!canEditMatchField(role, "description")}
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
                {state?.message && (
                  <div role="alert" className="alert alert-error text-sm py-2">
                    <span>{state.message}</span>
                  </div>
                )}
                <div className="flex flex-col gap-2 w-full mt-2">
                  <button
                    disabled={pending}
                    className="btn btn-primary w-full"
                    type="submit"
                  >
                    {pending ? t("match_form.submitting") : t("match_form.create_btn")}
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
                        name="isReviewed"
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        disabled={!canEditMatchField(role, "isReviewed")}
                      />
                      <span className="label-text font-semibold">{t("match_form.mark_reviewed")}</span>
                    </label>

                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold text-xs text-base-content/60">{t("match_details.reviewed_at_label")}</span>
                      </label>
                      <input
                        placeholder={t("match_details.reviewed_at_label")}
                        name="reviewedAt"
                        type="datetime-local"
                        className="input input-bordered w-full"
                        disabled={!canEditMatchField(role, "reviewedAt")}
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
                    name="kitColor"
                    disabled={!canEditMatchField(role, "kitColor")}
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
                    name="shirtNumber"
                    disabled={!canEditMatchField(role, "shirtNumber")}
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
                    name="position"
                    disabled={!canEditMatchField(role, "position")}
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
                    name="matchUrl"
                    disabled={!canEditMatchField(role, "matchUrl")}
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
                    name="goals"
                    disabled={!canEditMatchField(role, "goals")}
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
                    name="assists"
                    disabled={!canEditMatchField(role, "assists")}
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
                    name="minutesPlayed"
                    disabled={!canEditMatchField(role, "minutesPlayed")}
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
                      name="mark"
                      disabled={!canEditMatchField(role, "mark")}
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
                      name="intensity"
                      disabled={!canEditMatchField(role, "intensity")}
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
                      name="attitude"
                      disabled={!canEditMatchField(role, "attitude")}
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
                      name="performance"
                      disabled={!canEditMatchField(role, "performance")}
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
                      name="strengths"
                      disabled={!canEditMatchField(role, "strengths")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold text-warning">{t("match_form.weaknesses")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.weaknesses")}
                      className="textarea textarea-bordered w-full"
                      name="weaknesses"
                      disabled={!canEditMatchField(role, "weaknesses")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold text-info">{t("match_form.improvement")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.improvement")}
                      className="textarea textarea-bordered w-full"
                      name="improvementAreas"
                      disabled={!canEditMatchField(role, "improvementAreas")}
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
                        name="comment"
                        disabled={!canEditMatchField(role, "comment")}
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold">{t("match_details.trainer_feedback_label")}</span>
                      </label>
                      <textarea
                        placeholder={t("match_details.trainer_feedback_label")}
                        className="textarea textarea-bordered w-full"
                        name="trainerFeedback"
                        disabled={!canEditMatchField(role, "trainerFeedback")}
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
                    name="playerReflection"
                    disabled={!canEditMatchField(role, "playerReflection")}
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
                      name="offensiveActionsOwnHalf"
                      disabled={!canEditMatchField(role, "offensiveActionsOwnHalf")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.offensive_actions_opponent_half")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.offensive_actions_opponent_half")}
                      className="textarea textarea-bordered w-full"
                      name="offensiveActionsOpponentHalf"
                      disabled={!canEditMatchField(role, "offensiveActionsOpponentHalf")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.defensive_actions_own_half")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.defensive_actions_own_half")}
                      className="textarea textarea-bordered w-full"
                      name="defensiveActionsOwnHalf"
                      disabled={!canEditMatchField(role, "defensiveActionsOwnHalf")}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("match_form.defensive_actions_opponent_half")}</span>
                    </label>
                    <textarea
                      placeholder={t("match_form.defensive_actions_opponent_half")}
                      className="textarea textarea-bordered w-full"
                      name="defensiveActionsOpponentHalf"
                      disabled={!canEditMatchField(role, "defensiveActionsOpponentHalf")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </section>
  )
}