"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";

interface WorkoutLog {
  id: string;
  date: string;
  type: string;
  rpe: number;
  fatigue: number;
  soreness: number;
  duration: number;
}

interface PhysicalMetrics {
  vo2max: number;
  restingHr: number;
  weight: number;
  sleep: number;
}

export default function PhysicalPrepPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role === "ADMIN") {
        router.push("/admin/users");
      } else if (user?.role === "TRAINER") {
        router.push("/trainer/players");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // State for Weekly Plan Checkbox
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});

  // State for Physical Metrics
  const [metrics, setMetrics] = useState<PhysicalMetrics>({
    vo2max: 52.4,
    restingHr: 54,
    weight: 73.5,
    sleep: 7.8,
  });
  
  // State for Metric Editing Panels
  const [editingMetric, setEditingMetric] = useState<string | null>(null);
  const [metricValue, setMetricValue] = useState<string>("");

  // State for Workout Logs List
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  // State for Workout Logger Form
  const [formType, setFormType] = useState<string>("Strength");
  const [formRpe, setFormRpe] = useState<number>(6);
  const [formFatigue, setFormFatigue] = useState<number>(5);
  const [formSoreness, setFormSoreness] = useState<number>(4);
  const [formDuration, setFormDuration] = useState<number>(45);

  // Load localStorage data on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Weekly completed days
      const savedDays = localStorage.getItem("weekly_completed_days");
      if (savedDays) {
        try {
          setCompletedDays(JSON.parse(savedDays));
        } catch (e) {
          console.error(e);
        }
      }

      // 2. Physical metrics
      const savedMetrics = localStorage.getItem("physical_metrics");
      if (savedMetrics) {
        try {
          setMetrics(JSON.parse(savedMetrics));
        } catch (e) {
          console.error(e);
        }
      }

      // 3. Workout logs
      const savedLogs = localStorage.getItem("workout_logs");
      if (savedLogs) {
        try {
          setWorkoutLogs(JSON.parse(savedLogs));
        } catch (e) {
          console.error(e);
        }
      } else {
        // Seed default logs if empty
        const defaultLogs: WorkoutLog[] = [
          {
            id: "1",
            date: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toLocaleDateString(),
            type: "Cardio",
            rpe: 8,
            fatigue: 7,
            soreness: 6,
            duration: 30,
          },
          {
            id: "2",
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString(),
            type: "Strength",
            rpe: 6,
            fatigue: 5,
            soreness: 4,
            duration: 50,
          },
        ];
        setWorkoutLogs(defaultLogs);
        localStorage.setItem("workout_logs", JSON.stringify(defaultLogs));
      }
    }
  }, []);

  const handleToggleDay = (day: string) => {
    const updated = { ...completedDays, [day]: !completedDays[day] };
    setCompletedDays(updated);
    localStorage.setItem("weekly_completed_days", JSON.stringify(updated));
  };

  const handleUpdateMetric = (metricKey: keyof PhysicalMetrics) => {
    const value = parseFloat(metricValue);
    if (!isNaN(value) && value > 0) {
      const updatedMetrics = { ...metrics, [metricKey]: value };
      setMetrics(updatedMetrics);
      localStorage.setItem("physical_metrics", JSON.stringify(updatedMetrics));
      setEditingMetric(null);
      setMetricValue("");
    }
  };

  const handleAddWorkoutLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: WorkoutLog = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toLocaleDateString(),
      type: formType,
      rpe: formRpe,
      fatigue: formFatigue,
      soreness: formSoreness,
      duration: formDuration,
    };
    const updatedLogs = [newLog, ...workoutLogs];
    setWorkoutLogs(updatedLogs);
    localStorage.setItem("workout_logs", JSON.stringify(updatedLogs));
    
    // Reset form states
    setFormRpe(6);
    setFormFatigue(5);
    setFormSoreness(4);
    setFormDuration(45);
  };

  const handleDeleteLog = (id: string) => {
    const updatedLogs = workoutLogs.filter((log) => log.id !== id);
    setWorkoutLogs(updatedLogs);
    localStorage.setItem("workout_logs", JSON.stringify(updatedLogs));
  };

  // Helper translations for RPE scale descriptions
  const getRpeDescription = (rpe: number) => {
    if (rpe <= 2) return locale === "ca" ? "Molt suau" : locale === "es" ? "Muy suave" : "Very light";
    if (rpe <= 4) return locale === "ca" ? "Moderat" : locale === "es" ? "Moderado" : "Moderate";
    if (rpe <= 6) return locale === "ca" ? "Un poc dur" : locale === "es" ? "Algo duro" : "Somewhat hard";
    if (rpe <= 8) return locale === "ca" ? "Vigorós / Dur" : locale === "es" ? "Vigoroso / Duro" : "Vigorous / Hard";
    return locale === "ca" ? "Esforç Màxim" : locale === "es" ? "Esfuerzo Máximo" : "Maximum effort";
  };

  // Compute Averages
  const totalDuration = workoutLogs.reduce((acc, log) => acc + log.duration, 0);
  const avgRpe = workoutLogs.length > 0
    ? (workoutLogs.reduce((acc, log) => acc + log.rpe, 0) / workoutLogs.length).toFixed(1)
    : "0.0";
  const avgFatigue = workoutLogs.length > 0
    ? (workoutLogs.reduce((acc, log) => acc + log.fatigue, 0) / workoutLogs.length).toFixed(1)
    : "0.0";

  // Mock weekly routines schedule
  const weeklyWorkouts = [
    { key: "mon", label: locale === "ca" ? "Dilluns" : locale === "es" ? "Lunes" : "Monday", title: locale === "ca" ? "Entrenament de Força (Core & Tren Superior)" : locale === "es" ? "Entrenamiento de Fuerza (Core y Tren Superior)" : "Strength Training (Core & Upper Body)", duration: "45 min", badge: "Strength", badgeClass: "badge-primary" },
    { key: "tue", label: locale === "ca" ? "Dimarts" : locale === "es" ? "Martes" : "Tuesday", title: locale === "ca" ? "Sessió HIIT de Cardio" : locale === "es" ? "Sesión HIIT de Cardio" : "Cardio HIIT Session", duration: "30 min", badge: "Cardio", badgeClass: "badge-secondary" },
    { key: "wed", label: locale === "ca" ? "Dimecres" : locale === "es" ? "Miércoles" : "Wednesday", title: locale === "ca" ? "Exercicis d'Agilitat i Velocitat Tàctica" : locale === "es" ? "Ejercicios de Agilidad y Velocidad Táctica" : "Tactical Speed & Agility Drills", duration: "40 min", badge: "Agility", badgeClass: "badge-accent" },
    { key: "thu", label: locale === "ca" ? "Dijous" : locale === "es" ? "Jueves" : "Thursday", title: locale === "ca" ? "Recuperació Activa (Ioga i Estiraments)" : locale === "es" ? "Recuperación Activa (Yoga y Estiramientos)" : "Active Recovery (Yoga & Stretching)", duration: "30 min", badge: "Recovery", badgeClass: "badge-ghost" },
    { key: "fri", label: locale === "ca" ? "Divendres" : locale === "es" ? "Viernes" : "Friday", title: locale === "ca" ? "Entrenament de Força (Tren Inferior i Potència)" : locale === "es" ? "Entrenamiento de Fuerza (Tren Inferior y Potencia)" : "Strength Training (Lower Body & Power)", duration: "45 min", badge: "Strength", badgeClass: "badge-primary" },
    { key: "sat", label: locale === "ca" ? "Dissabte" : locale === "es" ? "Sábado" : "Saturday", title: locale === "ca" ? "Cursa d'Endurància i Ritme" : locale === "es" ? "Carrera de Resistencia y Ritmo" : "Endurance Run & Match Prep", duration: "25 min", badge: "Cardio", badgeClass: "badge-secondary" },
    { key: "sun", label: locale === "ca" ? "Diumenge" : locale === "es" ? "Domingo" : "Sunday", title: locale === "ca" ? "Descans Setmanal / Recuperació Plena" : locale === "es" ? "Descanso Semanal / Recuperación Plena" : "Weekly Rest / Full Recovery", duration: "-", badge: "Rest", badgeClass: "badge-outline" },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "PLAYER") {
    return null;
  }

  return (
    <section className="container mx-auto px-6 py-10">
      {/* Header Banner */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-primary">
          {t("physical_prep_page.title")}
        </h1>
        <p className="text-base-content/70 mt-2">
          {t("physical_prep_page.subtitle")}
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Weekly Program & Fitness Indicators */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Weekly Program Card */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold text-secondary mb-1">
                {t("physical_prep_page.weekly_plan")}
              </h2>
              <p className="text-sm text-base-content/60 mb-6">
                {t("physical_prep_page.weekly_plan_desc")}
              </p>

              <div className="space-y-4">
                {weeklyWorkouts.map((workout) => {
                  const isDone = completedDays[workout.key];
                  return (
                    <div
                      key={workout.key}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isDone
                          ? "bg-success/5 border-success/30 text-base-content/60"
                          : "bg-base-200/50 border-base-content/5"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={!!isDone}
                          onChange={() => handleToggleDay(workout.key)}
                          className="checkbox checkbox-success checkbox-md"
                        />
                        <div>
                          <p className="text-xs font-bold text-base-content/40 uppercase tracking-wide">
                            {workout.label}
                          </p>
                          <p className={`font-semibold ${isDone ? "line-through" : ""}`}>
                            {workout.title}
                          </p>
                          <span className="text-xs text-base-content/50">
                            {workout.duration}
                          </span>
                        </div>
                      </div>
                      <div className={`badge ${workout.badgeClass} badge-sm md:badge-md uppercase font-bold text-[10px]`}>
                        {workout.badge}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fitness Indicators Card */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold text-secondary mb-6">
                {t("physical_prep_page.metrics_title")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* VO2 Max Card */}
                <div className="bg-base-200/50 rounded-2xl p-5 border border-base-content/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-base-content/60 font-medium">
                        {t("physical_prep_page.vo2max")}
                      </span>
                      <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full font-bold">
                        ▲ Good
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-primary mt-2">
                      {metrics.vo2max} <span className="text-xs font-normal text-base-content/50">ml/kg/min</span>
                    </div>
                  </div>
                  {editingMetric === "vo2max" ? (
                    <div className="flex gap-2 mt-4">
                      <input
                        type="number"
                        step="0.1"
                        value={metricValue}
                        onChange={(e) => setMetricValue(e.target.value)}
                        placeholder="VO2 Max"
                        className="input input-bordered input-sm w-full"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateMetric("vo2max")} className="btn btn-primary btn-sm">
                        ✓
                      </button>
                      <button onClick={() => setEditingMetric(null)} className="btn btn-ghost btn-sm">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingMetric("vo2max");
                        setMetricValue(metrics.vo2max.toString());
                      }}
                      className="btn btn-outline btn-xs mt-4 w-fit"
                    >
                      {t("physical_prep_page.update")}
                    </button>
                  )}
                </div>

                {/* Resting Heart Rate Card */}
                <div className="bg-base-200/50 rounded-2xl p-5 border border-base-content/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-base-content/60 font-medium">
                        {t("physical_prep_page.resting_hr")}
                      </span>
                      <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full font-bold">
                        ▼ -2 bpm
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-primary mt-2">
                      {metrics.restingHr} <span className="text-xs font-normal text-base-content/50">bpm</span>
                    </div>
                  </div>
                  {editingMetric === "restingHr" ? (
                    <div className="flex gap-2 mt-4">
                      <input
                        type="number"
                        value={metricValue}
                        onChange={(e) => setMetricValue(e.target.value)}
                        placeholder="BPM"
                        className="input input-bordered input-sm w-full"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateMetric("restingHr")} className="btn btn-primary btn-sm">
                        ✓
                      </button>
                      <button onClick={() => setEditingMetric(null)} className="btn btn-ghost btn-sm">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingMetric("restingHr");
                        setMetricValue(metrics.restingHr.toString());
                      }}
                      className="btn btn-outline btn-xs mt-4 w-fit"
                    >
                      {t("physical_prep_page.update")}
                    </button>
                  )}
                </div>

                {/* Weight Card */}
                <div className="bg-base-200/50 rounded-2xl p-5 border border-base-content/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-base-content/60 font-medium">
                        {t("physical_prep_page.weight")}
                      </span>
                      <span className="text-xs text-base-content/40 bg-base-content/5 px-2 py-0.5 rounded-full font-bold">
                        Stable
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-primary mt-2">
                      {metrics.weight} <span className="text-xs font-normal text-base-content/50">kg</span>
                    </div>
                  </div>
                  {editingMetric === "weight" ? (
                    <div className="flex gap-2 mt-4">
                      <input
                        type="number"
                        step="0.1"
                        value={metricValue}
                        onChange={(e) => setMetricValue(e.target.value)}
                        placeholder="Weight (kg)"
                        className="input input-bordered input-sm w-full"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateMetric("weight")} className="btn btn-primary btn-sm">
                        ✓
                      </button>
                      <button onClick={() => setEditingMetric(null)} className="btn btn-ghost btn-sm">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingMetric("weight");
                        setMetricValue(metrics.weight.toString());
                      }}
                      className="btn btn-outline btn-xs mt-4 w-fit"
                    >
                      {t("physical_prep_page.update")}
                    </button>
                  )}
                </div>

                {/* Sleep Card */}
                <div className="bg-base-200/50 rounded-2xl p-5 border border-base-content/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-base-content/60 font-medium">
                        {t("physical_prep_page.sleep")}
                      </span>
                      <span className="text-xs text-info bg-info/10 px-2 py-0.5 rounded-full font-bold">
                        Optimal
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-primary mt-2">
                      {metrics.sleep} <span className="text-xs font-normal text-base-content/50">hours</span>
                    </div>
                  </div>
                  {editingMetric === "sleep" ? (
                    <div className="flex gap-2 mt-4">
                      <input
                        type="number"
                        step="0.1"
                        value={metricValue}
                        onChange={(e) => setMetricValue(e.target.value)}
                        placeholder="Sleep hours"
                        className="input input-bordered input-sm w-full"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateMetric("sleep")} className="btn btn-primary btn-sm">
                        ✓
                      </button>
                      <button onClick={() => setEditingMetric(null)} className="btn btn-ghost btn-sm">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingMetric("sleep");
                        setMetricValue(metrics.sleep.toString());
                      }}
                      className="btn btn-outline btn-xs mt-4 w-fit"
                    >
                      {t("physical_prep_page.update")}
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Right Side: RPE Logger Form & Recent Logs */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Summary Statistics Panel */}
          <div className="stats shadow w-full bg-base-100 border border-base-200">
            <div className="stat text-center p-4">
              <div className="stat-title text-xs font-bold uppercase">{t("physical_prep_page.stats_avg_rpe")}</div>
              <div className="stat-value text-primary text-2xl mt-1">{avgRpe}</div>
              <div className="stat-desc text-[10px]">Scale 1-10</div>
            </div>
            <div className="stat text-center p-4">
              <div className="stat-title text-xs font-bold uppercase">{t("physical_prep_page.stats_avg_fatigue")}</div>
              <div className="stat-value text-secondary text-2xl mt-1">{avgFatigue}</div>
              <div className="stat-desc text-[10px]">Fatigue Average</div>
            </div>
            <div className="stat text-center p-4">
              <div className="stat-title text-xs font-bold uppercase">{t("physical_prep_page.stats_total_time")}</div>
              <div className="stat-value text-accent text-2xl mt-1">{totalDuration}m</div>
              <div className="stat-desc text-[10px]">Minutes Trained</div>
            </div>
          </div>

          {/* RPE Workload Logger Form */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold text-secondary mb-4">
                {t("physical_prep_page.workout_logger")}
              </h2>

              <form onSubmit={handleAddWorkoutLog} className="space-y-5">
                
                {/* Workout Type */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Workout Type</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="select select-bordered w-full"
                  >
                    <option value="Strength">Strength</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Agility">Agility / Speed</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Game">Match / Game</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">{t("physical_prep_page.duration_label")}</span>
                  </label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 0)}
                    min="1"
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                {/* RPE Slider */}
                <div className="form-control">
                  <div className="flex justify-between items-center label">
                    <span className="label-text font-bold">{t("physical_prep_page.rpe_label")}</span>
                    <span className="badge badge-primary font-bold">{formRpe}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formRpe}
                    onChange={(e) => setFormRpe(parseInt(e.target.value))}
                    className="range range-primary"
                  />
                  <div className="flex justify-between text-[10px] px-1 mt-1 text-base-content/50">
                    <span>1</span>
                    <span>3</span>
                    <span>5</span>
                    <span>7</span>
                    <span>10</span>
                  </div>
                  <p className="text-xs text-primary font-semibold mt-1">
                    {getRpeDescription(formRpe)}
                  </p>
                </div>

                {/* Fatigue Slider */}
                <div className="form-control">
                  <div className="flex justify-between items-center label">
                    <span className="label-text font-bold">{t("physical_prep_page.fatigue_label")}</span>
                    <span className="badge badge-secondary font-bold">{formFatigue}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formFatigue}
                    onChange={(e) => setFormFatigue(parseInt(e.target.value))}
                    className="range range-secondary"
                  />
                  <div className="flex justify-between text-[10px] px-1 mt-1 text-base-content/50">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Soreness Slider */}
                <div className="form-control">
                  <div className="flex justify-between items-center label">
                    <span className="label-text font-bold">{t("physical_prep_page.soreness_label")}</span>
                    <span className="badge badge-accent font-bold">{formSoreness}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formSoreness}
                    onChange={(e) => setFormSoreness(parseInt(e.target.value))}
                    className="range range-accent"
                  />
                  <div className="flex justify-between text-[10px] px-1 mt-1 text-base-content/50">
                    <span>None</span>
                    <span>Mild</span>
                    <span>Severe</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn btn-primary w-full mt-4">
                  {t("physical_prep_page.log_btn")}
                </button>

              </form>
            </div>
          </div>

          {/* Recent Sessions List */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold text-secondary mb-4">
                {t("physical_prep_page.recent_logs")}
              </h2>

              {workoutLogs.length === 0 ? (
                <p className="text-sm text-base-content/60 text-center py-4">
                  {t("physical_prep_page.no_logs")}
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {workoutLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-base-200/50 rounded-xl p-3 border border-base-content/5 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-primary">{log.type}</span>
                          <span className="text-xs text-base-content/50">• {log.date}</span>
                        </div>
                        <div className="flex gap-3 text-xs text-base-content/70 mt-1">
                          <span>{log.duration} mins</span>
                          <span>RPE: <strong>{log.rpe}</strong></span>
                          <span>Fatigue: <strong>{log.fatigue}</strong></span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="btn btn-ghost btn-sm text-error hover:bg-error/15"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
