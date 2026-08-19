"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import { getPlayerActivePlans, toggleSessionCompletion } from "@/actions/training-plans";
import { getActiveObjectives, getObjectivesHistory } from "@/actions/objectives";
import { getAssignmentsByPlayer } from "@/actions/questionnaires";
import { submitTrainingFeedback } from "@/actions/training-feedback";
import { ObjectiveCategory, QuestionnaireType } from "@prisma/client";

interface TrainingSession {
  id: string;
  title: string;
  recurrenceDays: string[];
  startDate: string;
  endDate: string;
  exercises: {
    id: string;
    repetitionsOverride: string | null;
    exercise: {
      id: string;
      title: string;
      description: string | null;
      repetitions: string;
      mediaType: "IMAGE" | "VIDEO_LINK" | null;
      imageUrl: string | null;
      videoUrl: string | null;
    };
  }[];
  completions: {
    id: string;
    scheduledDate: string;
    completedAt: string;
  }[];
  feedback: {
    id: string;
    comment: string | null;
    videoUrl: string | null;
    isReviewed: boolean;
    createdAt: string;
  }[];
}

interface TrainingPlanAssignment {
  id: string;
  sentAt: string;
  trainingPlan: {
    id: string;
    title: string;
    description: string | null;
    trainer: {
      id: string;
      name: string;
      surname: string;
      avatarUrl: string | null;
    };
    sessions: TrainingSession[];
  };
  planFeedback: {
    id: string;
    comment: string | null;
    videoUrl: string | null;
    isReviewed: boolean;
    createdAt: string;
  }[];
}

