"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import { getPlayerActivePlans, toggleSessionCompletion } from "@/actions/training-plans";
import { submitTrainingFeedback } from "@/actions/training-feedback";

interface ExerciseDetail {
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
}

interface SessionDetail {
  id: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  exercises: ExerciseDetail[];
  completions: {
    id: string;
    scheduledDate: Date | string;
    completedAt: Date | string;
  }[];
  feedback: {
    id: string;
    comment: string | null;
    videoUrl: string | null;
    isReviewed: boolean;
    createdAt: Date | string;
  }[];
  trainingPlan: {
    title: string;
  };
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const { sessionId } = use(params);

  // Search parameters for calendar state preservation
  const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const viewMode = searchParams.get("viewMode") || "month";
  const viewDate = searchParams.get("viewDate") || dateParam;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Feedback states
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackVideoUrl, setFeedbackVideoUrl] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState("");
  const [feedbackErrorMsg, setFeedbackErrorMsg] = useState("");

  const occurrenceDate = new Date(dateParam);
  occurrenceDate.setHours(0, 0, 0, 0);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getPlayerActivePlans(user.id);
      if (res.success && res.data) {
        // Find session across active plans
        let foundSession: SessionDetail | null = null;
        for (const assignment of res.data) {
          const s = assignment.trainingPlan.sessions.find((s: any) => s.id === sessionId);
          if (s) {
            foundSession = {
              ...s,
              trainingPlan: {
                title: assignment.trainingPlan.title,
              },
            };
            break;
          }
        }
        if (foundSession) {
          setSession(foundSession);
        } else {
          setErrorMsg("Sessió no trobada");
        }
      } else {
        setErrorMsg(res.error || "Error al carregar la sessió");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de xarxa al carregar la sessió");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        fetchData();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <PageContainer className="py-10">
        <div className="alert alert-error shadow-lg">
          <span>❌ {errorMsg || "Sessió no trobada"}</span>
        </div>
        <Link href="/dashboard/physical" className="btn btn-outline mt-6">
          &larr; Volver
        </Link>
      </PageContainer>
    );
  }

  // Check completion
  const isCompleted = session.completions.some(
    (c) => new Date(c.scheduledDate).toDateString() === occurrenceDate.toDateString()
  );

  const handleToggleCompletion = async () => {
    if (!user) return;
    const nextVal = !isCompleted;

    // Optimistic UI update
    setSession((prev) => {
      if (!prev) return null;
      let updatedCompletions = [...prev.completions];
      if (nextVal) {
        updatedCompletions.push({
          id: `temp_${Date.now()}`,
          scheduledDate: occurrenceDate.toISOString(),
          completedAt: new Date().toISOString(),
        });
      } else {
        updatedCompletions = updatedCompletions.filter(
          (c) => new Date(c.scheduledDate).toDateString() !== occurrenceDate.toDateString()
        );
      }
      return { ...prev, completions: updatedCompletions };
    });

    const res = await toggleSessionCompletion(session.id, user.id, occurrenceDate, nextVal);
    if (!res.success) {
      alert("Error al guardar l'estat.");
      fetchData(); // Rollback
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
      sessionId: session.id,
      comment: feedbackComment,
      videoUrl: feedbackVideoUrl || null,
    });

    if (res.success) {
      setFeedbackSuccessMsg("Feedback enviat correctament!");
      setFeedbackComment("");
      setFeedbackVideoUrl("");
      fetchData();
    } else {
      setFeedbackErrorMsg(res.error || "Error al enviar el feedback.");
    }
    setSubmittingFeedback(false);
  };

  // Find feedback near date (same day +/- 1 day)
  const occurrenceFeedbackList = session.feedback.filter((f) => {
    const fbDate = new Date(f.createdAt);
    const diffTime = Math.abs(fbDate.getTime() - occurrenceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  });

  return (
    <PageContainer className="py-10 animate-fade-in">
      {/* Return button */}
      <div className="mb-6">
        <Link
          href={`/dashboard/physical?viewMode=${viewMode}&viewDate=${viewDate}`}
          className="btn btn-sm btn-ghost gap-2 text-base-content/70 hover:text-base-content"
        >
          &larr; {t("physical_prep_page.back_to_calendar")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Details & Exercises */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Info */}
          <div className="card bg-base-100 shadow-md border border-base-200 p-8 rounded-3xl">
            <span className="badge badge-accent badge-sm font-semibold mb-2">
              {session.trainingPlan.title}
            </span>
            <h1 className="text-3xl font-extrabold text-secondary tracking-tight">
              {session.title}
            </h1>
            <p className="text-sm text-base-content/65 mt-2 font-medium">
              📅 Fecha de ejecución: <span className="text-primary font-bold">{occurrenceDate.toLocaleDateString()}</span>
            </p>

            <div className="divider my-6"></div>

            {/* Checklist Toggle Card inside Info */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-base-50 border border-base-200 p-5 rounded-2xl gap-4">
              <div>
                <h3 className="font-bold text-base-content">
                  {t("physical_prep_page.completion_status")}
                </h3>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Marca esta sesión una vez la hayas finalizado.
                </p>
              </div>

              <button
                onClick={handleToggleCompletion}
                className={`btn btn-md rounded-xl shadow-md transition-all duration-300 w-full sm:w-auto px-6 ${
                  isCompleted
                    ? "btn-success text-success-content"
                    : "btn-outline btn-primary"
                }`}
              >
                {isCompleted ? (
                  <span className="flex items-center gap-1.5 font-bold">
                    ✓ {t("physical_prep_page.completed")}
                  </span>
                ) : (
                  <span>{t("physical_prep_page.mark_completed")}</span>
                )}
              </button>
            </div>
          </div>

          {/* Exercises */}
          <div>
            <h2 className="text-2xl font-bold text-secondary mb-4 px-2">
              🏋️‍♂️ Ejercicios de la sesión ({session.exercises.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {session.exercises.map((se, index) => (
                <div
                  key={se.id}
                  className="card bg-base-100 border border-base-200 shadow-md hover:shadow-lg transition-all duration-300 rounded-3xl overflow-hidden"
                >
                  <div className="card-body p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="badge badge-primary font-bold">
                          # {index + 1}
                        </span>
                        <span className="badge badge-accent font-black py-2.5 px-3">
                          {se.repetitionsOverride || se.exercise.repetitions}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-secondary">{se.exercise.title}</h3>
                      {se.exercise.description && (
                        <p className="text-sm text-base-content/70 mt-2 leading-relaxed">
                          {se.exercise.description}
                        </p>
                      )}
                    </div>

                    {/* Media links */}
                    {(se.exercise.imageUrl || se.exercise.videoUrl) && (
                      <div className="mt-6 pt-4 border-t border-base-200 flex flex-wrap gap-4 text-xs font-semibold text-primary">
                        {se.exercise.mediaType === "IMAGE" && se.exercise.imageUrl && (
                          <a
                            href={se.exercise.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            🖼️ Imatge demostrativa
                          </a>
                        )}
                        {se.exercise.mediaType === "VIDEO_LINK" && se.exercise.videoUrl && (
                          <a
                            href={se.exercise.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            🎥 Vídeo demostratiu
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Feedback Form & History */}
        <div className="lg:col-span-4 space-y-6">
          {/* Feedback Card */}
          <div className="card bg-base-100 border border-base-200 shadow-md p-6 rounded-3xl">
            <h2 className="text-xl font-bold text-secondary mb-4">
              💬 Enviar Feedback
            </h2>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {feedbackSuccessMsg && (
                <div className="alert alert-success shadow-inner text-sm py-2">
                  <span>✓ {feedbackSuccessMsg}</span>
                </div>
              )}
              {feedbackErrorMsg && (
                <div className="alert alert-error shadow-inner text-sm py-2">
                  <span>❌ {feedbackErrorMsg}</span>
                </div>
              )}

              <div className="form-control">
                <label className="label font-semibold text-xs text-base-content/70">
                  Comentario de esfuerzo / fatiga
                </label>
                <textarea
                  className="textarea textarea-bordered h-28 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Explica qué RPE has percibido, molestias físicas, fatiga..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  required
                  disabled={submittingFeedback}
                />
              </div>

              <div className="form-control">
                <label className="label font-semibold text-xs text-base-content/70">
                  Enlace externo de vídeo (opcional)
                </label>
                <input
                  type="url"
                  className="input input-bordered input-md focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={feedbackVideoUrl}
                  onChange={(e) => setFeedbackVideoUrl(e.target.value)}
                  disabled={submittingFeedback}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block rounded-xl shadow-md"
                disabled={submittingFeedback}
              >
                {submittingFeedback ? "Enviant..." : t("physical_prep_page.send_feedback")}
              </button>
            </form>
          </div>

          {/* Feedback History for this occurrence */}
          <div className="card bg-base-100 border border-base-200 shadow-md p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-secondary mb-3">
              📅 Histórico de Feedback (Esta sesión)
            </h3>

            {occurrenceFeedbackList.length === 0 ? (
              <p className="text-xs text-base-content/50 italic py-2">
                No se ha registrado feedback para esta fecha.
              </p>
            ) : (
              <div className="space-y-3">
                {occurrenceFeedbackList.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3 border border-base-200 rounded-2xl bg-base-50 text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-base-content/50">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                      {fb.isReviewed ? (
                        <span className="badge badge-success badge-xs font-semibold">
                          {t("physical_prep_page.feedback_reviewed")}
                        </span>
                      ) : (
                        <span className="badge badge-warning badge-xs font-semibold">
                          Pendiente de revisar
                        </span>
                      )}
                    </div>
                    <p className="text-base-content/95 font-medium leading-relaxed">
                      {fb.comment}
                    </p>
                    {fb.videoUrl && (
                      <a
                        href={fb.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-[10px] block"
                      >
                        🔗 Ver vídeo adjunto
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
