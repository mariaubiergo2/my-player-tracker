"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import { getTrainingPlans, createTrainingPlan, deleteTrainingPlan, sendTrainingPlan } from "@/actions/training-plans";
import { getSelectablePlayersForTrainer } from "@/actions/questionnaires";

interface Player {
  id: string;
  name: string;
  surname: string;
  avatarUrl: string | null;
}

interface TrainingPlan {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "SENT";
  createdAt: Date | string;
  sessions: any[];
  assignments: { player: Player }[];
}

export default function TrainingPlansPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [selectablePlayers, setSelectablePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planDescription, setPlanDescription] = useState("");

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const [errorMsg, setErrorMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "TRAINER" && user?.role !== "ADMIN") {
        router.push("/dashboard");
      } else {
        fetchData();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchData = async () => {
    setLoading(true);
    const plansRes = await getTrainingPlans();
    if (plansRes.success && plansRes.data) {
      setPlans(plansRes.data as TrainingPlan[]);
    }
    const playersRes = await getSelectablePlayersForTrainer();
    if (playersRes.success && playersRes.players) {
      setSelectablePlayers(playersRes.players as Player[]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setPlanTitle("");
    setPlanDescription("");
    setErrorMsg("");
    setCreateModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const res = await createTrainingPlan({ title: planTitle, description: planDescription });
    if (res.success && res.data) {
      setCreateModalOpen(false);
      router.push(`/trainer/training-plans/${res.data.id}`);
    } else {
      setErrorMsg(res.error || "Error al crear el plan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("trainer_training_plans.delete_confirm") || "¿Estás seguro de que quieres eliminar este plan de entrenamiento?")) return;
    const res = await deleteTrainingPlan(id);
    if (res.success) {
      fetchData();
    } else {
      alert("Error al eliminar el plan");
    }
  };

  const handleOpenSend = (plan: TrainingPlan) => {
    setSelectedPlanId(plan.id);
    // Pre-fill already assigned players
    setSelectedPlayerIds(plan.assignments.map((a) => a.player.id));
    setErrorMsg("");
    setSendModalOpen(true);
  };

  const handleSend = async () => {
    if (!selectedPlanId) return;
    if (selectedPlayerIds.length === 0) {
      setErrorMsg("Deus de seleccionar almenys un jugador.");
      return;
    }

    setSending(true);
    setErrorMsg("");
    const res = await sendTrainingPlan(selectedPlanId, selectedPlayerIds);
    if (res.success) {
      setSendModalOpen(false);
      fetchData();
    } else {
      setErrorMsg(res.error || "Error al enviar el plan");
    }
    setSending(false);
  };

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
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
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-primary">{t("trainer_training_plans.title") || "Planes de Entrenamiento"}</h1>
          <p className="text-base-content/70 mt-2">
            {t("trainer_training_plans.subtitle") || "Dibuixa, organitza i assigna plans d'entrenament als jugadors."}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          {t("trainer_training_plans.create_plan_btn") || "+ Crear Plan"}
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="card bg-base-100 shadow border border-base-200 p-10 text-center">
          <p className="text-base-content/50">{t("common.none") || "No hi ha cap plan creat."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="card bg-base-100 shadow border border-base-200 overflow-hidden flex flex-col justify-between">
              <div className="card-body p-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className={`badge mb-2 font-semibold ${plan.status === "SENT" ? "badge-success" : "badge-warning"}`}>
                      {plan.status === "SENT" ? t("trainer_training_plans.sent") || "Enviat" : t("trainer_training_plans.draft") || "Esborrador"}
                    </span>
                    <h3 className="card-title text-2xl font-bold text-secondary">{plan.title}</h3>
                  </div>
                  <span className="badge badge-neutral badge-outline font-medium py-3 px-4 text-xs">
                    {t("trainer_training_plans.sessions_count", { count: plan.sessions.length }) || `${plan.sessions.length} sessions`}
                  </span>
                </div>

                {plan.description && <p className="text-sm text-base-content/70 mt-3 line-clamp-2">{plan.description}</p>}

                {plan.assignments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-base-content/55 mb-2">Jugadors assignats:</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.assignments.map((a) => (
                        <div key={a.player.id} className="flex items-center gap-1 bg-base-200 text-xs px-2.5 py-1 rounded-full font-medium">
                          {a.player.avatarUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.player.avatarUrl} alt={a.player.name} className="w-4 h-4 rounded-full" />
                          )}
                          <span>{a.player.name} {a.player.surname}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="card-actions justify-between items-center p-6 bg-base-50/50 border-t border-base-100">
                <div className="flex gap-2">
                  <Link href={`/trainer/training-plans/${plan.id}`} className="btn btn-sm btn-outline btn-secondary">
                    {t("common.edit") || "Editar / Dissenyar"}
                  </Link>
                  <button className="btn btn-sm btn-outline btn-primary" onClick={() => handleOpenSend(plan)}>
                    {t("trainer_training_plans.send_plan") || "Assignar a Jugador"}
                  </button>
                </div>
                <button className="btn btn-sm btn-outline btn-error btn-square" onClick={() => handleDelete(plan.id)}>
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* modal create */}
      {createModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-xl mb-4">Nou Plan d'Entrenament</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
              <div className="form-control">
                <label className="label font-medium">{t("trainer_training_plans.exercise_title") || "Títol del Pla"}</label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label font-medium">{t("common.description") || "Descripció"}</label>
                <textarea
                  className="textarea textarea-bordered h-20"
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                />
              </div>
              <div className="modal-action">
                <button type="button" className="btn btn-outline" onClick={() => setCreateModalOpen(false)}>
                  {t("common.cancel") || "Cancel·lar"}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t("common.save") || "Crear i continuar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal send */}
      {sendModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-xl mb-4">{t("trainer_training_plans.select_players") || "Assignar Plan"}</h3>
            <p className="text-xs text-base-content/60 mb-4">
              {t("trainer_training_plans.send_confirm") || "Escull els jugadors de la teva plantilla que faran aquest plan."}
            </p>
            {errorMsg && <div className="alert alert-error mb-4">{errorMsg}</div>}

            <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-2">
              {selectablePlayers.length === 0 ? (
                <p className="text-sm text-base-content/50 text-center py-4">No tens cap jugador assignat.</p>
              ) : (
                selectablePlayers.map((player) => {
                  const isChecked = selectedPlayerIds.includes(player.id);
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                        isChecked ? "bg-primary/5 border-primary/45" : "border-base-200 hover:bg-base-50"
                      }`}
                      onClick={() => handleTogglePlayer(player.id)}
                    >
                      <div className="flex items-center gap-3">
                        {player.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={player.avatarUrl} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center font-bold text-xs">
                            {player.name[0]}
                          </div>
                        )}
                        <span className="font-medium text-sm">{player.name} {player.surname}</span>
                      </div>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={isChecked}
                        onChange={() => {}} // click handler is on parent
                      />
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-action">
              <button type="button" className="btn btn-outline" onClick={() => setSendModalOpen(false)}>
                {t("common.cancel") || "Cancel·lar"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSend}
                disabled={sending || selectablePlayers.length === 0}
              >
                {sending ? "Enviant..." : t("common.save") || "Assignar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
