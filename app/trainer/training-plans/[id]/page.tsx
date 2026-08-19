"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import { getTrainingPlanById, updateTrainingPlan } from "@/actions/training-plans";
import { getExercises } from "@/actions/exercises";

interface Exercise {
  id: string;
  title: string;
  repetitions: string;
}

interface SessionExercise {
  exerciseId: string;
  repetitionsOverride: string;
}

interface SessionForm {
  id: string; // Local temp ID
  title: string;
  recurrenceDays: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[];
  startDate: string;
  endDate: string;
  exercises: SessionExercise[];
}

export default function TrainingPlanBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [planTitle, setPlanTitle] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [sessions, setSessions] = useState<SessionForm[]>([]);
  const [libraryExercises, setLibraryExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "TRAINER" && user?.role !== "ADMIN") {
        router.push("/dashboard");
      } else {
        loadData();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");

    const [planRes, exRes] = await Promise.all([
      getTrainingPlanById(id),
      getExercises(),
    ]);

    if (planRes.success && planRes.data) {
      const plan = planRes.data;
      setPlanTitle(plan.title);
      setPlanDescription(plan.description || "");

      // Format sessions from DB
      const formattedSessions: SessionForm[] = plan.sessions.map((s: any) => ({
        id: s.id,
        title: s.title,
        recurrenceDays: s.recurrenceDays as any[],
        startDate: new Date(s.startDate).toISOString().split("T")[0],
        endDate: new Date(s.endDate).toISOString().split("T")[0],
        exercises: s.exercises.map((se: any) => ({
          exerciseId: se.exerciseId,
          repetitionsOverride: se.repetitionsOverride || "",
        })),
      }));
      setSessions(formattedSessions);
    } else {
      setErrorMsg(planRes.error || "No s'ha pogut carregar el pla");
    }

    if (exRes.success && exRes.data) {
      setLibraryExercises(exRes.data as Exercise[]);
    }

    setLoading(false);
  };

  const handleAddSession = () => {
    const newSession: SessionForm = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: `Nova Sessió ${sessions.length + 1}`,
      recurrenceDays: ["MON", "WED", "FRI"],
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // +30 days
      exercises: [],
    };
    setSessions([...sessions, newSession]);
  };

  const handleRemoveSession = (sIndex: number) => {
    setSessions(sessions.filter((_, i) => i !== sIndex));
  };

  const handleUpdateSessionField = (sIndex: number, field: keyof SessionForm, value: any) => {
    setSessions(
      sessions.map((s, i) => (i === sIndex ? { ...s, [field]: value } : s))
    );
  };

  const handleToggleDay = (sIndex: number, day: any) => {
    const session = sessions[sIndex];
    const isChecked = session.recurrenceDays.includes(day);
    const newDays = isChecked
      ? session.recurrenceDays.filter((d) => d !== day)
      : [...session.recurrenceDays, day];
    handleUpdateSessionField(sIndex, "recurrenceDays", newDays);
  };

  const handleAddExerciseToSession = (sIndex: number, exerciseId: string) => {
    if (!exerciseId) return;
    const session = sessions[sIndex];
    // Check if already in session to avoid duplicates
    if (session.exercises.some((e) => e.exerciseId === exerciseId)) return;

    const updatedExercises = [...session.exercises, { exerciseId, repetitionsOverride: "" }];
    handleUpdateSessionField(sIndex, "exercises", updatedExercises);
  };

  const handleRemoveExerciseFromSession = (sIndex: number, exIndex: number) => {
    const session = sessions[sIndex];
    const updatedExercises = session.exercises.filter((_, i) => i !== exIndex);
    handleUpdateSessionField(sIndex, "exercises", updatedExercises);
  };

  const handleUpdateRepOverride = (sIndex: number, exIndex: number, val: string) => {
    const session = sessions[sIndex];
    const updatedExercises = session.exercises.map((e, i) =>
      i === exIndex ? { ...e, repetitionsOverride: val } : e
    );
    handleUpdateSessionField(sIndex, "exercises", updatedExercises);
  };

  const handleMoveExercise = (sIndex: number, exIndex: number, direction: "up" | "down") => {
    const session = sessions[sIndex];
    const updated = [...session.exercises];
    const targetIndex = direction === "up" ? exIndex - 1 : exIndex + 1;

    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[exIndex];
    updated[exIndex] = updated[targetIndex];
    updated[targetIndex] = temp;

    handleUpdateSessionField(sIndex, "exercises", updated);
  };

  const handleSave = async () => {
    if (!planTitle.trim()) {
      setErrorMsg("El títol del pla és obligatori.");
      return;
    }

    // Basic session validation
    for (const s of sessions) {
      if (!s.title.trim()) {
        setErrorMsg("Totes les sessions han de tenir un títol.");
        return;
      }
      if (s.recurrenceDays.length === 0) {
        setErrorMsg(`La sessió "${s.title}" ha de tenir almenys un dia de recurrència.`);
        return;
      }
      if (s.exercises.length === 0) {
        setErrorMsg(`La sessió "${s.title}" ha de tenir almenys un exercici.`);
        return;
      }
    }

    setSaving(true);
    setErrorMsg("");

    const payload = {
      title: planTitle,
      description: planDescription || null,
      sessions: sessions.map((s) => ({
        title: s.title,
        order: 0, // Calculated on server
        recurrenceDays: s.recurrenceDays,
        startDate: new Date(s.startDate),
        endDate: new Date(s.endDate),
        exercises: s.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          order: 0,
          repetitionsOverride: e.repetitionsOverride || null,
        })),
      })),
    };

    const res = await updateTrainingPlan(id, payload);
    if (res.success) {
      router.push("/trainer/training-plans");
    } else {
      setErrorMsg(res.error || "Error al desar el pla");
    }
    setSaving(false);
  };

  const daysOfWeek: { value: any; label: string }[] = [
    { value: "MON", label: "Dilluns" },
    { value: "TUE", label: "Dimarts" },
    { value: "WED", label: "Dimecres" },
    { value: "THU", label: "Dijous" },
    { value: "FRI", label: "Divendres" },
    { value: "SAT", label: "Dissabte" },
    { value: "SUN", label: "Diumenge" },
  ];

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <PageContainer className="py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="text-sm breadcrumbs">
            <ul>
              <li><Link href="/trainer/training-plans">Plans de prep física</Link></li>
              <li className="font-semibold text-primary">Dissenyador de plan</li>
            </ul>
          </div>
          <h1 className="text-3xl font-bold mt-2">Dissenyant: {planTitle || "Carregant..."}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/trainer/training-plans" className="btn btn-outline">
            {t("common.cancel") || "Cancel·lar"}
          </Link>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Desant..." : t("common.save") || "Desar Plan"}
          </button>
        </div>
      </div>

      {errorMsg && <div className="alert alert-error mb-6">{errorMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left pane: metadata */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card bg-base-100 shadow border border-base-200 p-6">
            <h2 className="text-xl font-bold text-secondary mb-4">Detalls generals del Plan</h2>
            <div className="form-control mb-4">
              <label className="label font-medium">Títol del Plan</label>
              <input
                type="text"
                className="input input-bordered"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label font-medium">Descripció o objectiu del Plan</label>
              <textarea
                className="textarea textarea-bordered h-24 text-sm"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Ex. Increment de força explosiva per pretemporada."
              />
            </div>
          </div>

          <div className="card bg-base-100 shadow border border-base-200 p-6">
            <h2 className="text-lg font-bold text-secondary mb-2">Com funciona el constructor?</h2>
            <ul className="text-xs space-y-2 text-base-content/75 list-disc pl-4">
              <li>Crea sessions d'entrenament amb dies setmanals i rang de vigència.</li>
              <li>Afegeix exercicis de la teva biblioteca a cada sessió.</li>
              <li>Pots ordenar els exercicis dins de cada sessió amb les fletxes (▲/▼).</li>
              <li>Si ho necessites, pots escriure un nombre de repeticions diferent per a aquest plan (ex. carregar un exercici de 3x10 però fer-lo 4x10).</li>
            </ul>
          </div>
        </div>

        {/* Right pane: sessions list */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-secondary">Sessions del Plan ({sessions.length})</h2>
            <button className="btn btn-outline btn-accent btn-sm" onClick={handleAddSession}>
              + Afegir Sessió
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="card bg-base-100 shadow border border-base-200 p-10 text-center">
              <p className="text-base-content/50">Encara no has afegit cap sessió a aquest plan d'entrenament.</p>
              <button className="btn btn-primary btn-sm mt-4 mx-auto block" onClick={handleAddSession}>
                + Crear primera sessió
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {sessions.map((session, sIndex) => (
                <div key={session.id} className="card bg-base-100 shadow border border-base-200 overflow-hidden">
                  <div className="bg-base-200 px-6 py-4 flex justify-between items-center border-b border-base-200">
                    <div className="flex-1 mr-4">
                      <input
                        type="text"
                        className="input input-sm input-ghost font-bold text-lg w-full bg-transparent border-0 focus:bg-base-100 focus:outline-none"
                        value={session.title}
                        onChange={(e) => handleUpdateSessionField(sIndex, "title", e.target.value)}
                        placeholder="Títol de la sessió"
                      />
                    </div>
                    <button className="btn btn-xs btn-error btn-outline" onClick={() => handleRemoveSession(sIndex)}>
                      Eliminar Sessió
                    </button>
                  </div>

                  <div className="card-body p-6 space-y-4">
                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label font-medium text-xs">Data d'inici</label>
                        <input
                          type="date"
                          className="input input-sm input-bordered"
                          value={session.startDate}
                          onChange={(e) => handleUpdateSessionField(sIndex, "startDate", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-control">
                        <label className="label font-medium text-xs">Data de finalització</label>
                        <input
                          type="date"
                          className="input input-sm input-bordered"
                          value={session.endDate}
                          onChange={(e) => handleUpdateSessionField(sIndex, "endDate", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Recurrence days */}
                    <div>
                      <label className="label font-medium text-xs pb-1">Dies de repetició setmanal</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {daysOfWeek.map((day) => {
                          const isChecked = session.recurrenceDays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              className={`btn btn-xs font-semibold rounded-full ${
                                isChecked ? "btn-accent" : "btn-outline btn-neutral"
                              }`}
                              onClick={() => handleToggleDay(sIndex, day.value)}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Exercises Selection */}
                    <div className="divider text-xs font-bold text-base-content/50">Exercicis de la sessió</div>

                    {session.exercises.length === 0 ? (
                      <p className="text-sm text-base-content/40 text-center py-4">No s'han seleccionat exercicis.</p>
                    ) : (
                      <div className="space-y-3">
                        {session.exercises.map((se, exIndex) => {
                          const libraryEx = libraryExercises.find((le) => le.id === se.exerciseId);
                          if (!libraryEx) return null;

                          return (
                            <div
                              key={se.exerciseId}
                              className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border border-base-200 bg-base-50/50 gap-4"
                            >
                              <div className="flex items-center gap-3">
                                {/* Up/Down order controls */}
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-ghost btn-square"
                                    onClick={() => handleMoveExercise(sIndex, exIndex, "up")}
                                    disabled={exIndex === 0}
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-ghost btn-square"
                                    onClick={() => handleMoveExercise(sIndex, exIndex, "down")}
                                    disabled={exIndex === session.exercises.length - 1}
                                  >
                                    ▼
                                  </button>
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-secondary">{libraryEx.title}</h4>
                                  <p className="text-xs text-base-content/50">Original: {libraryEx.repetitions}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 justify-end flex-wrap md:flex-nowrap">
                                <div className="form-control">
                                  <input
                                    type="text"
                                    className="input input-xs input-bordered w-32"
                                    placeholder="Sobreescriure reps"
                                    value={se.repetitionsOverride}
                                    onChange={(e) => handleUpdateRepOverride(sIndex, exIndex, e.target.value)}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-error btn-square btn-outline"
                                  onClick={() => handleRemoveExerciseFromSession(sIndex, exIndex)}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add exercise control */}
                    <div className="form-control w-full md:max-w-xs mt-4">
                      <select
                        className="select select-bordered select-sm text-xs"
                        defaultValue=""
                        onChange={(e) => {
                          handleAddExerciseToSession(sIndex, e.target.value);
                          e.target.value = ""; // Reset select
                        }}
                      >
                        <option value="" disabled>+ Afegeix un exercici de la biblioteca...</option>
                        {libraryExercises
                          .filter((le) => !session.exercises.some((e) => e.exerciseId === le.id))
                          .map((le) => (
                            <option key={le.id} value={le.id}>
                              {le.title} ({le.repetitions})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
