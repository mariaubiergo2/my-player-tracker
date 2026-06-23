import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"

export default async function MatchPage({
  params,
}: {
  params: Promise<{ identifier: string }>
}) {
  const { identifier } = await params
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

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
          ← Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-primary">
              {match.name}
            </h1>

            <p className="text-base-content/70 mt-2">
              {match.description || "No description available."}
            </p>
          </div>

          <div className="flex gap-2">
            <div className="badge badge-primary badge-lg">
              {match.status}
            </div>

            {match.matchType && (
              <div className="badge badge-outline badge-lg">
                {match.matchType}
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
              <h2 className="card-title">Match Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info label="Opponent" value={match.opponent} />
                <Info label="Location" value={match.location} />
                <Info label="Date" value={match.date} />
                <Info
                  label="Time"
                  value={
                    match.startTime && match.endTime
                      ? `${match.startTime} - ${match.endTime}`
                      : match.startTime || "Not specified"
                  }
                />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">Player Performance</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat label="Goals" value={match.goals ?? 0} />
                <Stat label="Assists" value={match.assists ?? 0} />
                <Stat label="Minutes" value={match.minutesPlayed ?? 0} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <Score label="Mark" value={match.mark} />
                <Score label="Intensity" value={match.intensity} />
                <Score label="Attitude" value={match.attitude} />
                <Score label="Performance" value={match.performance} />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">Feedback</h2>

              <FeedbackBlock
                title="General Comment"
                value={match.comment}
              />

              <FeedbackBlock
                title="Trainer Feedback"
                value={match.trainerFeedback}
              />

              <FeedbackBlock
                title="Player Reflection"
                value={match.playerReflection}
              />
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">Review</h2>

              <div
                className={
                  match.isReviewed
                    ? "badge badge-success"
                    : "badge badge-warning"
                }
              >
                {match.isReviewed ? "Reviewed" : "Pending review"}
              </div>

              <Info
                label="Reviewed at"
                value={
                  match.reviewedAt
                    ? new Date(match.reviewedAt).toLocaleString()
                    : "Not reviewed yet"
                }
              />
            </div>
          </div>

          <ListCard title="Strengths" items={match.strengths} />
          <ListCard title="Weaknesses" items={match.weaknesses} />
          <ListCard title="Improvement Areas" items={match.improvementAreas} />

          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title">Internal Info</h2>

              <Info label="Player ID" value={match.playerId} />
              <Info label="Trainer ID" value={match.trainerId} />
              <Info label="Team ID" value={match.teamId} />
              <Info
                label="Updated"
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
}: {
  label: string
  value?: string | number
}) {
  return (
    <div>
      <p className="text-sm text-base-content/60">{label}</p>
      <p className="font-medium">{value || "Not specified"}</p>
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
}: {
  title: string
  value?: string
}) {
  return (
    <div className="rounded-box bg-base-200 p-4">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-base-content/70">
        {value || "No feedback added yet."}
      </p>
    </div>
  )
}

function ListCard({
  title,
  items,
}: {
  title: string
  items?: string[]
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
          <p className="text-base-content/60">No items added.</p>
        )}
      </div>
    </div>
  )
}