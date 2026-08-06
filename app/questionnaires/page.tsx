"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import {
  getQuestionnairesByTrainer,
  getAssignmentsByPlayer,
  deleteQuestionnaire,
  duplicateQuestionnaire,
} from "@/actions/questionnaires";

export default function QuestionnairesListPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        fetchList();
      }
    }
  }, [isLoading, isAuthenticated, user]);

  const fetchList = async () => {
    setLoadingList(true);
    setErrorMessage("");
    try {
      if (user?.role === "TRAINER") {
        const res = await getQuestionnairesByTrainer(user.id);
        if (res.success && res.questionnaires) {
          setQuestionnaires(res.questionnaires);
        } else {
          setErrorMessage(res.error || t("common.error"));
        }
      } else {
        const res = await getAssignmentsByPlayer(user?.id || "");
        if (res.success && res.assignments) {
          setAssignments(res.assignments);
        } else {
          setErrorMessage(res.error || t("common.error"));
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t("common.error"));
    } finally {
      setLoadingList(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t("questionnaires.delete_confirm"))) return;

    startTransition(async () => {
      try {
        const res = await deleteQuestionnaire(id);
        if (res.success) {
          setSuccessMessage(t("common.success"));
          setQuestionnaires((prev) => prev.filter((q) => q.id !== id));
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          setErrorMessage(res.error || t("common.error"));
        }
      } catch (err) {
        console.error(err);
        setErrorMessage(t("common.error"));
      }
    });
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      try {
        const res = await duplicateQuestionnaire(id);
        if (res.success && res.data) {
          setSuccessMessage(t("questionnaires.duplicate_success"));
          fetchList();
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          setErrorMessage(res.error || t("common.error"));
        }
      } catch (err) {
        console.error(err);
        setErrorMessage(t("common.error"));
      }
    });
  };

  if (isLoading || loadingList) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/60 font-medium">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isTrainer = user.role === "TRAINER";

  // Filters for Trainer templates
  const filteredTemplates = questionnaires.filter((q) => {
    if (statusFilter === "ALL") return true;
    return q.status === statusFilter;
  });

  // Filters for Player assignments
  const filteredAssignments = assignments.filter((a) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING") return a.status === "SENT" || a.status === "RECLAIMED";
    if (statusFilter === "COMPLETED") return a.status === "COMPLETED";
    return true;
  });

  const getTemplateStatusBadge = (status: string) => {
    if (status === "DRAFT") {
      return <span className="badge badge-neutral font-semibold">{t("questionnaires.status_draft")}</span>;
    }
    return <span className="badge badge-primary font-semibold">{t("questionnaires.status_defined")}</span>;
  };

  const getAssignmentStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return <span className="badge badge-info font-semibold">{t("questionnaires.status_sent")}</span>;
      case "RECLAIMED":
        return <span className="badge badge-warning font-semibold text-warning-content">{t("questionnaires.status_reclaimed")}</span>;
      case "COMPLETED":
        return <span className="badge badge-success font-semibold text-success-content">{t("questionnaires.status_completed")}</span>;
      default:
        return null;
    }
  };

  return (
    <PageContainer className="py-10 animate-fade-in">
      {errorMessage && (
        <div className="alert alert-error shadow-lg mb-6 border border-error/20">
          <span>❌ {errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success shadow-lg mb-6 border border-success/20">
          <span>✅ {successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isTrainer ? t("questionnaires.trainer_title") : t("questionnaires.player_title")}
          </h1>
          <p className="text-base-content/70 mt-2">
            {isTrainer
              ? "Crea plantillas reutilizables de cuestionarios y envíalas a tus jugadores."
              : "Revisa y responde los cuestionarios que te han sido asignados por tu entrenador."}
          </p>
        </div>

        {isTrainer && (
          <Link href="/questionnaires/create" className="btn btn-primary shadow-md hover:scale-105 active:scale-95 transition-all">
            + {t("questionnaires.create_new")}
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`btn btn-sm ${statusFilter === "ALL" ? "btn-primary" : "btn-outline btn-neutral"}`}
        >
          {t("notifications.filter_all")}
        </button>
        {isTrainer ? (
          <>
            <button
              onClick={() => setStatusFilter("DRAFT")}
              className={`btn btn-sm ${statusFilter === "DRAFT" ? "btn-primary" : "btn-outline btn-neutral"}`}
            >
              {t("questionnaires.drafts")}
            </button>
            <button
              onClick={() => setStatusFilter("DEFINED")}
              className={`btn btn-sm ${statusFilter === "DEFINED" ? "btn-primary" : "btn-outline btn-neutral"}`}
            >
              {t("questionnaires.defined_templates")}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`btn btn-sm ${statusFilter === "PENDING" ? "btn-primary" : "btn-outline btn-neutral"}`}
            >
              {t("questionnaires.pending")}
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`btn btn-sm ${statusFilter === "COMPLETED" ? "btn-primary" : "btn-outline btn-neutral"}`}
            >
              {t("questionnaires.completed")}
            </button>
          </>
        )}
      </div>

      {/* Trainer view */}
      {isTrainer ? (
        filteredTemplates.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 py-16 px-4 text-center shadow-inner rounded-3xl">
            <div className="text-6xl mb-4 opacity-40">📋</div>
            <h2 className="text-xl font-bold text-base-content/85">
              {t("questionnaires.no_questionnaires")}
            </h2>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((q) => (
              <Link
                key={q.id}
                href={`/questionnaires/${q.id}`}
                className="card bg-base-100 border border-base-200 shadow hover:shadow-lg transition-all duration-200 group"
              >
                <div className="card-body p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      {getTemplateStatusBadge(q.status)}
                      <span className="text-xs text-base-content/50">
                        {new Date(q.createdAt).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1 mb-1">
                      {q.title}
                    </h3>
                    {q.description && (
                      <p className="text-sm text-base-content/60 line-clamp-2 mb-4">
                        {q.description}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-base-content/5 pt-4 mt-2">
                    <div className="flex justify-between items-center text-xs text-base-content/60">
                      <div>
                        <p>{q.questionCount} {q.questionCount === 1 ? "pregunta" : "preguntas"}</p>
                        <p className="mt-1">
                          {q.activeAssignments} activos &middot; {q.completedAssignments} respondidos
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => handleDuplicate(q.id, e)}
                          disabled={isPending}
                          className="btn btn-xs btn-neutral btn-outline font-bold"
                          title={t("questionnaires.duplicate")}
                        >
                          👯
                        </button>
                        {q.status === "DRAFT" && q.activeAssignments === 0 && q.completedAssignments === 0 && (
                          <button
                            onClick={(e) => handleDelete(q.id, e)}
                            disabled={isPending}
                            className="btn btn-xs btn-error btn-outline font-bold"
                            title={t("common.delete")}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        /* Player view */
        filteredAssignments.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 py-16 px-4 text-center shadow-inner rounded-3xl">
            <div className="text-6xl mb-4 opacity-40">📨</div>
            <h2 className="text-xl font-bold text-base-content/85">
              {t("questionnaires.no_assignments")}
            </h2>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssignments.map((a) => {
              const trainerName = a.questionnaire.trainer
                ? `${a.questionnaire.trainer.name} ${a.questionnaire.trainer.surname}`
                : "";
              const avatarUrl = a.questionnaire.trainer?.avatarUrl;

              return (
                <Link
                  key={a.id}
                  href={`/questionnaires/assignments/${a.id}`}
                  className="card bg-base-100 border border-base-200 shadow hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="card-body p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        {getAssignmentStatusBadge(a.status)}
                        <span className="text-xs text-base-content/50">
                          {new Date(a.sentAt).toLocaleDateString(locale, {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {a.questionnaire.title}
                      </h3>
                      {a.questionnaire.description && (
                        <p className="text-sm text-base-content/60 line-clamp-2 mb-4">
                          {a.questionnaire.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 border-t border-base-content/5 pt-4 mt-2">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 overflow-hidden flex items-center justify-center">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={trainerName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold">
                              {trainerName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold leading-none">{trainerName}</p>
                        <p className="text-[10px] text-base-content/40 mt-1">Entrenador</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </PageContainer>
  );
}