export default function PhysicalPrepPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const [assignments, setAssignments] = useState<TrainingPlanAssignment[]>([]);
  const [activeObjective, setActiveObjective] = useState<any>(null);
  const [objectivesHistory, setObjectivesHistory] = useState<any[]>([]);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Week offset state for calendar browsing
  const [weekOffset, setWeekOffset] = useState(0);

  // Tabs for the page
  const [activeTab, setActiveTab] = useState<"checklist" | "objectives" | "questionnaires">("checklist");

  // Feedback states
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null);
  const [feedbackAssignmentId, setFeedbackAssignmentId] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackVideoUrl, setFeedbackVideoUrl] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState("");
  const [feedbackErrorMsg, setFeedbackErrorMsg] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role === "ADMIN") {
        router.push("/admin/users");
      } else if (user?.role === "TRAINER") {
        router.push("/trainer/my-players");
      } else {
        fetchData();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [plansRes, activeObjRes, historyObjRes, questRes] = await Promise.all([
        getPlayerActivePlans(user.id),
        getActiveObjectives(user.id, ObjectiveCategory.PHYSICAL),
        getObjectivesHistory(user.id, ObjectiveCategory.PHYSICAL),
        getAssignmentsByPlayer(user.id, QuestionnaireType.PHYSICAL),
      ]);

      if (plansRes.success && plansRes.data) {
        setAssignments(plansRes.data as any[]);
      }
      if (activeObjRes.success && activeObjRes.data) {
        setActiveObjective(activeObjRes.data);
      } else {
        setActiveObjective(null);
      }
      if (historyObjRes.success && historyObjRes.data) {
        setObjectivesHistory(historyObjRes.data.history || []);
      }
      if (questRes.success && questRes.pending) {
        // Show pending questionnaires
        setQuestionnaires(questRes.pending);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Get dates for the selected week offset
  const getWeekDays = () => {
    const current = new Date();
    const day = current.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const distanceToMonday = day === 0 ? -6 : 1 - day; // distance to Monday
    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const days: { date: Date; label: string; key: string }[] = [];
    const dayLabels = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenge"];
    const dayKeys = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        date: d,
        label: dayLabels[i],
        key: dayKeys[i],
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Helper: Calculate occurrences for a session during the current week offset
  const getSessionOccurrences = (assignment: TrainingPlanAssignment, session: TrainingSession) => {
    const occurrences: { date: Date; key: string; label: string; isCompleted: boolean }[] = [];
    const startDate = new Date(session.startDate);
    const endDate = new Date(session.endDate);

    // Normalize start/end dates
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    for (const day of weekDays) {
      if (day.date >= startDate && day.date <= endDate) {
        if (session.recurrenceDays.includes(day.key)) {
          // Check completion
          const isCompleted = session.completions.some(
            (c) => new Date(c.scheduledDate).toDateString() === day.date.toDateString()
          );

          occurrences.push({
            date: day.date,
            key: day.key,
            label: day.label,
            isCompleted,
          });
        }
      }
    }
    return occurrences;
  };

  const handleToggleCompletion = async (
    sessionId: string,
    scheduledDate: Date,
    currentlyCompleted: boolean
  ) => {
    if (!user) return;
    const nextVal = !currentlyCompleted;

    // Optimistic UI update
    setAssignments((prev) =>
      prev.map((a) => {
        const updatedSessions = a.trainingPlan.sessions.map((s) => {
          if (s.id !== sessionId) return s;

          let updatedCompletions = [...s.completions];
          if (nextVal) {
            updatedCompletions.push({
              id: `temp_${Date.now()}`,
              scheduledDate: scheduledDate.toISOString(),
              completedAt: new Date().toISOString(),
            });
          } else {
            updatedCompletions = updatedCompletions.filter(
              (c) => new Date(c.scheduledDate).toDateString() !== scheduledDate.toDateString()
            );
          }
          return { ...s, completions: updatedCompletions };
        });
        return {
          ...a,
          trainingPlan: { ...a.trainingPlan, sessions: updatedSessions },
        };
      })
    );

    const res = await toggleSessionCompletion(sessionId, user.id, scheduledDate, nextVal);
    if (!res.success) {
      alert("Error al guardar l'estat. Si us plau, torna a provar.");
      fetchData(); // Rollback on error
    }
  };

  const handleOpenFeedback = (type: "session" | "plan", id: string) => {
    setFeedbackComment("");
    setFeedbackVideoUrl("");
    setFeedbackSuccessMsg("");
    setFeedbackErrorMsg("");

    if (type === "session") {
      setFeedbackSessionId(id);
      setFeedbackAssignmentId(null);
    } else {
      setFeedbackSessionId(null);
      setFeedbackAssignmentId(id);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) {
      setFeedbackErrorMsg("El comentari és obligatori.");
      return;
    }

    setSubmittingFeedback(true);
    setFeedbackSuccessMsg("");
    setFeedbackErrorMsg("");

    const res = await submitTrainingFeedback({
      sessionId: feedbackSessionId,
      assignmentId: feedbackAssignmentId,
      comment: feedbackComment,
      videoUrl: feedbackVideoUrl || null,
    });

    if (res.success) {
      setFeedbackSuccessMsg("Feedback enviat correctament!");
      setFeedbackComment("");
      setFeedbackVideoUrl("");
      // Refresh to load new feedback in view
      fetchData();
      // Auto close modal after 1.5s
      setTimeout(() => {
        setFeedbackSessionId(null);
        setFeedbackAssignmentId(null);
        setFeedbackSuccessMsg("");
      }, 1500);
    } else {
      setFeedbackErrorMsg(res.error || "Error al enviar el feedback.");
    }
    setSubmittingFeedback(false);
  };

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <PageContainer className="py-10">
      {/* Header banner */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold text-primary">{t("physical_prep_page.title") || "Preparació Física"}</h1>
          <p className="text-base-content/70 mt-2">
            {t("physical_prep_page.subtitle") || "Controla els teus entrenaments setmanals i segueix els consells de l'entrenador."}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="tabs tabs-boxed shadow-sm border border-base-200 p-1">
          <button
            className={`tab font-semibold text-xs ${activeTab === "checklist" ? "tab-active bg-accent text-white" : ""}`}
            onClick={() => setActiveTab("checklist")}
          >
            📋 Rutines
          </button>
          <button
            className={`tab font-semibold text-xs ${activeTab === "objectives" ? "tab-active bg-accent text-white" : ""}`}
            onClick={() => setActiveTab("objectives")}
          >
            🎯 Objectius
          </button>
          <button
            className={`tab font-semibold text-xs ${activeTab === "questionnaires" ? "tab-active bg-accent text-white" : ""}`}
            onClick={() => setActiveTab("questionnaires")}
          >
            📝 Qüestionaris ({questionnaires.length})
          </button>
        </div>
      </div>

      {activeTab === "checklist" && (
        <div className="space-y-8">
          {/* Week offset controls */}
          <div className="flex justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
            <button className="btn btn-sm btn-outline btn-secondary" onClick={() => setWeekOffset((o) => o - 1)}>
              ← Setmana anterior
            </button>
            <div className="text-center font-bold text-secondary">
              Setmana del {weekDays[0].date.toLocaleDateString()} al {weekDays[6].date.toLocaleDateString()}
              {weekOffset === 0 && <span className="badge badge-accent ml-2 text-xs">Actual</span>}
            </div>
            <button className="btn btn-sm btn-outline btn-secondary" onClick={() => setWeekOffset((o) => o + 1)}>
              Setmana següent →
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="card bg-base-100 shadow border border-base-200 p-10 text-center">
              <p className="text-base-content/50">
                No tens cap plan de preparació física actiu o assignat en aquest moment.
              </p>
            </div>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="card bg-base-100 shadow-md border border-base-200 overflow-hidden">
                <div className="bg-base-200/60 px-6 py-5 border-b border-base-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-secondary">{assignment.trainingPlan.title}</h2>
                    {assignment.trainingPlan.description && (
                      <p className="text-sm text-base-content/75 mt-1">{assignment.trainingPlan.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-base-content/60">Preparador:</span>
                    <div className="flex items-center gap-1.5 bg-base-100 px-3 py-1 rounded-full border border-base-200 text-xs font-bold">
                      {assignment.trainingPlan.trainer.avatarUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={assignment.trainingPlan.trainer.avatarUrl}
                          alt={assignment.trainingPlan.trainer.name}
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <span>{assignment.trainingPlan.trainer.name} {assignment.trainingPlan.trainer.surname}</span>
                    </div>
                    <button
                      className="btn btn-xs btn-outline btn-primary ml-2 font-medium"
                      onClick={() => handleOpenFeedback("plan", assignment.id)}
                    >
                      Feedback General
                    </button>
                  </div>
                </div>

                <div className="card-body p-6 space-y-6">
                  {assignment.trainingPlan.sessions.map((session) => {
                    const occurrences = getSessionOccurrences(assignment, session);
                    return (
                      <div key={session.id} className="border border-base-100 p-4 rounded-xl bg-base-50/50 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-base-200/80 pb-3 gap-2">
                          <div>
                            <h3 className="font-bold text-lg text-secondary">{session.title}</h3>
                            <p className="text-xs text-base-content/50">
                              Vigent del {new Date(session.startDate).toLocaleDateString()} al{" "}
                              {new Date(session.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            className="btn btn-xs btn-outline btn-secondary"
                            onClick={() => handleOpenFeedback("session", session.id)}
                          >
                            Feedback sessió
                          </button>
                        </div>

                        {/* Occurrence checklist */}
                        {occurrences.length === 0 ? (
                          <p className="text-xs text-base-content/40 italic">
                            No programada per a aquesta setmana dins del rang de vigència.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-3">
                            {occurrences.map((occ, idx) => (
                              <label
                                key={idx}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition select-none ${
                                  occ.isCompleted
                                    ? "bg-success/5 border-success/30 text-success font-semibold"
                                    : "bg-base-100 border-base-200 hover:bg-base-50 text-base-content"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-success checkbox-sm"
                                  checked={occ.isCompleted}
                                  onChange={() =>
                                    handleToggleCompletion(session.id, occ.date, occ.isCompleted)
                                  }
                                />
                                <div className="text-xs flex flex-col">
                                  <span className="font-bold">{occ.label}</span>
                                  <span className="text-[10px] opacity-80">{occ.date.toLocaleDateString()}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Session exercises list */}
                        <div className="bg-base-100 p-4 rounded-lg border border-base-150 space-y-3">
                          <h4 className="font-bold text-xs text-base-content/65 uppercase tracking-wider mb-2">
                            Exercicis a realitzar:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {session.exercises.map((se) => (
                              <div
                                key={se.id}
                                className="p-3 border border-base-200 rounded-lg flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-bold text-sm text-secondary">{se.exercise.title}</h5>
                                    <span className="badge badge-accent badge-sm font-semibold">
                                      {se.repetitionsOverride || se.exercise.repetitions}
                                    </span>
                                  </div>
                                  {se.exercise.description && (
                                    <p className="text-xs text-base-content/70 line-clamp-2 mt-1">
                                      {se.exercise.description}
                                    </p>
                                  )}
                                </div>
                                <div className="mt-3 pt-2 border-t border-base-100 flex items-center justify-between text-[11px] font-medium text-primary">
                                  {se.exercise.mediaType === "IMAGE" && se.exercise.imageUrl && (
                                    <a href={se.exercise.imageUrl} target="_blank" rel="noopener noreferrer">
                                      🖼️ Imatge demostrativa
                                    </a>
                                  )}
                                  {se.exercise.mediaType === "VIDEO_LINK" && se.exercise.videoUrl && (
                                    <a href={se.exercise.videoUrl} target="_blank" rel="noopener noreferrer">
                                      🎥 Vídeo demostratiu
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "objectives" && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow border border-base-200 p-6">
            <h2 className="text-2xl font-bold text-secondary mb-2">Objectiu Físic Actiu</h2>
            {activeObjective ? (
              <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl space-y-4">
                <p className="font-medium text-base-content">{activeObjective.summary}</p>
                <div className="divider text-xs text-base-content/40 font-bold m-0 uppercase tracking-wider">
                  Detall de fites
                </div>
                <ul className="space-y-2">
                  {activeObjective.items.map((item: string, index: number) => (
                    <li key={index} className="flex gap-2 text-sm text-base-content/85">
                      <span className="text-primary font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-base-content/50 pt-2 border-t border-base-200/50">
                  Assignat el {new Date(activeObjective.effectiveFrom).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-base-content/50 italic py-4">
                No tens cap objectiu físic actiu actualment. El teu entrenador els definirà properament.
              </p>
            )}
          </div>

          <div className="card bg-base-100 shadow border border-base-200 p-6">
            <h3 className="text-xl font-bold text-secondary mb-4">Historial d'Objectius Físics</h3>
            {objectivesHistory.length <= 1 ? (
              <p className="text-sm text-base-content/50 italic">No hi ha historial disponible.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {objectivesHistory
                  .filter((o) => o.id !== activeObjective?.id)
                  .map((obj) => (
                    <div key={obj.id} className="p-4 border border-base-200 rounded-lg text-sm bg-base-50/30">
                      <p className="font-semibold text-base-content/80 mb-2">{obj.summary}</p>
                      <ul className="space-y-1 pl-4 list-disc text-xs text-base-content/65 mb-3">
                        {obj.items.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                      <p className="text-[9px] text-base-content/50">
                        Vigent del {new Date(obj.effectiveFrom).toLocaleDateString()}{" "}
                        {obj.effectiveTo ? `al ${new Date(obj.effectiveTo).toLocaleDateString()}` : "(Actiu)"}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "questionnaires" && (
        <div className="card bg-base-100 shadow border border-base-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-secondary">Qüestionaris Físics Pendents</h2>
          {questionnaires.length === 0 ? (
            <p className="text-sm text-base-content/50 italic py-4">
              Estàs al dia! No tens cap qüestionari físic pendent de respondre.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questionnaires.map((q) => (
                <div key={q.id} className="p-4 border border-base-200 rounded-xl bg-base-50/50 flex flex-col justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-secondary mb-1">{q.questionnaire.title}</h3>
                    {q.questionnaire.description && (
                      <p className="text-xs text-base-content/70 mb-3">{q.questionnaire.description}</p>
                    )}
                    <span className="text-[10px] text-base-content/50">
                      Enviat per {q.questionnaire.trainer.name} el {new Date(q.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    href={`/questionnaires/assignments/${q.id}`}
                    className="btn btn-sm btn-primary mt-4 font-semibold w-full"
                  >
                    Respondre Ara
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback Modal */}
      {(feedbackSessionId || feedbackAssignmentId) && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-xl mb-4">
              {feedbackSessionId ? "Enviar Feedback de Sessió" : "Enviar Feedback General del Pla"}
            </h3>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {feedbackSuccessMsg && <div className="alert alert-success">{feedbackSuccessMsg}</div>}
              {feedbackErrorMsg && <div className="alert alert-error">{feedbackErrorMsg}</div>}

              <div className="form-control">
                <label className="label font-medium text-sm">Comentaris</label>
                <textarea
                  className="textarea textarea-bordered h-28 text-sm"
                  placeholder="Escull la teva fatiga, problemes amb els exercicis o dubtes..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label font-medium text-sm">Enllaç de vídeo (opcional)</label>
                <input
                  type="url"
                  className="input input-bordered input-sm"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={feedbackVideoUrl}
                  onChange={(e) => setFeedbackVideoUrl(e.target.value)}
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setFeedbackSessionId(null);
                    setFeedbackAssignmentId(null);
                  }}
                  disabled={submittingFeedback}
                >
                  Tancar
                </button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={submittingFeedback}>
                  {submittingFeedback ? "Enviant..." : "Enviar Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
