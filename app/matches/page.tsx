import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getTranslationsServer } from "@/lib/i18n-server"
import PageContainer from "@/components/ui/PageContainer"

export default async function MatchesPage() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "desc" },
  })
  const t = await getTranslationsServer()

  return (
    <PageContainer className="py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-primary">
            {t("matches_list.title")}
          </h1>
          <p className="text-base-content/70 mt-2">
            {t("matches_list.subtitle")}
          </p>
        </div>

        <Link href="/matches/create" className="btn btn-primary">+ {t("dashboard_page.create_btn")}</Link>
      </div>

      {/* Stats */}
    <div className="flex justify-end mb-8">
    <div className="stats shadow">
        <div className="stat text-right">
        <div className="text-base-content/70 mt-2">
            {t("dashboard_page.stats_total")}
        </div>
        <div className="stat-value text-primary">
            {matches.length}
        </div>
        </div>
    </div>
    </div>

      {/* Match List */}
      <div className="grid gap-4">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-200 border border-base-200"
          >
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="card-title text-xl">
                    {match.name}
                  </h2>

                  {match.description && (
                    <p className="text-base-content/70 mt-1">
                      {match.description}
                    </p>
                  )}
                </div>

                {match.mark && (
                  <div className="badge badge-primary badge-lg">
                    {match.mark}/10
                  </div>
                )}
              </div>

              <div className="divider my-2"></div>

              <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                {match.location && (
                  <span>📍 {match.location}</span>
                )}

                {match.updatedAt && (
                  <span>
                    🗓️ {new Date(match.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {matches.length === 0 && (
        <div className="hero bg-base-200 rounded-box mt-8">
          <div className="hero-content text-center">
            <div>
              <h2 className="text-2xl font-bold">
                {t("dashboard_page.no_matches_title")}
              </h2>
              <p className="py-3 text-base-content/70">
                {t("dashboard_page.no_matches_desc")}
              </p>
              <Link href="/matches/create" className="btn btn-primary">{t("dashboard_page.create_first")}</Link>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}