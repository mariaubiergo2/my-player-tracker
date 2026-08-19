"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import { getTrainerFeedbackInbox, reviewFeedback } from "@/actions/training-feedback";

interface FeedbackItem {
  id: string;
  comment: string | null;
  videoUrl: string | null;
  isReviewed: boolean;
  reviewedAt: string | Date | null;
  createdAt: string | Date;
  player: {
    id: string;
    name: string;
    surname: string;
    avatarUrl: string | null;
  };
  session?: {
    id: string;
    title: string;
    trainingPlan: {
      title: string;
    };
  } | null;
  assignment?: {
    id: string;
    trainingPlan: {
      title: string;
    };
  } | null;
}

export default function TrainerFeedbackInboxPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("pending");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "TRAINER" && user?.role !== "ADMIN") {
        router.push("/dashboard");
      } else {
        fetchFeedbacks();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    const res = await getTrainerFeedbackInbox();
    if (res.success && res.data) {
      setFeedbacks(res.data as FeedbackItem[]);
    }
    setLoading(false);
  };

  const handleReview = async (id: string) => {
    const res = await reviewFeedback(id);
    if (res.success) {
      fetchFeedbacks();
    } else {
      alert("Error al marcar el feedback como revisado.");
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (filter === "pending") return !fb.isReviewed;
    if (filter === "reviewed") return fb.isReviewed;
    return true;
  });

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <PageContainer className="py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-primary">Bústia de Feedback Físic</h1>
          <p className="text-base-content/70 mt-2">
            Revisa els comentaris i vídeos de recuperació/entrenament enviats pels teus jugadors.
          </p>
        </div>
        <div className="join border border-base-200 shadow-sm bg-base-100">
          <button
            className={`btn btn-sm join-item ${filter === "pending" ? "btn-accent text-white" : "btn-ghost"}`}
            onClick={() => setFilter("pending")}
          >
            Pendent ({feedbacks.filter((f) => !f.isReviewed).length})
          </button>
          <button
            className={`btn btn-sm join-item ${filter === "reviewed" ? "btn-accent text-white" : "btn-ghost"}`}
            onClick={() => setFilter("reviewed")}
          >
            Revisats ({feedbacks.filter((f) => f.isReviewed).length})
          </button>
          <button
            className={`btn btn-sm join-item ${filter === "all" ? "btn-accent text-white" : "btn-ghost"}`}
            onClick={() => setFilter("all")}
          >
            Tots ({feedbacks.length})
          </button>
        </div>
      </div>

      {filteredFeedbacks.length === 0 ? (
        <div className="card bg-base-100 shadow border border-base-200 p-10 text-center">
          <p className="text-base-content/50">No s'ha trobat cap comentari o feedback amb aquest filtre.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFeedbacks.map((fb) => (
            <div
              key={fb.id}
              className={`card bg-base-100 shadow border transition-all ${
                fb.isReviewed ? "border-base-200 opacity-80" : "border-primary/30 bg-primary/0"
              }`}
            >
              <div className="card-body p-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  {/* Player header */}
                  <div className="flex items-center gap-3">
                    {fb.player.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fb.player.avatarUrl!} alt={fb.player.name} className="w-12 h-12 rounded-full object-cover border border-base-300" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center font-bold text-lg">
                        {fb.player.name[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-secondary">
                        {fb.player.name} {fb.player.surname}
                      </h3>
                      <p className="text-xs text-base-content/50">
                        {new Date(fb.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Context Badge */}
                  <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
                    {fb.session ? (
                      <>
                        <span className="badge badge-primary font-semibold text-xs py-1.5 px-3">
                          Sessió: {fb.session.title}
                        </span>
                        <span className="text-xs text-base-content/60 font-medium">
                          Pla: {fb.session.trainingPlan.title}
                        </span>
                      </>
                    ) : fb.assignment ? (
                      <span className="badge badge-accent font-semibold text-xs py-1.5 px-3">
                        Pla Complet: {fb.assignment.trainingPlan.title}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Comment & Video link */}
                <div className="bg-base-50 p-4 rounded-xl border border-base-200">
                  <p className="text-sm italic text-base-content/85 whitespace-pre-line">
                    "{fb.comment || "Sense comentari escrit."}"
                  </p>
                  {fb.videoUrl && (
                    <div className="mt-3 pt-3 border-t border-base-200">
                      <a
                        href={fb.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary text-xs font-semibold flex items-center gap-1.5"
                      >
                        🎥 Enllaç de vídeo del jugador: {fb.videoUrl}
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="card-actions justify-end items-center gap-4">
                  {fb.isReviewed ? (
                    <div className="text-xs text-success flex items-center gap-1 font-semibold">
                      ✓ Revisat el {new Date(fb.reviewedAt!).toLocaleDateString()}
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={() => handleReview(fb.id)}>
                      Marcar com a Revisat
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
