import Link from "next/link";
import { getTranslationsServer } from "@/lib/i18n-server";
import PageContainer from "@/components/ui/PageContainer";

export default async function Home() {
  const t = await getTranslationsServer();

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-b from-base-100 via-base-200 to-base-300">
      
      {/* Hero Section */}
      <section className="relative grass-bg border-b border-secondary/25 py-20 px-6 sm:px-8 lg:px-12 text-center flex flex-col items-center justify-center min-h-[75vh]">
        <div className="grass-sweep"></div>
        {/* Subtle decorative glow circles */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none z-10" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-secondary/15 rounded-full blur-3xl pointer-events-none z-10" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{t("home.badge")}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent pb-2 font-display">
            {t("home.title")}
          </h1>

          <p className="text-lg sm:text-xl text-base-content/75 max-w-2xl mx-auto leading-relaxed">
            {t("home.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link 
              href="/dashboard" 
              className="btn btn-primary btn-lg shadow-lg hover:scale-105 active:scale-95 transition-all w-full sm:w-auto px-8"
            >
              {t("home.btn_dashboard")}
            </Link>
            <Link 
              href="/about" 
              className="btn btn-outline btn-secondary btn-lg hover:scale-105 active:scale-95 transition-all w-full sm:w-auto px-8"
            >
              {t("home.btn_about")}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <PageContainer className="mb-16" maxWidthClassName="max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-8 bg-base-100 rounded-3xl border border-base-content/10 shadow-2xl">
          <div className="text-center space-y-2 p-4 border-b sm:border-b-0 sm:border-r border-base-content/10">
            <div className="text-4xl font-extrabold text-primary">100%</div>
            <div className="text-sm font-semibold uppercase text-base-content/50">{t("home.stats.perf_title")}</div>
            <p className="text-xs text-base-content/60 px-4">{t("home.stats.perf_desc")}</p>
          </div>
          <div className="text-center space-y-2 p-4 border-b sm:border-b-0 sm:border-r border-base-content/10">
            <div className="text-4xl font-extrabold text-secondary">Collaborative</div>
            <div className="text-sm font-semibold uppercase text-base-content/50">{t("home.stats.collab_title")}</div>
            <p className="text-xs text-base-content/60 px-4">{t("home.stats.collab_desc")}</p>
          </div>
          <div className="text-center space-y-2 p-4">
            <div className="text-4xl font-extrabold text-accent">Active</div>
            <div className="text-sm font-semibold uppercase text-base-content/50">{t("home.stats.active_title")}</div>
            <p className="text-xs text-base-content/60 px-4">{t("home.stats.active_desc")}</p>
          </div>
        </div>
      </PageContainer>

      {/* Feature Cards Grid */}
      <PageContainer className="py-12 space-y-12" maxWidthClassName="max-w-7xl">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold">{t("home.features_title")}</h2>
          <p className="text-base-content/60">{t("home.features_subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="card bg-base-100 border border-base-content/10 shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-300">
            <div className="card-body space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl text-primary">
                ⚽
              </div>
              <h3 className="card-title text-xl font-bold">{t("home.features.scheduling_title")}</h3>
              <p className="text-sm text-base-content/70">
                {t("home.features.scheduling_desc")}
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="card bg-base-100 border border-base-content/10 shadow-xl hover:shadow-2xl hover:border-secondary/30 transition-all duration-300">
            <div className="card-body space-y-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-2xl text-secondary">
                📊
              </div>
              <h3 className="card-title text-xl font-bold">{t("home.features.metrics_title")}</h3>
              <p className="text-sm text-base-content/70">
                {t("home.features.metrics_desc")}
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="card bg-base-100 border border-base-content/10 shadow-xl hover:shadow-2xl hover:border-accent/30 transition-all duration-300">
            <div className="card-body space-y-3">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-2xl text-accent">
                💬
              </div>
              <h3 className="card-title text-xl font-bold">{t("home.features.feedback_title")}</h3>
              <p className="text-sm text-base-content/70">
                {t("home.features.feedback_desc")}
              </p>
            </div>
          </div>

        </div>
      </PageContainer>

      {/* Workflow Showcase */}
      <PageContainer className="py-12" maxWidthClassName="max-w-6xl">
        <div className="bg-base-100 rounded-3xl border-2 border-secondary/20 shadow-2xl p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="badge badge-accent font-semibold">{t("home.workflow_badge")}</span>
            <h2 className="text-2xl sm:text-3xl font-bold">{t("home.workflow_title")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-base-content/10">
            
            {/* Player block */}
            <div className="space-y-4 pt-6 md:pt-0">
              <div className="flex items-center gap-3 text-xl font-bold">
                <span>🏃‍♂️</span>
                <h3>{t("home.workflow_player_title")}</h3>
              </div>
              <p className="text-sm text-base-content/70 leading-relaxed">
                {t("home.workflow_player_desc")}
              </p>
              <ul className="text-xs text-base-content/60 space-y-1.5">
                <li>• {t("home.workflow_player_bullets.0")}</li>
                <li>• {t("home.workflow_player_bullets.1")}</li>
                <li>• {t("home.workflow_player_bullets.2")}</li>
              </ul>
            </div>

            {/* Trainer block */}
            <div className="space-y-4 pt-6 md:pt-0 md:pl-8">
              <div className="flex items-center gap-3 text-xl font-bold">
                <span>📋</span>
                <h3>{t("home.workflow_trainer_title")}</h3>
              </div>
              <p className="text-sm text-base-content/70 leading-relaxed">
                {t("home.workflow_trainer_desc")}
              </p>
              <ul className="text-xs text-base-content/60 space-y-1.5">
                <li>• {t("home.workflow_trainer_bullets.0")}</li>
                <li>• {t("home.workflow_trainer_bullets.1")}</li>
                <li>• {t("home.workflow_trainer_bullets.2")}</li>
              </ul>
            </div>

          </div>
        </div>
      </PageContainer>

      {/* CTA section */}
      <PageContainer className="py-12 text-center space-y-6" maxWidthClassName="max-w-5xl">
        <h2 className="text-2xl sm:text-3xl font-bold">{t("home.cta_title")}</h2>
        <p className="text-sm sm:text-base text-base-content/70 max-w-md mx-auto">
          {t("home.cta_subtitle")}
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard" className="btn btn-primary hover:scale-105 active:scale-95 transition-all px-8">
            {t("home.cta_start")}
          </Link>
          <Link href="/about" className="btn btn-ghost hover:scale-105 active:scale-95 transition-all">
            {t("home.cta_read")}
          </Link>
        </div>
      </PageContainer>

    </div>
  );
}

