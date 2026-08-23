"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import { getObjectivesHistory } from "@/actions/objectives";
import { QuestionnaireType } from "@prisma/client";
import SegmentedTabs from "@/components/ui/SegmentedTabs";

export default function ObjectivesHistoryPage({ params }: { params: Promise<{ playerId: string }> }) {
  const router = useRouter();
  const { playerId } = use(params);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();

  const [history, setHistory] = useState<any[]>([]);
  const [player, setPlayer] = useState<any>(null);
  const [category, setCategory] = useState<QuestionnaireType>("ANALYSIS_VIDEO");
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadHistory = async (cat: QuestionnaireType) => {
    setLoadingData(true);
    setErrorMessage("");
    try {
      const res = await getObjectivesHistory(playerId, cat);
      if (res.success && res.data) {
        setHistory(res.data.history);
        setPlayer(res.data.player);
      } else {
        setErrorMessage(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t("common.error"));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        loadHistory(category);
      }
    }
  }, [isLoading, isAuthenticated, user, playerId, category]);

  if (isLoading || loadingData) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <PageContainer className="py-10">
        <div className="alert alert-error shadow-lg mb-6">
          <span>❌ {errorMessage}</span>
        </div>
        <Link href="/questionnaires" className="btn btn-ghost">
          ← {t("questionnaires.objectives_history_back")}
        </Link>
      </PageContainer>
    );
  }

  const isTrainer = user?.role === "TRAINER";
  const playerFullName = player ? `${player.name} ${player.surname}` : "Jugador";

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ANALYSIS_VIDEO":
        return (
          <span className="badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-bold border-none text-[11px] uppercase tracking-wide">
            {t("categories.ANALYSIS_VIDEO") || "Vídeo"}
          </span>
        );
      case "PHYSICAL":
        return (
          <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-bold border-none text-[11px] uppercase tracking-wide">
            {t("categories.PHYSICAL") || "Físic"}
          </span>
        );
      case "NUTRITION":
        return (
          <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 font-bold border-none text-[11px] uppercase tracking-wide">
            {t("categories.NUTRITION") || "Nutrició"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer className="py-10 animate-fade-in" maxWidthClassName="max-w-3xl">
      <div className="mb-8">
        <Link
          href={isTrainer ? "/questionnaires" : "/dashboard"}
          className="btn btn-ghost mb-4"
        >
          ← {t("questionnaires.objectives_history_back")}
        </Link>

        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t("questionnaires.objectives_history_title")}
        </h1>
        <p className="text-base-content/65 mt-2">
          {t("questionnaires.player")}: <strong className="text-base-content font-semibold">{playerFullName}</strong>
        </p>
      </div>

      <SegmentedTabs
        tabs={[
          { id: "ANALYSIS_VIDEO", label: `📺 ${t("categories.ANALYSIS_VIDEO") || "Vídeo"}` },
          { id: "PHYSICAL", label: `🏃‍♂️ ${t("categories.PHYSICAL") || "Físic"}` },
          { id: "NUTRITION", label: `🍎 ${t("categories.NUTRITION") || "Nutrició"}` },
        ]}
        activeTab={category}
        onChange={setCategory}
        className="mb-6"
      />

      {history.length === 0 ? (
        <div className="hero bg-base-200 rounded-2xl p-10 text-center shadow-inner border border-base-content/5">
          <div className="max-w-md">
            <span className="text-5xl">📖</span>
            <h3 className="text-2xl font-bold mt-4">Sin historial</h3>
            <p className="py-2 text-base-content/60">{t("questionnaires.objectives_no_player_objectives")}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((obj, index) => {
            const isActive = obj.effectiveTo === null;
            const fromStr = new Date(obj.effectiveFrom).toLocaleDateString(locale);
            const toStr = obj.effectiveTo ? new Date(obj.effectiveTo).toLocaleDateString(locale) : "";

            return (
              <div
                key={obj.id}
                className={`card bg-base-100 shadow border transition-all duration-200 ${
                  isActive ? "border-primary/30 ring-2 ring-primary/5" : "border-base-200"
                }`}
              >
                <div className="card-body p-6">
                  <div className="flex justify-between items-center border-b border-base-content/5 pb-3 mb-4">
                    <span className="text-xs font-bold text-base-content/55 uppercase tracking-wider">
                      {isActive
                        ? t("questionnaires.objectives_history_active", { from: fromStr })
                        : t("questionnaires.objectives_history_period", { from: fromStr, to: toStr })}
                    </span>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(obj.category)}
                      {isActive && (
                        <span className="badge badge-success text-success-content font-bold">
                          Activo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/50 mb-1">
                        {t("questionnaires.objectives_form_summary")}
                      </h3>
                      <p className="text-sm text-base-content/85 font-medium whitespace-pre-wrap">
                        {obj.summary}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/50 mb-2">
                        {t("questionnaires.objectives_form_items")}
                      </h3>
                      <ul className="list-decimal list-inside text-xs text-base-content/75 space-y-1.5 pl-1">
                        {obj.items.map((item: string, idx: number) => (
                          <li key={idx} className="font-medium">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
