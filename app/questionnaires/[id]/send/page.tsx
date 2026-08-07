"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import { getQuestionnaireById, sendQuestionnaireToPlayers, getSelectablePlayersForTrainer } from "@/actions/questionnaires";

export default function SendQuestionnairePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  // Data State
  const [template, setTemplate] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Selector State
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  // Feedback State
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "TRAINER") {
        router.push("/dashboard");
      } else {
        loadData();
      }
    }
  }, [isLoading, isAuthenticated, user, id]);

  const loadData = async () => {
    setLoadingData(true);
    setErrorMessage("");
    try {
      const [templateRes, playersRes] = await Promise.all([
        getQuestionnaireById(id),
        getSelectablePlayersForTrainer(),
      ]);

      if (templateRes.success && templateRes.questionnaire) {
        setTemplate(templateRes.questionnaire);
      } else {
        setErrorMessage(templateRes.error || t("common.error"));
      }

      if (playersRes.success && playersRes.players) {
        setPlayers(playersRes.players);
      } else {
        setErrorMessage((prev) => prev || playersRes.error || "Failed to load players");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t("common.error"));
    } finally {
      setLoadingData(false);
    }
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPlayerIds.length === players.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(players.map((p) => p.id));
    }
  };

  const handleSend = () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (selectedPlayerIds.length === 0) {
      setErrorMessage(t("questionnaires.validation_player_required"));
      return;
    }

    startTransition(async () => {
      try {
        const res = await sendQuestionnaireToPlayers(id, selectedPlayerIds);
        if (res.success) {
          setSuccessMessage(t("questionnaires.send_success"));
          setTimeout(() => {
            router.push(`/questionnaires/${id}`);
          }, 1500);
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

  if (user?.role !== "TRAINER" || !template) {
    return null;
  }

  return (
    <PageContainer className="py-10 animate-fade-in">
      <div className="mb-8">
        <Link href={`/questionnaires/${id}`} className="btn btn-ghost mb-4">
          ← Cancelar y volver al cuestionario
        </Link>

        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Enviar Cuestionario
        </h1>
        <p className="text-base-content/70 mt-2">
          Plantilla: <strong className="text-base-content font-bold">{template.title}</strong>
        </p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Players Selector List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body p-6">
              <div className="flex items-center justify-between border-b border-base-content/5 pb-4 mb-4">
                <span className="font-bold text-lg">Tus Jugadores</span>
                {players.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="btn btn-xs btn-outline btn-neutral"
                  >
                    {selectedPlayerIds.length === players.length ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                )}
              </div>

              {players.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-base-content/50">{t("questionnaires.no_players_available")}</p>
                  <Link href="/trainer/players" className="btn btn-neutral btn-outline btn-sm mt-4">
                    Asignar jugadores
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-base-content/5 max-h-[500px] overflow-y-auto pr-2">
                  {players.map((p) => {
                    const fullName = `${p.name} ${p.surname}`;
                    const isSelected = selectedPlayerIds.includes(p.id);

                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePlayerSelection(p.id)}
                        className={`flex items-center justify-between p-3.5 hover:bg-base-200/50 cursor-pointer rounded-2xl transition-colors ${
                          isSelected ? "bg-primary/5 border border-primary/20" : "border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder flex-shrink-0">
                            <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 overflow-hidden flex items-center justify-center">
                              {p.avatarUrl ? (
                                <img src={p.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-semibold">
                                  {fullName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-tight text-base-content">{fullName}</p>
                            <p className="text-[10px] text-base-content/40 mt-1">Jugador asignado</p>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={isSelected}
                          readOnly
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Summary & Confirm */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow border border-base-200 sticky top-6">
            <div className="card-body">
              <h2 className="card-title text-xl border-b border-base-content/5 pb-2 mb-4">Resumen del Envío</h2>
              
              <div className="space-y-4">
                <div className="text-sm">
                  <p className="text-base-content/55">Plantilla seleccionada:</p>
                  <p className="font-bold text-base-content/95 mt-0.5">{template.title}</p>
                </div>
                <div className="text-sm">
                  <p className="text-base-content/55">Preguntas totales:</p>
                  <p className="font-bold text-base-content/95 mt-0.5">{template.questions.length}</p>
                </div>
                <div className="text-sm">
                  <p className="text-base-content/55">Destinatarios:</p>
                  <p className="font-bold text-primary mt-0.5">{selectedPlayerIds.length} jugadores</p>
                </div>
              </div>

              <div className="border-t border-base-content/5 pt-4 mt-6">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isPending || selectedPlayerIds.length === 0}
                  className="btn btn-primary w-full shadow-md"
                >
                  {isPending ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "🚀 Enviar Cuestionario"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
