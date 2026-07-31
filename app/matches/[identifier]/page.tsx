import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { getTranslationsServer } from "@/lib/i18n-server"
import { getCurrentUser } from "@/lib/auth"
import MatchFeedbackThread from "@/components/matches/MatchFeedbackThread"
import AutoMarkRead from "@/components/matches/AutoMarkRead"
import PageContainer from "@/components/ui/PageContainer"

export default async function MatchPage({
  params,
}: {
  params: Promise<{ identifier: string }>
}) {
  const { identifier } = await params
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const t = await getTranslationsServer()
  const currentUser = await getCurrentUser()

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
    <PageContainer className="py-10">
      {currentUser?.role === "TRAINER" && (
        <AutoMarkRead matchId={identifier} trainerId={currentUser.userId} />
      )}
      <div className="mb-10">
        <Link 
          href={currentUser?.role === "TRAINER" ? "/trainer/my-players" : "/dashboard"} 
          className="btn btn-ghost mb-4"
        >
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
        </div>
      </div>

      {/* Grid with Match Info and Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Match info (2/3) */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-md border border-base-200 h-full">
            <div className="card-body">
              <h2 className="card-title">{t("match_details.info_title")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info label={t("common.opponent")} value={match.opponent} fallback={t("common.not_specified")} />
                <Info label={t("common.location")} value={match.location} fallback={t("common.not_specified")} />
                <Info label={t("common.date")} value={match.date ? new Date(match.date).toLocaleDateString() : undefined} fallback={t("common.not_specified")} />
                <Info
                  label={t("common.time")}
                  value={
                    match.startTime && match.endTime
                      ? `${match.startTime} - ${match.endTime}`
                      : match.startTime || t("common.not_specified")
                  }
                  fallback={t("common.not_specified")}
                />
                <Info label={t("match_details.match_venue")} value={match.isHome !== null && match.isHome !== undefined ? (match.isHome ? t("match_details.home_venue") : t("match_details.away_venue")) : undefined} fallback={t("common.not_specified")} />
                <Info label={t("match_details.category_label")} value={match.category} fallback={t("common.not_specified")} />
                <Info label={t("match_details.league_position_label")} value={match.leaguePosition} fallback={t("common.not_specified")} />
                <Info label={t("match_details.competition_label")} value={match.competitionType} fallback={t("common.not_specified")} />
                <Info
                  label={t("match_form.match_type")}
                  value={
                    match.matchType === "LEAGUE" ? t("common.type_league") :
                    match.matchType === "CUP" ? t("common.type_cup") :
                    match.matchType === "FRIENDLY" ? t("common.type_friendly") :
                    match.matchType === "TRAINING" ? t("common.type_training") :
                    match.matchType || undefined
                  }
                  fallback={t("common.not_specified")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Side panel (1/3) */}
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

          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">{t("match_details.internal_info")}</h2>

              <Info
                label={t("match_details.updated_at")}
                value={new Date(match.updatedAt).toLocaleString()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full-width container for all other parts */}
      <div className="space-y-6">
        {/* Special Zone: Ficha Técnica del Jugador */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">{t("match_details.technical_file")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Info label={t("match_details.kit_color_label")} value={match.kitColor} fallback={t("common.not_specified")} />
              <Info label={t("match_details.shirt_number_label")} value={match.shirtNumber} fallback={t("common.not_specified")} />
              <Info label={t("match_details.position_label")} value={match.position} fallback={t("common.not_specified")} />
              <div>
                <p className="text-sm text-base-content/60">{t("match_details.match_url_label")}</p>
                {match.matchUrl ? (
                  <a href={match.matchUrl} target="_blank" rel="noopener noreferrer" className="link link-primary font-medium break-all">
                    {match.matchUrl}
                  </a>
                ) : (
                  <p className="font-medium text-base-content/40">{t("common.not_specified")}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Player Performance */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">{t("match_details.perf_title")}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Stat label={t("common.goals")} value={match.goals ?? 0} />
              <Stat label={t("common.assists")} value={match.assists ?? 0} />
              <Stat label={t("common.minutes")} value={match.minutesPlayed ?? "0"} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <Score label={t("common.mark")} value={match.mark} />
              <Score label={t("common.intensity")} value={match.intensity} />
              <Score label={t("common.attitude")} value={match.attitude} />
              <Score label={t("common.performance")} value={match.performance} />
            </div>
          </div>
        </div>

        {/* Development / Strengths etc. */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">{t("match_form.analysis_section")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-success mb-2">{t("match_form.strengths")}</h3>
                {match.strengths && match.strengths.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {match.strengths.map((item: string) => (
                      <span key={item} className="badge badge-success badge-outline">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-base-content/60 text-sm">{t("match_details.no_items")}</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-warning mb-2">{t("match_form.weaknesses")}</h3>
                {match.weaknesses && match.weaknesses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {match.weaknesses.map((item: string) => (
                      <span key={item} className="badge badge-warning badge-outline">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-base-content/60 text-sm">{t("match_details.no_items")}</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-info mb-2">{t("match_form.improvement")}</h3>
                {match.improvementAreas && match.improvementAreas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {match.improvementAreas.map((item: string) => (
                      <span key={item} className="badge badge-info badge-outline">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-base-content/60 text-sm">{t("match_details.no_items")}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback & Comments */}
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

        {/* Tactical Actions */}
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

        {/* Threaded Feedback Section */}
        {currentUser && (
          <MatchFeedbackThread
            matchId={match.id}
            currentUserId={currentUser.userId}
            currentUserRole={currentUser.role}
            matchPlayerId={match.playerId}
            matchTrainerId={match.trainerId || ""}
            readOnly={true}
          />
        )}
      </div>
    </PageContainer>
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
