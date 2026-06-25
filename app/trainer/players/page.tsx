"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAllPlayersWithMatchCount, assignPlayerToTrainer } from "@/actions/trainer";
import { useTranslation } from "@/components/LanguageProvider";

interface PlayerListItem {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  trainerId: string | null;
  matchCount: number;
}

export default function TrainerPlayersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Route protection & loading
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "TRAINER") {
        router.push("/dashboard");
      } else {
        fetchPlayers();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const res = await getAllPlayersWithMatchCount();
      if (res.success && res.players) {
        setPlayers(res.players);
      } else {
        setErrorMessage(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t("common.error"));
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleAssign = async (playerId: string) => {
    setAssigningId(playerId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await assignPlayerToTrainer(playerId);
      if (res.success) {
        setSuccessMessage(t("trainer_players.success_assign"));
        // Update local state to reflect assignment
        setPlayers((prev) =>
          prev.map((p) => (p.id === playerId ? { ...p, trainerId: user?.id || "" } : p))
        );
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setErrorMessage(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t("common.error"));
    } finally {
      setAssigningId(null);
    }
  };

  const filteredPlayers = players.filter((p) => {
    const fullName = `${p.name} ${p.surname}`.toLowerCase();
    const email = p.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  if (isLoading || loadingPlayers) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/60 font-medium">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "TRAINER") {
    return null;
  }

  return (
    <section className="container mx-auto px-6 py-10 animate-fade-in">
      {/* Alert banners */}
      {successMessage && (
        <div className="alert alert-success shadow-lg mb-6 border border-success/20">
          <div>
            <span>✅ {successMessage}</span>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-error shadow-lg mb-6 border border-error/20">
          <div>
            <span>❌ {errorMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("trainer_players.title")}
          </h1>
          <p className="text-base-content/70 mt-2">
            {t("trainer_players.subtitle")}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="card bg-base-100 shadow-md border border-base-200 mb-8">
        <div className="card-body py-4">
          <div className="form-control w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder={t("trainer_players.search_placeholder")}
                className="input input-bordered w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-3 top-3.5 text-base-content/50">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredPlayers.length === 0 ? (
        <div className="hero bg-base-200 rounded-2xl p-10 text-center border border-base-content/5">
          <div className="max-w-md">
            <span className="text-5xl">⚽</span>
            <h3 className="text-2xl font-bold mt-4">{t("trainer_players.no_players")}</h3>
            <p className="py-2 text-base-content/60">
              {t("trainer_players.adjust_search")}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto card bg-base-100 shadow-xl border border-base-200">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th>{t("trainer_players.table_name")}</th>
                <th>{t("trainer_players.table_email")}</th>
                <th>{t("trainer_players.table_phone")}</th>
                <th>{t("trainer_players.table_birth")}</th>
                <th className="text-center">{t("trainer_players.table_matches")}</th>
                <th className="text-right">{t("trainer_players.table_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((p) => {
                const isAssignedToMe = p.trainerId === user.id;
                const isAssignedToOther = p.trainerId !== null && p.trainerId !== user.id;

                return (
                  <tr key={p.id} className="hover:bg-base-200/30 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-9">
                            <span className="text-xs font-semibold">
                              {p.name.charAt(0).toUpperCase()}
                              {p.surname.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="font-bold text-base-content">
                          {p.name} {p.surname}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-base-content/85">{p.email}</span>
                    </td>
                    <td>
                      {p.phone || <span className="text-base-content/30 italic">{t("common.not_specified")}</span>}
                    </td>
                    <td>
                      {p.birthDate || <span className="text-base-content/30 italic">{t("common.not_specified")}</span>}
                    </td>
                    <td className="text-center">
                      <span className="badge badge-neutral font-semibold">{p.matchCount}</span>
                    </td>
                    <td className="text-right">
                      {isAssignedToMe ? (
                        <span className="badge badge-success font-semibold text-white py-3 px-4">
                          {t("trainer_players.assigned_to_you")}
                        </span>
                      ) : isAssignedToOther ? (
                        <div className="flex justify-end items-center gap-2">
                          <span className="badge badge-ghost text-base-content/50 italic mr-2">
                            {t("trainer_players.assigned_to_other")}
                          </span>
                          <button
                            onClick={() => handleAssign(p.id)}
                            className="btn btn-secondary btn-sm"
                            disabled={assigningId === p.id}
                          >
                            {assigningId === p.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              t("trainer_players.reassign_to_me")
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAssign(p.id)}
                          className="btn btn-primary btn-sm"
                          disabled={assigningId === p.id}
                        >
                          {assigningId === p.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            t("trainer_players.assign_to_me")
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

