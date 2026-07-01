import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { getTranslationsServer } from "@/lib/i18n-server"
import MatchVideoContainer from "@/components/matches/MatchVideoContainer"

export default async function MatchPage({
  params,
}: {
  params: Promise<{ identifier: string }>
}) {
  const { identifier } = await params
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const t = await getTranslationsServer()

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/matches/${identifier}`,
    {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    }
  )

  if (response.status === 404) notFound()

  if (!response.ok) {
    throw new Error(`Failed to fetch match: ${response.status}`)
  }

  const data = await response.json()
  const match = data.match

  if (!match) notFound()

  return (
    <section className="container mx-auto px-6 py-10">
      <div className="mb-10">
        <Link href="/dashboard" className="btn btn-ghost mb-4">
          {t("match_details.back_dashboard")}
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-primary">
              {match.name}
            </h1>

            <p className="text-base-content/70 mt-2">
              {match.description || t("match_details.description_placeholder")}
            </p>
          </div>

          <div className="flex gap-2">
            <div className={`badge badge-primary badge-lg`}>
              {match.status === "COMPLETED" ? t("common.status_completed") :
               match.status === "SCHEDULED" ? t("common.status_scheduled") :
               match.status === "CANCELLED" ? t("common.status_cancelled") :
               match.status}
            </div>

            {match.matchType && (
              <div className="badge badge-outline badge-lg">
                {match.matchType === "LEAGUE" ? t("common.type_league") :
                 match.matchType === "CUP" ? t("common.type_cup") :
                 match.matchType === "FRIENDLY" ? t("common.type_friendly") :
                 match.matchType === "TRAINING" ? t("common.type_training") :
                 match.matchType}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">{t("match_details.info_title")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info label={t("common.opponent")} value={match.opponent} fallback={t("common.not_specified")} />
                <Info label={t("common.location")} value={match.location} fallback={t("common.not_specified")} />
                <Info label={t("common.date")} value={match.date} fallback={t("common.not_specified")} />
                <Info
                  label={t("common.time")}
                  value={
                    match.startTime && match.endTime
                      ? `${match.startTime} - ${match.endTime}`
                      : match.startTime || t("common.not_specified")
                  }
                  fallback={t("common.not_specified")}
                />
              </div>
            </div>
          </div>

          <MatchVideoContainer matchId={match.id} initialVideo={match.video} />

          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">{t("match_details.perf_title")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat label={t("common.goals")} value={match.goals ?? 0} />
                <Stat label={t("common.assists")} value={match.assists ?? 0} />
                <Stat label={t("common.minutes")} value={match.minutesPlayed ?? 0} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <Score label={t("common.mark")} value={match.mark} />
                <Score label={t("common.intensity")} value={match.intensity} />
                <Score label={t("common.attitude")} value={match.attitude} />
                <Score label={t("common.performance")} value={match.performance} />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">{t("match_details.feedback_title")}</h2>

              <FeedbackBlock
                title={t("match_details.comment_label")}
                value={match.comment}
                fallback={t("match_details.no_feedback")}
              />

              <FeedbackBlock
                title={t("match_details.trainer_feedback_label")}
                value={match.trainerFeedback}
                fallback={t("match_details.no_feedback")}
              />

              <FeedbackBlock
                title={t("match_details.player_reflection_label")}
                value={match.playerReflection}
                fallback={t("match_details.no_feedback")}
              />
            </div>
          </div>

          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">{t("match_form.tactical_actions_section")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeedbackBlock
                  title={t("match_form.offensive_actions_own_half")}
                  value={match.offensiveActionsOwnHalf}
                  fallback={t("match_details.no_feedback")}
                />
                <FeedbackBlock
                  title={t("match_form.offensive_actions_opponent_half")}
                  value={match.offensiveActionsOpponentHalf}
                  fallback={t("match_details.no_feedback")}
                />
                <FeedbackBlock
                  title={t("match_form.defensive_actions_own_half")}
                  value={match.defensiveActionsOwnHalf}
                  fallback={t("match_details.no_feedback")}
                />
                <FeedbackBlock
                  title={t("match_form.defensive_actions_opponent_half")}
                  value={match.defensiveActionsOpponentHalf}
                  fallback={t("match_details.no_feedback")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">{t("match_details.review_status")}</h2>

              <div
                className={
                  match.isReviewed
                    ? "badge badge-success text-white font-semibold"
                    : "badge badge-warning"
                }
              >
                {match.isReviewed ? t("match_details.reviewed_badge") : t("match_details.pending_badge")}
              </div>

              <Info
                label={t("match_details.reviewed_at_label")}
                value={
                  match.reviewedAt
                    ? new Date(match.reviewedAt).toLocaleString()
                    : undefined
                }
                fallback={t("match_details.not_reviewed_yet")}
              />
            </div>
          </div>

          <ListCard title={t("common.strengths")} items={match.strengths} fallback={t("match_details.no_items")} />
          <ListCard title={t("common.weaknesses")} items={match.weaknesses} fallback={t("match_details.no_items")} />
          <ListCard title={t("common.improvement_areas")} items={match.improvementAreas} fallback={t("match_details.no_items")} />

          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">{t("match_details.internal_info")}</h2>

              <Info label={t("match_details.player_id")} value={match.playerId} />
              <Info label={t("match_details.trainer_id")} value={match.trainerId} />
              <Info label={t("match_details.team_id")} value={match.teamId} />
              <Info
                label={t("match_details.updated_at")}
                value={new Date(match.updatedAt).toLocaleString()}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Info({
  label,
  value,
  fallback = "Not specified",
}: {
  label: string
  value?: string | number
  fallback?: string
}) {
  return (
    <div>
      <p className="text-sm text-base-content/60">{label}</p>
      <p className="font-medium">{value || fallback}</p>
    </div>
  )
}

function Stat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-box bg-base-200 p-4">
      <p className="text-sm text-base-content/60">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
    </div>
  )
}

function Score({
  label,
  value,
}: {
  label: string
  value?: number
}) {
  return (
    <div className="rounded-box bg-base-200 p-4 text-center">
      <p className="text-sm text-base-content/60">{label}</p>
      <p className="text-2xl font-bold text-primary">
        {value ?? "-"}
      </p>
      <p className="text-xs text-base-content/50">/10</p>
    </div>
  )
}

function FeedbackBlock({
  title,
  value,
  fallback = "No feedback added yet.",
}: {
  title: string
  value?: string
  fallback?: string
}) {
  return (
    <div className="rounded-box bg-base-200 p-4">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-base-content/70">
        {value || fallback}
      </p>
    </div>
  )
}

function ListCard({
  title,
  items,
  fallback = "No items added.",
}: {
  title: string
  items?: string[]
  fallback?: string
}) {
  return (
    <div className="card bg-base-100 shadow-md border border-base-200">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>

        {items && items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span key={item} className="badge badge-outline">
                {item}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-base-content/60">{fallback}</p>
        )}
      </div>
    </div>
  )
}