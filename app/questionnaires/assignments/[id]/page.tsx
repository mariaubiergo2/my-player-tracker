"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import {
  getAssignmentById,
  reclaimAssignment,
  submitAssignmentAnswers,
} from "@/actions/questionnaires";

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();
  const [isPending, startTransition] = useTransition();

  // Assignment data
  const [assignment, setAssignment] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Form State (for Players)
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Feedback State
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        loadAssignment();
      }
    }
  }, [isLoading, isAuthenticated, user, id]);

  const loadAssignment = async () => {
    setLoadingData(true);
    setErrorMessage("");
    try {
      const res = await getAssignmentById(id);
      if (res.success && res.assignment) {
        setAssignment(res.assignment);

        // Prepopulate answers if completed, or clear
        const ansMap: Record<string, string> = {};
        res.assignment.answers.forEach((ans: any) => {
          ansMap[ans.questionId] = ans.value;
        });
        setAnswers(ansMap);
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

  const handleUpdateAnswerValue = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleReclaim = () => {
    setErrorMessage("");
    setSuccessMessage("");
    if (!confirm(t("questionnaires.reclaim_confirm"))) return;

    startTransition(async () => {
      try {
        const res = await reclaimAssignment(id);
        if (res.success) {
          setSuccessMessage(t("questionnaires.questionnaire_reclaimed_success"));
          loadAssignment();
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

  const handleSubmitAnswers = () => {
    setErrorMessage("");
    setSuccessMessage("");

    // Validate that all questions are answered
    const missingAnswers = assignment.questionnaire.questions.filter(
      (q: any) => !answers[q.id]?.trim()
    );

    if (missingAnswers.length > 0) {
      setErrorMessage("Por favor responde todas las preguntas del cuestionario antes de enviar.");
      return;
    }

    startTransition(async () => {
      try {
        const ansList = Object.entries(answers).map(([qId, val]) => ({
          questionId: qId,
          value: val.trim(),
        }));

        const res = await submitAssignmentAnswers(id, ansList);
        if (res.success) {
          setSuccessMessage(t("questionnaires.answers_submitted"));
          loadAssignment();
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

  if (isLoading || loadingData) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!assignment) {
    return (
      <PageContainer className="py-10">
        <div className="alert alert-error">Cuestionario no encontrado.</div>
      </PageContainer>
    );
  }

  const isTrainer = user?.role === "TRAINER";
  const isCompleted = assignment.status === "COMPLETED";
  const isReclaimed = assignment.status === "RECLAIMED";
  const title = assignment.questionnaire.title;
  const description = assignment.questionnaire.description;
  const questions = assignment.questionnaire.questions;

  const playerFullName = `${assignment.player.name} ${assignment.player.surname}`;
  const trainerFullName = `${assignment.questionnaire.trainer.name} ${assignment.questionnaire.trainer.surname}`;

  return (
    <PageContainer className="py-10 animate-fade-in">
      <div className="mb-8">
        <Link href="/questionnaires" className="btn btn-ghost mb-4">
          ← {t("questionnaires.back_list")}
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-base-content/65 mt-2">
              {isTrainer
                ? `Asignado a: ${playerFullName}`
                : `Enviado por: ${trainerFullName}`}
            </p>
          </div>

          <div>
            {assignment.status === "SENT" && <span className="badge badge-info font-bold p-3">{t("questionnaires.status_sent")}</span>}
            {assignment.status === "RECLAIMED" && <span className="badge badge-warning font-bold p-3 text-warning-content">{t("questionnaires.status_reclaimed")}</span>}
            {assignment.status === "COMPLETED" && <span className="badge badge-success font-bold p-3 text-success-content">{t("questionnaires.status_completed")}</span>}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-error shadow shadow-lg mb-6 border border-error/20">
          <span>❌ {errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success shadow shadow-lg mb-6 border border-success/20">
          <span>✅ {successMessage}</span>
        </div>
      )}

      {/* Reclaimed Player Banner */}
      {!isTrainer && isReclaimed && (
        <div className="alert alert-warning shadow border border-warning/20 mb-6 p-4 rounded-3xl">
          <div>
            <h3 className="font-bold text-warning-content">⚠️ Reclamación Activa</h3>
            <p className="text-sm text-warning-content/85 mt-1">{t("questionnaires.reclaimed_status_info")}</p>
          </div>
        </div>
      )}

      {/* Reclaimed Trainer Banner */}
      {isTrainer && isReclaimed && (
        <div className="alert alert-warning shadow border border-warning/20 mb-6 p-4 rounded-3xl">
          <div>
            <h3 className="font-bold text-warning-content">⚠️ Cuestionario Reclamado</h3>
            <p className="text-sm text-warning-content/85 mt-1">El jugador ha reclamado este cuestionario para pedir una redefinición de objetivos.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Q&A List */}
        <div className="lg:col-span-2 space-y-6">
          {description && (
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body p-6">
                <h2 className="card-title text-base-content/50 text-xs uppercase tracking-wider">Descripción</h2>
                <p className="text-base-content/80 mt-1 whitespace-pre-wrap">{description}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Preguntas</h2>

            {questions.map((q: any, qIdx: number) => {
              const currentVal = answers[q.id] || "";

              return (
                <div key={q.id} className="card bg-base-100 shadow border border-base-200">
                  <div className="card-body p-6">
                    <div className="flex justify-between items-center border-b border-base-content/5 pb-2 mb-3">
                      <span className="font-bold text-xs text-base-content/40">Pregunta #{qIdx + 1}</span>
                      <span className="badge badge-sm badge-neutral">
                        {q.type === "OPEN" ? t("questionnaires.type_open") : t("questionnaires.type_multiple")}
                      </span>
                    </div>

                    <p className="font-bold text-base-content/85 mb-4">{q.text}</p>

                    {/* Answer View Mode */}
                    {isCompleted || isTrainer ? (
                      <div className="bg-base-200/50 p-4 rounded-2xl border border-base-content/5 mt-2">
                        <p className="text-xs text-base-content/40 font-bold uppercase tracking-wider">Respuesta</p>
                        <p className="text-base-content/80 mt-2 font-medium whitespace-pre-wrap">
                          {currentVal || (isTrainer ? "Sin respuesta todavía." : "")}
                        </p>
                      </div>
                    ) : (
                      /* Interactive Answering Mode (For Player) */
                      <div className="form-control mt-2">
                        {q.type === "OPEN" ? (
                          <textarea
                            className="textarea textarea-bordered w-full h-24"
                            placeholder={t("questionnaires.open_response_placeholder")}
                            value={currentVal}
                            onChange={(e) => handleUpdateAnswerValue(q.id, e.target.value)}
                          />
                        ) : (
                          <div className="space-y-2">
                            {q.options.map((opt: string, optIdx: number) => (
                              <label key={optIdx} className="flex items-center gap-3 p-3 bg-base-200/40 border border-base-content/5 rounded-2xl hover:bg-base-200/80 cursor-pointer transition-colors">
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  className="radio radio-primary radio-sm"
                                  checked={currentVal === opt}
                                  onChange={() => handleUpdateAnswerValue(q.id, opt)}
                                />
                                <span className="text-sm font-semibold text-base-content/80">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Info & Action buttons */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow border border-base-200 sticky top-6">
            <div className="card-body p-6">
              <h2 className="card-title text-xl border-b border-base-content/5 pb-2 mb-4">Detalles</h2>

              <div className="space-y-4 text-sm mb-6">
                <div>
                  <p className="text-base-content/55">Enviado el:</p>
                  <p className="font-bold text-base-content/95 mt-0.5">{new Date(assignment.sentAt).toLocaleDateString(locale)}</p>
                </div>
                {assignment.reclaimedAt && (
                  <div>
                    <p className="text-base-content/55">{t("questionnaires.reclaimed_at")}:</p>
                    <p className="font-bold text-warning mt-0.5">{new Date(assignment.reclaimedAt).toLocaleDateString(locale)}</p>
                  </div>
                )}
                {assignment.respondedAt && (
                  <div>
                    <p className="text-base-content/55">{t("questionnaires.responded_at")}:</p>
                    <p className="font-bold text-success mt-0.5">{new Date(assignment.respondedAt).toLocaleDateString(locale)}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons for Players */}
              {!isTrainer && !isCompleted && (
                <div className="flex flex-col gap-3 pt-4 border-t border-base-content/5">
                  <button
                    onClick={handleSubmitAnswers}
                    disabled={isPending}
                    className="btn btn-primary w-full shadow-md"
                  >
                    {isPending ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      "🚀 " + t("questionnaires.submit_answers")
                    )}
                  </button>

                  {assignment.status === "SENT" && (
                    <button
                      onClick={handleReclaim}
                      disabled={isPending}
                      className="btn btn-warning btn-outline w-full text-warning hover:text-warning-content"
                    >
                      ⚠️ {t("questionnaires.reclaim")}
                    </button>
                  )}
                </div>
              )}

              {/* Status indicator for Trainer */}
              {isTrainer && !isCompleted && (
                <div className="alert alert-info border border-info/20 shadow p-4 rounded-3xl mt-4">
                  <p className="text-xs">{t("questionnaires.waiting_response")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
