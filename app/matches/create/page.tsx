// app/matches/create/page.tsx
"use client"

import Link from "next/link"
import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { createMatch } from "@/actions/matches"
import { useTranslation } from "@/components/LanguageProvider"

const initialState = {
  message: "",
}

export default function NewMatchPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { t } = useTranslation()

  const [state, formAction, pending] = useActionState(
    createMatch,
    initialState
  )

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      }
    }
  }, [isLoading, isAuthenticated, router])

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

  return (
    <section className="container mx-auto px-6 py-10">
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
        {/* Match details */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">{t("match_form.basic_info")}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder={t("match_form.match_name")}
                className="input input-bordered w-full"
                name="name"
              />

              <input
                placeholder={t("common.opponent")}
                className="input input-bordered w-full"
                name="opponent"
              />

              <input
                placeholder={t("common.location")}
                className="input input-bordered w-full"
                name="location"
              />

              <input
                placeholder={t("match_form.match_type")}
                className="input input-bordered w-full"
                name="matchType"
              />

              <input
                placeholder={t("common.status")}
                className="input input-bordered w-full"
                name="status"
              />

              <input
                placeholder={t("common.date")}
                type="date"
                className="input input-bordered w-full"
                name="date"
              />

              <input
                placeholder={t("match_form.start_time")}
                type="time"
                className="input input-bordered w-full"
                name="startTime"
              />

              <input
                placeholder={t("match_form.end_time")}
                type="time"
                className="input input-bordered w-full"
                name="endTime"
              />

              <textarea
                placeholder={t("match_form.description")}
                className="textarea textarea-bordered w-full md:col-span-2"
                name="description"
              />

              <div className="md:col-span-2">
                <label className="label">
                  <span className="label-text font-semibold">{t("video.upload_title")}</span>
                </label>
                <input
                  type="file"
                  name="videoFile"
                  accept="video/*"
                  className="file-input file-input-bordered w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* People */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">{t("match_form.player")} & {t("match_form.trainer")}</h2>

            <div className={`grid grid-cols-1 ${user.role === "PLAYER" ? "md:grid-cols-1" : "md:grid-cols-3"} gap-4`}>
              {user.role === "PLAYER" ? (
                <input
                  type="hidden"
                  name="playerId"
                  value={user.id}
                />
              ) : (
                <>
                  <input
                    placeholder={t("match_form.player")}
                    className="input input-bordered w-full"
                    name="playerId"
                  />

                  <input
                    placeholder={t("match_form.trainer")}
                    className="input input-bordered w-full"
                    name="trainerId"
                  />
                </>
              )}

              <input
                placeholder={t("match_details.team_id")}
                className="input input-bordered w-full"
                name="teamId"
              />
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">{t("match_details.perf_title")}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                placeholder={t("common.mark")}
                className="input input-bordered w-full"
                name="mark"
              />

              <input
                placeholder={t("common.intensity")}
                className="input input-bordered w-full"
                name="intensity"
              />

              <input
                placeholder={t("common.attitude")}
                className="input input-bordered w-full"
                name="attitude"
              />

              <input
                placeholder={t("common.performance")}
                className="input input-bordered w-full"
                name="performance"
              />

              <input
                placeholder={t("common.goals")}
                className="input input-bordered w-full"
                name="goals"
              />

              <input
                placeholder={t("common.assists")}
                className="input input-bordered w-full"
                name="assists"
              />

              <input
                placeholder={t("common.minutes")}
                className="input input-bordered w-full"
                name="minutesPlayed"
              />
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">{t("match_details.feedback_title")}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                placeholder={t("match_details.comment_label")}
                className="textarea textarea-bordered w-full"
                name="comment"
              />

              <textarea
                placeholder={t("match_details.trainer_feedback_label")}
                className="textarea textarea-bordered w-full"
                name="trainerFeedback"
              />

              <textarea
                placeholder={t("match_details.player_reflection_label")}
                className="textarea textarea-bordered w-full"
                name="playerReflection"
              />

              <textarea
                placeholder={t("match_form.strengths")}
                className="textarea textarea-bordered w-full"
                name="strengths"
              />

              <textarea
                placeholder={t("match_form.weaknesses")}
                className="textarea textarea-bordered w-full"
                name="weaknesses"
              />

              <textarea
                placeholder={t("match_form.improvement")}
                className="textarea textarea-bordered w-full"
                name="improvementAreas"
              />
            </div>
          </div>
        </div>

        {/* Review */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">{t("match_form.review_status_label")}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  name="isReviewed"
                  type="checkbox"
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">{t("match_details.reviewed_badge")}</span>
              </label>

              <input
                placeholder={t("match_details.reviewed_at_label")}
                name="reviewedAt"
                type="datetime-local"
                className="input input-bordered w-full"
              />
            </div>
          </div>
        </div>

        {state?.message && (
          <div role="alert" className="alert alert-error">
            <span>{state.message}</span>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/dashboard" className="btn btn-ghost">
            {t("common.cancel")}
          </Link>

          <button
            disabled={pending}
            className="btn btn-primary"
            type="submit"
          >
            {pending ? t("match_form.submitting") : t("match_form.create_btn")}
          </button>
        </div>
      </form>
    </section>
  )
}