"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import {
  getQuestionnairesByTrainer,
  getAssignmentsByPlayer,
  deleteQuestionnaire,
  duplicateQuestionnaire,
} from "@/actions/questionnaires";
import { formatRelativeTime } from "@/lib/utils/dates";

interface TrainerQuestionnaire {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "DEFINED" | "SEND";
  createdAt: Date | string;
  counts: {
    sent: number;
    reclaimed: number;
    completed: number;
  };
}

interface PlayerAssignment {
  id: string;
  status: "SENT" | "RECLAIMED" | "COMPLETED";
  sentAt: Date | string;
  questionnaire: {
    id: string;
    title: string;
    description: string | null;
    trainer: {
      id: string;
      name: string;
      surname: string;
    };
  };
}

export default function QuestionnairesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const [trainerTemplates, setTrainerTemplates] = useState<TrainerQuestionnaire[]>([]);
  const [trainerAssignments, setTrainerAssignments] = useState<any[]>([]);
  const [trainerTab, setTrainerTab] = useState<"templates" | "answers">("templates");
  
  // Trainer Answers Filtering & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [templateFilter, setTemplateFilter] = useState<string>("ALL");
  const [answersSort, setAnswersSort] = useState<string>("date_desc");

  const [playerPending, setPlayerPending] = useState<PlayerAssignment[]>([]);
  const [playerCompleted, setPlayerCompleted] = useState<PlayerAssignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isTrainer = user?.role === "TRAINER";
  const isPlayer = user?.role === "PLAYER" || user?.role === "GOAL_KEEPER";
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        fetchData();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isTrainer || isAdmin) {
        const res = await getQuestionnairesByTrainer(user.id);
        if (res.success && res.questionnaires) {
          setTrainerTemplates(res.questionnaires as unknown as TrainerQuestionnaire[]);
          if (res.assignments) {
            setTrainerAssignments(res.assignments);
          }
        }
      }
      if (isPlayer) {
        const res = await getAssignmentsByPlayer(user.id);
        if (res.success && res.pending && res.completed) {
          setPlayerPending(res.pending as unknown as PlayerAssignment[]);
          setPlayerCompleted(res.completed as unknown as PlayerAssignment[]);
        }
      }
    } catch (error) {
      console.error("Error loading questionnaires data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Compute filtered & sorted assignments for Trainer Answers tab
  const filteredTrainerAssignments = trainerAssignments
    .filter((assignment) => {
      const pName = `${assignment.player.name} ${assignment.player.surname}`.toLowerCase();
      const qTitle = assignment.questionnaire.title.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = pName.includes(query) || qTitle.includes(query);
      const matchesStatus = statusFilter === "ALL" || assignment.status === statusFilter;
      const matchesTemplate = templateFilter === "ALL" || assignment.questionnaireId === templateFilter;
      return matchesSearch && matchesStatus && matchesTemplate;
    })
    .sort((a, b) => {
      if (answersSort === "date_desc") {
        return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
      }
      if (answersSort === "date_asc") {
        return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
      }
      if (answersSort === "player_asc") {
        const nameA = `${a.player.name} ${a.player.surname}`.toLowerCase();
        const nameB = `${b.player.name} ${b.player.surname}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (answersSort === "title_asc") {
        const titleA = a.questionnaire.title.toLowerCase();
        const titleB = b.questionnaire.title.toLowerCase();
        return titleA.localeCompare(titleB);
      }
      return 0;
    });

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage("");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage("");
    setTimeout(() => setErrorMessage(""), 5000);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(t("questionnaires.delete_confirm"))) return;

    startTransition(async () => {
      const res = await deleteQuestionnaire(id);
      if (res.success) {
        showSuccess(t("common.success"));
        fetchData();
      } else {
        showError(res.error ? t(`questionnaires.${res.error}`) || res.error : t("common.error"));
      }
    });
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const res = await duplicateQuestionnaire(id);
      if (res.success && res.data) {
        showSuccess(t("questionnaires.duplicate_success"));
        fetchData();
      } else {
        showError(res.error ? t(`questionnaires.${res.error}`) || res.error : t("common.error"));
      }
    });
  };

  const getTemplateStatusBadge = (status: "DRAFT" | "DEFINED" | "SEND") => {
    switch (status) {
      case "DRAFT":
        return <span className="badge badge-neutral font-semibold">{t("questionnaires.status_draft")}</span>;
      case "DEFINED":
        return <span className="badge badge-info font-semibold text-white">{t("questionnaires.status_defined")}</span>;
      case "SEND":
        return <span className="badge badge-success font-semibold text-white">{t("questionnaires.status_send")}</span>;
      default:
        return null;
    }
  };

  const getAssignmentStatusBadge = (status: "SENT" | "RECLAIMED" | "COMPLETED") => {
    switch (status) {
      case "SENT":
        return <span className="badge badge-info text-white font-semibold">{t("questionnaires.status_sent")}</span>;
      case "RECLAIMED":
        return <span className="badge badge-warning text-white font-semibold">{t("questionnaires.status_reclaimed")}</span>;
      case "COMPLETED":
        return <span className="badge badge-success text-white font-semibold">{t("questionnaires.status_completed")}</span>;
      default:
        return null;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <PageContainer className="py-10" maxWidthClassName="max-w-5xl">
      {/* Alert banners */}
      {successMessage && (
        <div className="alert alert-success shadow-lg mb-6 border border-success/20 animate-fade-in">
          <div><span>✅ {successMessage}</span></div>
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-error shadow-lg mb-6 border border-error/20 animate-fade-in">
          <div><span>❌ {errorMessage}</span></div>
        </div>
      )}

      {/* TRAINER VIEW */}
      {(isTrainer || isAdmin) && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t("questionnaires.trainer_title")}
              </h1>
              <p className="text-base-content/70 mt-2">
                {t("questionnaires.create_subtitle")}
              </p>
            </div>
            <Link
              href="/questionnaires/create"
              className="btn btn-primary shadow-md hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
            >
              + {t("questionnaires.create_new")}
            </Link>
          </div>

          {/* Tabs for templates vs. answers */}
          <div className="tabs tabs-boxed bg-base-200/80 p-0.5 w-full max-w-md mb-8">
            <button
              onClick={() => setTrainerTab("templates")}
              className={`tab flex-1 font-semibold transition-all ${
                trainerTab === "templates" ? "tab-active bg-primary text-primary-content" : ""
              }`}
            >
              Plantillas ({trainerTemplates.length})
            </button>
            <button
              onClick={() => setTrainerTab("answers")}
              className={`tab flex-1 font-semibold transition-all ${
                trainerTab === "answers" ? "tab-active bg-primary text-primary-content" : ""
              }`}
            >
              Respuestas ({trainerAssignments.length})
            </button>
          </div>

          {trainerTab === "templates" ? (
            trainerTemplates.length === 0 ? (
              <div className="hero bg-base-200 rounded-2xl p-10 text-center shadow-inner border border-base-content/5">
                <div className="max-w-md">
                  <span className="text-5xl">📋</span>
                  <h3 className="text-2xl font-bold mt-4">{t("questionnaires.no_questionnaires")}</h3>
                  <p className="py-2 text-base-content/60">{t("questionnaires.create_subtitle")}</p>
                  <Link href="/questionnaires/create" className="btn btn-primary mt-4">
                    {t("questionnaires.create_new")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {trainerTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="card bg-base-100 shadow-lg border border-base-200 hover:shadow-xl hover:border-base-300 transition-all duration-200"
                  >
                    <div className="card-body p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h2 className="card-title text-xl font-bold text-base-content leading-tight hover:text-primary transition-colors">
                            <Link href={`/questionnaires/${template.id}`}>
                              {template.title}
                            </Link>
                          </h2>
                          {getTemplateStatusBadge(template.status)}
                        </div>
                        <p className="text-sm text-base-content/70 line-clamp-2 min-h-[2.5rem]">
                          {template.description || <span className="italic opacity-60">{t("common.no_description")}</span>}
                        </p>
                      </div>

                      <div className="border-t border-base-200 mt-4 pt-4">
                        {/* Metric assignment stats */}
                        <div className="flex flex-wrap gap-4 text-xs font-medium text-base-content/60 mb-4">
                          <div>
                            <span className="font-bold text-base-content">{template.counts.sent + template.counts.reclaimed}</span>{" "}
                            {t("questionnaires.pending")}
                          </div>
                          <div>
                            <span className="font-bold text-base-content">{template.counts.completed}</span>{" "}
                            {t("questionnaires.completed")}
                          </div>
                          <div className="ml-auto text-[11px]">
                            {t("questionnaires.created_at")}: {new Date(template.createdAt).toLocaleDateString(locale)}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <Link href={`/questionnaires/${template.id}`} className="btn btn-ghost btn-sm text-primary">
                            {t("common.edit")} / {t("questionnaires.actions")}
                          </Link>

                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleDuplicate(template.id, e)}
                              className="btn btn-ghost btn-sm"
                              disabled={isPending}
                              title={t("questionnaires.duplicate")}
                            >
                              👥 {t("questionnaires.duplicate")}
                            </button>

                            {(template.status === "DRAFT" || template.status === "DEFINED") && (
                              <button
                                onClick={(e) => handleDelete(template.id, e)}
                                className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                                disabled={isPending}
                                title={t("common.delete")}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            trainerAssignments.length === 0 ? (
              <div className="hero bg-base-200 rounded-2xl p-10 text-center shadow-inner border border-base-content/5">
                <div className="max-w-md">
                  <span className="text-5xl">📨</span>
                  <h3 className="text-2xl font-bold mt-4">Sin envíos</h3>
                  <p className="py-2 text-base-content/60">No has enviado ningún cuestionario a tus jugadores todavía.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Filter and Sort selectors */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-base-200/40 p-4 rounded-xl border border-base-200/60 mb-6">
                  {/* Search Bar */}
                  <div className="form-control w-full md:w-80">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar por jugador o cuestionario..."
                        className="input input-bordered input-sm w-full pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <span className="absolute left-3 top-2.5 text-base-content/50 text-xs">🔍</span>
                    </div>
                  </div>

                  {/* selectors */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
                    {/* Status filter */}
                    <div className="form-control w-full sm:w-44">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="select select-bordered select-sm w-full font-medium"
                      >
                        <option value="ALL">Todos los estados</option>
                        <option value="SENT">Enviado</option>
                        <option value="RECLAIMED">Reclamado</option>
                        <option value="COMPLETED">Respondido</option>
                      </select>
                    </div>

                    {/* Template filter */}
                    <div className="form-control w-full sm:w-48">
                      <select
                        value={templateFilter}
                        onChange={(e) => setTemplateFilter(e.target.value)}
                        className="select select-bordered select-sm w-full font-medium"
                      >
                        <option value="ALL">Todos los cuestionarios</option>
                        {trainerTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Order Selector */}
                    <div className="form-control w-full sm:w-48">
                      <select
                        value={answersSort}
                        onChange={(e) => setAnswersSort(e.target.value)}
                        className="select select-bordered select-sm w-full font-medium"
                      >
                        <option value="date_desc">Fecha envío: Reciente</option>
                        <option value="date_asc">Fecha envío: Antiguo</option>
                        <option value="player_asc">Jugador: A-Z</option>
                        <option value="title_asc">Cuestionario: A-Z</option>
                      </select>
                    </div>
                  </div>
                </div>

                {filteredTrainerAssignments.length === 0 ? (
                  <div className="card bg-base-100 shadow border border-base-200 py-12 px-4 text-center">
                    <span className="text-4xl mb-2 opacity-50">🔍</span>
                    <h4 className="text-base font-semibold text-base-content/70">No se encontraron respuestas</h4>
                    <p className="text-xs text-base-content/50 mt-1">Prueba a ajustar tus criterios de búsqueda o filtros.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTrainerAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="card bg-base-100 shadow border border-base-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="card-body p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h2 className="text-lg font-bold text-base-content leading-tight hover:text-primary transition-colors">
                                <Link href={`/questionnaires/assignments/${assignment.id}`}>
                                  {assignment.questionnaire.title}
                                </Link>
                              </h2>
                              {getAssignmentStatusBadge(assignment.status)}
                            </div>
                            <div className="text-xs text-base-content/70 mt-2 space-y-1">
                              <p>
                                <strong>Jugador:</strong> {assignment.player.name} {assignment.player.surname}
                              </p>
                              <p className="text-base-content/50">
                                Enviado el {new Date(assignment.sentAt).toLocaleDateString(locale)}
                                {assignment.status === "COMPLETED" && assignment.respondedAt && (
                                  <span className="text-success ml-2">
                                    &middot; Respondido el {new Date(assignment.respondedAt).toLocaleDateString(locale)}
                                  </span>
                                )}
                                {assignment.status === "RECLAIMED" && assignment.reclaimedAt && (
                                  <span className="text-warning ml-2">
                                    &middot; Reclamado el {new Date(assignment.reclaimedAt).toLocaleDateString(locale)}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/questionnaires/assignments/${assignment.id}`}
                            className="btn btn-outline btn-sm shrink-0 self-end sm:self-auto"
                          >
                            {assignment.status === "COMPLETED" ? "Ver Respuestas" : "Ver Estado"}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* PLAYER VIEW */}
      {isPlayer && (
        <div>
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("questionnaires.player_title")}
            </h1>
            <p className="text-base-content/70 mt-2">
              {t("notifications.bell_tooltip")}
            </p>
          </div>

          {/* Pending / Completed Tabs */}
          <div className="tabs tabs-boxed bg-base-200/80 p-0.5 w-full max-w-md mb-8">
            <button
              onClick={() => setActiveTab("pending")}
              className={`tab flex-1 font-semibold transition-all ${
                activeTab === "pending" ? "tab-active bg-primary text-primary-content" : ""
              }`}
            >
              {t("questionnaires.pending")} ({playerPending.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`tab flex-1 font-semibold transition-all ${
                activeTab === "completed" ? "tab-active bg-primary text-primary-content" : ""
              }`}
            >
              {t("questionnaires.completed")} ({playerCompleted.length})
            </button>
          </div>

          {activeTab === "pending" ? (
            playerPending.length === 0 ? (
              <div className="hero bg-base-200 rounded-2xl p-10 text-center shadow-inner border border-base-content/5">
                <div className="max-w-md">
                  <span className="text-5xl">🎉</span>
                  <h3 className="text-2xl font-bold mt-4">{t("questionnaires.no_assignments")}</h3>
                  <p className="py-2 text-base-content/60">{t("questionnaires.no_assignments")}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {playerPending.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="card bg-base-100 shadow border border-base-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="card-body p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h2 className="text-lg font-bold text-base-content leading-tight truncate">
                            {assignment.questionnaire.title}
                          </h2>
                          {getAssignmentStatusBadge(assignment.status)}
                        </div>
                        <p className="text-sm text-base-content/75 line-clamp-1">
                          {assignment.questionnaire.description || <span className="italic opacity-60">{t("common.no_description")}</span>}
                        </p>
                        <span className="text-xs text-base-content/50 mt-1 block">
                          {t("questionnaires.sent_at")}: {formatRelativeTime(assignment.sentAt, locale)} &middot; {t("questionnaires.player")}: {assignment.questionnaire.trainer.name} {assignment.questionnaire.trainer.surname}
                        </span>
                      </div>
                      <Link
                        href={`/questionnaires/assignments/${assignment.id}`}
                        className="btn btn-primary btn-sm shrink-0 self-end sm:self-auto"
                      >
                        {t("questionnaires.send")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : playerCompleted.length === 0 ? (
            <div className="hero bg-base-200 rounded-2xl p-10 text-center shadow-inner border border-base-content/5">
              <div className="max-w-md">
                <span className="text-5xl">📋</span>
                <h3 className="text-2xl font-bold mt-4">{t("questionnaires.no_assignments")}</h3>
                <p className="py-2 text-base-content/60">{t("questionnaires.no_assignments")}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {playerCompleted.map((assignment) => (
                <div
                  key={assignment.id}
                  className="card bg-base-100 shadow border border-base-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="card-body p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-lg font-bold text-base-content leading-tight truncate">
                          {assignment.questionnaire.title}
                        </h2>
                        {getAssignmentStatusBadge(assignment.status)}
                      </div>
                      <p className="text-sm text-base-content/75 line-clamp-1">
                        {assignment.questionnaire.description || <span className="italic opacity-60">{t("common.no_description")}</span>}
                      </p>
                      <span className="text-xs text-base-content/50 mt-1 block">
                        {t("questionnaires.sent_at")}: {formatRelativeTime(assignment.sentAt, locale)} &middot; {t("questionnaires.player")}: {assignment.questionnaire.trainer.name} {assignment.questionnaire.trainer.surname}
                      </span>
                    </div>
                    <Link
                      href={`/questionnaires/assignments/${assignment.id}`}
                      className="btn btn-outline btn-sm shrink-0 self-end sm:self-auto"
                    >
                      {t("questionnaires.view_answers")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
