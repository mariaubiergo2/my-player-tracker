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
import {
  getTrainerPlayersObjectivesData,
  defineObjectives,
} from "@/actions/objectives";
import {
  createObjectivesRequest,
  createObjectivesRequestForAllTrainers,
  getObjectivesRequestsForPlayer,
  getObjectivesRequestsForTrainer,
  replyToObjectivesRequest,
  getPlayerTrainers,
} from "@/actions/objectivesRequests";
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
  const [trainerTab, setTrainerTab] = useState<"templates" | "answers" | "objectives" | "requests">("templates");
  const [trainerPlayersObjectives, setTrainerPlayersObjectives] = useState<any[]>([]);

  // Objectives Modal States
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [items, setItems] = useState<string[]>([""]);
  const [isSavingObjectives, setIsSavingObjectives] = useState(false);

  // Trainer Answers Filtering & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [templateFilter, setTemplateFilter] = useState<string>("ALL");
  const [answersSort, setAnswersSort] = useState<string>("date_desc");

  const [playerPending, setPlayerPending] = useState<PlayerAssignment[]>([]);
  const [playerCompleted, setPlayerCompleted] = useState<PlayerAssignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "requests">("pending");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ObjectivesRequest States
  const [trainerRequests, setTrainerRequests] = useState<any[]>([]);
  const [playerRequests, setPlayerRequests] = useState<any[]>([]);
  const [playerTrainers, setPlayerTrainers] = useState<any[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const isTrainer = user?.role === "TRAINER";
  const isPlayer = user?.role === "PLAYER" || user?.role === "GOAL_KEEPER";
  const isAdmin = user?.role === "ADMIN";

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isTrainer || isAdmin) {
        const [templatesRes, objRes, requestsRes] = await Promise.all([
          getQuestionnairesByTrainer(user.id),
          getTrainerPlayersObjectivesData(),
          getObjectivesRequestsForTrainer(),
        ]);

        if (templatesRes.success && templatesRes.questionnaires) {
          setTrainerTemplates(templatesRes.questionnaires as unknown as TrainerQuestionnaire[]);
          if (templatesRes.assignments) {
            setTrainerAssignments(templatesRes.assignments);
          }
        }

        if (objRes.success && objRes.players) {
          setTrainerPlayersObjectives(objRes.players);
        }

        if (requestsRes.success && requestsRes.data) {
          setTrainerRequests(requestsRes.data);
        }
      }
      if (isPlayer) {
        const [res, requestsRes, trainersRes] = await Promise.all([
          getAssignmentsByPlayer(user.id),
          getObjectivesRequestsForPlayer(user.id),
          getPlayerTrainers(user.id),
        ]);
        if (res.success && res.pending && res.completed) {
          setPlayerPending(res.pending as unknown as PlayerAssignment[]);
          setPlayerCompleted(res.completed as unknown as PlayerAssignment[]);
        }
        if (requestsRes.success && requestsRes.data) {
          setPlayerRequests(requestsRes.data);
        }
        if (trainersRes.success && trainersRes.trainers) {
          setPlayerTrainers(trainersRes.trainers);
        }
      }
    } catch (error) {
      console.error("Error loading questionnaires data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "requests") {
        if (isTrainer || isAdmin) {
          setTrainerTab("requests");
        } else if (isPlayer) {
          setActiveTab("requests");
        }
      }
    }
  }, [user, isTrainer, isPlayer, isAdmin]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        fetchData();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, ""]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, val: string) => {
    setItems((prev) => {
      const clone = [...prev];
      clone[index] = val;
      return clone;
    });
  };

  const handleOpenModal = (player: any) => {
    setSelectedPlayer(player);
    const activeObj = player.playerObjectivesReceived?.[0];
    if (activeObj) {
      setSummary(activeObj.summary);
      setItems(activeObj.items.length > 0 ? activeObj.items : [""]);
    } else {
      setSummary("");
      setItems([""]);
    }
    setIsModalOpen(true);
  };

  const handleSaveObjectives = async () => {
    if (!selectedPlayer) return;
    if (!summary.trim()) {
      showError("Por favor completa el resumen de objetivos.");
      return;
    }
    const clean = items.map((i) => i.trim()).filter(Boolean);
    if (clean.length === 0) {
      showError("Por favor añade al menos un objetivo.");
      return;
    }

    setIsSavingObjectives(true);
    try {
      const res = await defineObjectives(selectedPlayer.id, summary, clean);
      if (res.success) {
        showSuccess(t("questionnaires.objectives_success_save"));
        setIsModalOpen(false);
        setSelectedPlayer(null);
        fetchData();
      } else {
        showError(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      showError(t("common.error"));
    } finally {
      setIsSavingObjectives(false);
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

  const quickReplies = [
    { emoji: "👀", text: t("questionnaires.request_quick_reply_looking") },
    { emoji: "🛠️", text: t("questionnaires.request_quick_reply_working") },
    { emoji: "✅", text: t("questionnaires.request_quick_reply_incoming") },
    { emoji: "📅", text: t("questionnaires.request_quick_reply_next_training") }
  ];

  const handleReplyToRequest = async (requestId: string, replyText: string) => {
    try {
      const res = await replyToObjectivesRequest(requestId, replyText);
      if (res.success) {
        showSuccess(t("common.success"));
        fetchData();
      } else {
        showError(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      showError(t("common.error"));
    }
  };

  const handleSendRequest = async () => {
    if (!requestReason.trim()) {
      showError("Por favor, introduce un motivo para tu solicitud.");
      return;
    }
    if (requestReason.trim().length < 5) {
      showError("El motiu ha de tenir almenys 5 caràcters.");
      return;
    }

    setIsSendingRequest(true);
    try {
      const res = await createObjectivesRequestForAllTrainers(requestReason);

      if (res.success) {
        showSuccess(t("questionnaires.request_objectives_success"));
        setIsRequestModalOpen(false);
        setRequestReason("");
        fetchData();
      } else {
        if (res.error === "no_trainers_assigned") {
          showError(t("questionnaires.request_objectives_no_trainers") || "No tens cap entrenador assignat. No pots sol·licitar objectius.");
        } else {
          showError(res.error || t("common.error"));
        }
      }
    } catch (err) {
      console.error(err);
      showError(t("common.error"));
    } finally {
      setIsSendingRequest(false);
    }
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

          {/* Tabs for templates vs. answers vs. objectives */}
          <div className="tabs tabs-boxed bg-base-200/80 p-0.5 w-full max-w-xl mb-8">
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
            <button
              onClick={() => setTrainerTab("objectives")}
              className={`tab flex-1 font-semibold transition-all ${
                trainerTab === "objectives" ? "tab-active bg-primary text-primary-content" : ""
              }`}
            >
              {t("questionnaires.tab_objectives")} ({trainerPlayersObjectives.length})
            </button>
            <button
              onClick={() => setTrainerTab("requests")}
              className={`tab flex-1 font-semibold transition-all ${
                trainerTab === "requests" ? "tab-active bg-primary text-primary-content" : ""
              }`}
            >
              {t("questionnaires.tab_requests")} ({trainerRequests.length})
            </button>
          </div>

          {trainerTab === "templates" && (
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
          )}

          {trainerTab === "answers" && (
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

          {trainerTab === "objectives" && (
            trainerPlayersObjectives.length === 0 ? (
              <div className="hero bg-base-200 rounded-2xl p-10 text-center shadow-inner border border-base-content/5">
                <div className="max-w-md">
                  <span className="text-5xl">🎯</span>
                  <h3 className="text-2xl font-bold mt-4">{t("questionnaires.no_players_available")}</h3>
                  <p className="py-2 text-base-content/60">No tienes jugadores asignados para definir objetivos.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {trainerPlayersObjectives.map((player) => {
                  const activeObj = player.playerObjectivesReceived?.[0];
                  const completedAssignments = player.playerAssignments || [];
                  const fullName = `${player.name} ${player.surname}`;

                  return (
                    <div key={player.id} className="card bg-base-100 shadow border border-base-200 hover:shadow-md transition-all duration-200">
                      <div className="card-body p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                          
                          {/* Left Column: Player info & active objective */}
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="avatar placeholder">
                                <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 overflow-hidden flex items-center justify-center">
                                  {player.avatarUrl ? (
                                    <img src={player.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-lg font-semibold">{fullName.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-base-content">{fullName}</h3>
                                <p className="text-xs text-base-content/50">Jugador asignado</p>
                              </div>
                            </div>

                            {/* Active Objective Summary */}
                            <div className="bg-base-200/40 p-4 rounded-2xl border border-base-content/5">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-base-content/50 mb-2">
                                {t("questionnaires.objectives_title")}
                              </h4>
                              {activeObj ? (
                                <div className="space-y-3">
                                  <p className="text-sm font-medium text-base-content/80">{activeObj.summary}</p>
                                  <ul className="list-disc list-inside text-xs text-base-content/70 space-y-1 pl-1">
                                    {activeObj.items.map((item: string, idx: number) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                  <div className="text-[10px] text-base-content/40 mt-1">
                                    {t("questionnaires.objectives_history_active", {
                                      from: new Date(activeObj.effectiveFrom).toLocaleDateString(locale)
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs italic text-base-content/40">
                                  {t("questionnaires.objectives_no_player_objectives")}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right Column: Completed assignments & Actions */}
                          <div className="w-full md:w-80 shrink-0 flex flex-col justify-between self-stretch gap-4">
                            <div>
                              <h4 className="font-bold text-xs uppercase tracking-wider text-base-content/50 mb-2">
                                Cuestionarios Respondidos
                              </h4>
                              {completedAssignments.length === 0 ? (
                                <p className="text-xs italic text-base-content/45">No hay respuestas completadas.</p>
                              ) : (
                                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                  {completedAssignments.map((assign: any) => (
                                    <div key={assign.id} className="flex items-center justify-between text-xs p-2 bg-base-200/30 rounded-xl border border-base-content/5">
                                      <span className="font-medium truncate flex-1 mr-2" title={assign.questionnaire.title}>
                                        {assign.questionnaire.title}
                                      </span>
                                      <Link href={`/questionnaires/assignments/${assign.id}`} className="btn btn-xs btn-ghost text-primary shrink-0">
                                        {t("questionnaires.view_answers")}
                                      </Link>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-4 border-t border-base-content/5 mt-auto">
                              <button
                                onClick={() => handleOpenModal(player)}
                                className="btn btn-primary btn-sm flex-1"
                              >
                                🎯 {activeObj ? t("questionnaires.redefine_objectives_btn") : t("questionnaires.define_objectives_btn")}
                              </button>
                              <Link
                                href={`/questionnaires/objectives/${player.id}`}
                                className="btn btn-outline btn-sm flex-1 text-xs"
                              >
                                📖 {t("questionnaires.objectives_history_btn")}
                              </Link>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Modal for defining objectives */}
          {isModalOpen && selectedPlayer && (
            <div className="modal modal-open">
              <div className="modal-box max-w-lg rounded-3xl border border-base-200">
                <h3 className="font-bold text-2xl mb-4 text-primary">
                  {selectedPlayer.playerObjectivesReceived && selectedPlayer.playerObjectivesReceived.length > 0
                    ? t("questionnaires.redefine_objectives_btn")
                    : t("questionnaires.define_objectives_btn")}
                </h3>
                <p className="text-sm text-base-content/60 mb-6">
                  Jugador: <strong>{selectedPlayer.name} {selectedPlayer.surname}</strong>
                </p>

                <div className="form-control mb-4">
                  <label className="label font-semibold">{t("questionnaires.objectives_form_summary")}</label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder={t("questionnaires.objectives_form_summary_placeholder")}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>

                <div className="form-control mb-6">
                  <label className="label font-semibold">{t("questionnaires.objectives_form_items")}</label>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          className="input input-bordered flex-1"
                          placeholder={t("questionnaires.objectives_form_item_placeholder")}
                          value={item}
                          onChange={(e) => handleUpdateItem(idx, e.target.value)}
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="btn btn-error btn-outline"
                          >
                            {t("questionnaires.objectives_form_remove_item")}
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn btn-neutral btn-sm mt-2"
                    >
                      + {t("questionnaires.objectives_form_add_item")}
                    </button>
                  </div>
                </div>

                <div className="modal-action">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedPlayer(null);
                    }}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveObjectives}
                    disabled={isSavingObjectives}
                  >
                    {isSavingObjectives ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      t("questionnaires.objectives_form_save")
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {trainerTab === "requests" && (
            trainerRequests.length === 0 ? (
              <div className="hero bg-base-200 rounded-2xl p-10 text-center shadow-inner border border-base-content/5">
                <div className="max-w-md">
                  <span className="text-5xl">📨</span>
                  <h3 className="text-2xl font-bold mt-4">
                    {t("questionnaires.requests_empty_trainer")}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {trainerRequests.map((request) => {
                  const fullName = `${request.player.name} ${request.player.surname}`;
                  return (
                    <div
                      key={request.id}
                      className="card bg-base-100 shadow border border-base-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="card-body p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                          {/* Player info & Request Details */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="avatar placeholder">
                                <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 overflow-hidden flex items-center justify-center">
                                  {request.player.avatarUrl ? (
                                    <img src={request.player.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-semibold">{fullName.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h3 className="font-bold text-base text-base-content">{fullName}</h3>
                                <p className="text-[11px] text-base-content/50">
                                  {formatRelativeTime(request.createdAt, locale)}
                                </p>
                              </div>
                              <div className="ml-auto md:ml-0">
                                {request.status === "PENDING" && (
                                  <span className="badge badge-warning text-white font-semibold text-xs">
                                    {t("questionnaires.request_status_pending")}
                                  </span>
                                )}
                                {request.status === "ACKNOWLEDGED" && (
                                  <span className="badge badge-info text-white font-semibold text-xs">
                                    {t("questionnaires.request_status_acknowledged")}
                                  </span>
                                )}
                                {request.status === "RESOLVED" && (
                                  <span className="badge badge-success text-white font-semibold text-xs">
                                    {t("questionnaires.request_status_resolved")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="bg-base-200/50 p-4 rounded-xl border border-base-content/5">
                              <p className="text-sm font-medium text-base-content/80 italic">
                                &ldquo;{request.reason}&rdquo;
                              </p>
                            </div>
                            
                            {/* Reply info */}
                            {request.status !== "PENDING" && request.trainerReply && (
                              <div className="flex items-start gap-2 text-xs bg-primary/5 p-3 rounded-xl border border-primary/10">
                                <span className="text-base">💬</span>
                                <div>
                                  <p className="font-bold text-primary">El teu missatge:</p>
                                  <p className="text-base-content/85 mt-0.5 font-medium">{request.trainerReply}</p>
                                  {request.repliedAt && (
                                    <p className="text-[10px] text-base-content/40 mt-1">
                                      Respost el {new Date(request.repliedAt).toLocaleDateString(locale)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Quick replies or Actions */}
                          <div className="w-full md:w-80 shrink-0 flex flex-col justify-between self-stretch gap-4 border-t md:border-t-0 md:border-l border-base-200/80 pt-4 md:pt-0 md:pl-6">
                            <div>
                              {request.status !== "RESOLVED" ? (
                                <>
                                  <h4 className="font-bold text-xs uppercase tracking-wider text-base-content/50 mb-3">
                                    {t("questionnaires.request_reply_placeholder_hint")}
                                  </h4>
                                  <div className="grid grid-cols-1 gap-2">
                                    {quickReplies.map((qr, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => handleReplyToRequest(request.id, `${qr.emoji} ${qr.text}`)}
                                        className="btn btn-outline btn-xs justify-start hover:scale-[1.02] active:scale-95 transition-all py-1.5 h-auto text-left font-medium"
                                      >
                                        <span className="mr-1.5">{qr.emoji}</span>
                                        <span className="truncate">{qr.text}</span>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs text-base-content/50 py-2 italic">
                                  Sol·licitud gestionada.
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleOpenModal(request.player)}
                              className="btn btn-primary btn-sm w-full mt-auto"
                            >
                              🎯 {t("questionnaires.define_objectives_from_request")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* PLAYER VIEW */}
      {isPlayer && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t("questionnaires.player_title")}
              </h1>
              <p className="text-base-content/70 mt-2">
                {t("notifications.bell_tooltip")}
              </p>
            </div>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="btn btn-outline btn-primary shadow-md hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
            >
              🎯 {t("questionnaires.request_objectives_btn")}
            </button>
          </div>

          {/* Pending / Completed / Requests Tabs */}
          <div className="tabs tabs-boxed bg-base-200/80 p-0.5 w-full max-w-lg mb-8">
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
            <button
              onClick={() => setActiveTab("requests")}
              className={`tab flex-1 font-semibold transition-all ${
                activeTab === "requests" ? "tab-active bg-primary text-primary-content" : ""
              }`}
            >
              {t("questionnaires.tab_requests")} ({playerRequests.length})
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
          ) : activeTab === "completed" ? (
            playerCompleted.length === 0 ? (
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
            )
          ) : (
            playerRequests.length === 0 ? (
              <div className="hero bg-base-200 rounded-2xl p-10 text-center shadow-inner border border-base-content/5">
                <div className="max-w-md">
                  <span className="text-5xl">🎯</span>
                  <h3 className="text-2xl font-bold mt-4">
                    {t("questionnaires.requests_empty_player")}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {playerRequests.map((request) => {
                  const trainerName = `${request.trainer.name} ${request.trainer.surname}`;
                  return (
                    <div
                      key={request.id}
                      className="card bg-base-100 shadow border border-base-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="card-body p-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h2 className="text-lg font-bold text-base-content leading-tight">
                                Sol·licitud per a {trainerName}
                              </h2>
                              {request.status === "PENDING" && (
                                <span className="badge badge-warning text-white font-semibold text-xs">
                                  {t("questionnaires.request_status_pending")}
                                </span>
                              )}
                              {request.status === "ACKNOWLEDGED" && (
                                <span className="badge badge-info text-white font-semibold text-xs">
                                  {t("questionnaires.request_status_acknowledged")}
                                </span>
                              )}
                              {request.status === "RESOLVED" && (
                                <span className="badge badge-success text-white font-semibold text-xs">
                                  {t("questionnaires.request_status_resolved")}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-base-content/50">
                              Enviada el {new Date(request.createdAt).toLocaleDateString(locale)} ({formatRelativeTime(request.createdAt, locale)})
                            </p>
                            
                            <div className="mt-3 p-3 bg-base-200/50 rounded-xl border border-base-content/5 text-sm text-base-content/80 font-medium italic">
                              &ldquo;{request.reason}&rdquo;
                            </div>

                            {request.status !== "PENDING" && request.trainerReply && (
                              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mt-4 flex items-start gap-3">
                                <div className="avatar placeholder flex-shrink-0">
                                  <div className="bg-primary text-primary-content rounded-full w-8 h-8 overflow-hidden flex items-center justify-center font-bold text-sm">
                                    {request.trainer.avatarUrl ? (
                                      <img src={request.trainer.avatarUrl} alt="Trainer" className="w-full h-full object-cover" />
                                    ) : (
                                      request.trainer.name.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-primary">{trainerName}</p>
                                  <p className="text-sm font-semibold text-base-content/95 mt-0.5 break-words">&ldquo;{request.trainerReply}&rdquo;</p>
                                  {request.repliedAt && (
                                    <p className="text-[10px] text-base-content/40 mt-1">
                                      Respost el {new Date(request.repliedAt).toLocaleDateString(locale)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Modal for Player Request Objectives */}
          {isRequestModalOpen && (
            <div className="modal modal-open">
              <div className="modal-box max-w-lg rounded-3xl border border-base-200">
                <h3 className="font-bold text-2xl mb-4 text-primary">
                  {t("questionnaires.request_objectives_modal_title")}
                </h3>
                
                <div className="form-control mb-6">
                  <label className="label font-semibold">
                    {t("questionnaires.request_objectives_reason_label")}
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-28"
                    placeholder={t("questionnaires.request_objectives_reason_placeholder")}
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                  />
                </div>

                <div className="modal-action">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setIsRequestModalOpen(false);
                      setRequestReason("");
                    }}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSendRequest}
                    disabled={isSendingRequest}
                  >
                    {isSendingRequest ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      t("questionnaires.request_objectives_send")
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
