"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import { getPlayerActivePlans } from "@/actions/training-plans";
import { getActiveObjectives, getObjectivesHistory } from "@/actions/objectives";
import { getAssignmentsByPlayer } from "@/actions/questionnaires";
import { QuestionnaireType } from "@prisma/client";
import SegmentedTabs from "@/components/ui/SegmentedTabs";

interface Exercise {
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

interface TrainingSession {
  id: string;
  title: string;
  recurrenceDays: string[];
  startDate: string;
  endDate: string;
  exercises: Exercise[];
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

  // Tabs for the page
  const [activeTab, setActiveTab] = useState<"checklist" | "objectives" | "questionnaires">("checklist");

  // Calendar states
  const [viewMode, setViewMode] = useState<"month" | "week" >("week");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Load state from URL parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlViewMode = params.get("viewMode");
      const urlViewDate = params.get("viewDate");

      if (urlViewMode === "month" || urlViewMode === "week") {
        setViewMode(urlViewMode);
      }
      if (urlViewDate) {
        const parsedDate = new Date(urlViewDate);
        if (!isNaN(parsedDate.getTime())) {
          setCurrentDate(parsedDate);
        }
      }
    }
  }, []);

  const updateUrl = (mode: "month" | "week", date: Date) => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("viewMode", mode);
      url.searchParams.set("viewDate", date.toISOString());
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleSetViewMode = (mode: "month" | "week") => {
    setViewMode(mode);
    updateUrl(mode, currentDate);
  };

  const handleSetCurrentDate = (date: Date) => {
    setCurrentDate(date);
    updateUrl(viewMode, date);
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role === "ADMIN") {
        router.push("/admin/users");
      } else if (user?.role === "TRAINER") {
        router.push("/trainer/players/my-players");
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
        getActiveObjectives(user.id, "PHYSICAL"),
        getObjectivesHistory(user.id, "PHYSICAL"),
        getAssignmentsByPlayer(user.id, "PHYSICAL"),
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
        setQuestionnaires(questRes.pending);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Get standard 42 days grid for Month view
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    
    // In Spain/Catalonia, Monday is the first day of the week
    const leadingDaysCount = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startCalendarDate = new Date(firstDayOfMonth);
    startCalendarDate.setDate(firstDayOfMonth.getDate() - leadingDaysCount);
    
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startCalendarDate);
      d.setDate(startCalendarDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Helper: Get 7 days for Week view
  const getWeekDaysForDate = (date: Date) => {
    const day = date.getDay();
    const distanceToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const visibleDays = viewMode === "month" ? getMonthDays(currentDate) : getWeekDaysForDate(currentDate);
  const rangeStart = visibleDays[0];
  const rangeEnd = visibleDays[visibleDays.length - 1];

  // Helper: Calculate occurrences for a session during a date range
  const getOccurrencesInRange = (session: TrainingSession, start: Date, end: Date) => {
    const occurrences: {
      date: Date;
      session: TrainingSession;
      isCompleted: boolean;
      state: "pending" | "completed" | "feedback_sent" | "feedback_reviewed";
    }[] = [];

    const sessionStart = new Date(session.startDate);
    const sessionEnd = new Date(session.endDate);
    sessionStart.setHours(0, 0, 0, 0);
    sessionEnd.setHours(23, 59, 59, 999);

    const dayKeys = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    const current = new Date(start);
    current.setHours(0, 0, 0, 0);

    const rangeEndLimit = new Date(end);
    rangeEndLimit.setHours(23, 59, 59, 999);

    while (current <= rangeEndLimit) {
      if (current >= sessionStart && current <= sessionEnd) {
        const dayOfWeekKey = dayKeys[current.getDay()];
        if (session.recurrenceDays.includes(dayOfWeekKey)) {
          const occDate = new Date(current);
          const dateStr = occDate.toDateString();

          const isCompleted = session.completions.some(
            (c) => new Date(c.scheduledDate).toDateString() === dateStr
          );

          // Find feedback near occurrence date (within 1 day)
          const sessionFeedback = session.feedback.find((f) => {
            const fbDate = new Date(f.createdAt);
            const diffTime = Math.abs(fbDate.getTime() - occDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 1;
          });

          let state: "pending" | "completed" | "feedback_sent" | "feedback_reviewed" = "pending";
          if (sessionFeedback) {
            state = sessionFeedback.isReviewed ? "feedback_reviewed" : "feedback_sent";
          } else if (isCompleted) {
            state = "completed";
          }

          occurrences.push({
            date: occDate,
            session,
            isCompleted,
            state,
          });
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return occurrences;
  };

  const allOccurrences = assignments.flatMap((assignment) =>
    assignment.trainingPlan.sessions.flatMap((session) =>
      getOccurrencesInRange(session, rangeStart, rangeEnd)
    )
  );

  const completedCount = allOccurrences.filter((o) => o.isCompleted).length;
  const totalCount = allOccurrences.length;

  const handlePrev = () => {
    if (viewMode === "month") {
      const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      handleSetCurrentDate(nextDate);
    } else {
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() - 7);
      handleSetCurrentDate(nextDate);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      handleSetCurrentDate(nextDate);
    } else {
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 7);
      handleSetCurrentDate(nextDate);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const monthLabel = currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <PageContainer className="py-10 animate-fade-in">
      {/* Header banner */}
      <div className="mb-8 flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            {t("physical_prep_page.title") || "Preparació Física"}
          </h1>
          <p className="text-base-content/70 mt-2 font-medium">
            {t("physical_prep_page.subtitle") || "Controla els teus entrenaments setmanals i segueix els consells de l'entrenador."}
          </p>
        </div>

        {/* Tab Selector */}
        <SegmentedTabs
          tabs={[
            { id: "checklist", label: `📅 ${t("physical_prep_page.session_checklist") || "Calendari"}` },
            { id: "objectives", label: `🎯 ${t("physical_prep_page.objectives_title") || "Objectius"}` },
            { id: "questionnaires", label: `📝 ${t("questionnaires.title")} (${questionnaires.length})` },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="shadow-sm bg-base-100 border border-base-200"
        />
      </div>

      {activeTab === "checklist" && (
        <div className="space-y-8">
          {/* Progress Summary & Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-base-100 p-6 rounded-3xl border border-base-200 shadow-md items-center">
            {/* Progress widget */}
            <div className="md:col-span-6 flex items-center gap-4">
              <div className="radial-progress text-primary font-black" style={{ "--value": totalCount > 0 ? (completedCount / totalCount) * 100 : 0, "--size": "3.5rem" } as any} role="progressbar">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </div>
              <div>
                <h3 className="font-extrabold text-base-content text-lg">
                  {t("physical_prep_page.progress_title")}
                </h3>
                <p className="text-sm text-base-content/65 font-medium mt-0.5">
                  {t("physical_prep_page.completed_stat")
                    .replace("{completed}", String(completedCount))
                    .replace("{total}", String(totalCount))}
                </p>
              </div>
            </div>

            {/* Toggle Mode */}
            <div className="md:col-span-6 flex justify-end gap-3">
              <div className="join border border-base-200 shadow-inner bg-base-50 p-0.5 rounded-xl">
                <button
                  onClick={() => handleSetViewMode("week")}
                  className={`btn btn-xs join-item font-bold px-4 rounded-lg border-none ${
                    viewMode === "week" ? "bg-primary text-primary-content shadow-sm" : "btn-ghost"
                  }`}
                >
                  {t("physical_prep_page.toggle_week")}
                </button>
                <button
                  onClick={() => handleSetViewMode("month")}
                  className={`btn btn-xs join-item font-bold px-4 rounded-lg border-none ${
                    viewMode === "month" ? "bg-primary text-primary-content shadow-sm" : "btn-ghost"
                  }`}
                >
                  {t("physical_prep_page.toggle_month")}
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Header / Navigator */}
          <div className="flex justify-between items-center bg-base-100 p-4 rounded-2xl border border-base-200 shadow-md">
            <button className="btn btn-sm btn-outline btn-secondary rounded-xl font-bold" onClick={handlePrev}>
              &larr; {viewMode === "month" ? "Mes ant." : "Setm. ant."}
            </button>
            <div className="text-center font-black text-secondary text-lg capitalize">
              {viewMode === "month"
                ? monthLabel
                : `Setmana del ${rangeStart.toLocaleDateString()} al ${rangeEnd.toLocaleDateString()}`}
            </div>
            <button className="btn btn-sm btn-outline btn-secondary rounded-xl font-bold" onClick={handleNext}>
              {viewMode === "month" ? "Mes seg." : "Setm. seg."} &rarr;
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="card bg-base-100 shadow border border-base-200 p-10 text-center rounded-3xl">
              <p className="text-base-content/50 font-medium">
                No tens cap pla de preparació física actiu o assignat en aquest moment.
              </p>
            </div>
          ) : (
            /* Calendar Grid */
            <div className="card bg-base-100 border border-base-200 shadow-xl rounded-3xl overflow-hidden p-4 md:p-6">
              {/* Day names */}
              <div className="grid grid-cols-7 text-center font-bold text-xs text-base-content/50 pb-4 border-b border-base-200 uppercase tracking-wider">
                <div>dl</div>
                <div>dt</div>
                <div>dc</div>
                <div>dj</div>
                <div>dv</div>
                <div>ds</div>
                <div>dg</div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-7 gap-1 md:gap-3 mt-4">
                {visibleDays.map((day, idx) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();

                  // Filter occurrences for this day
                  const dayOccurrences = allOccurrences.filter(
                    (o) => o.date.toDateString() === day.toDateString()
                  );

                  return (
                    <div
                      key={idx}
                      className={`min-h-[90px] md:min-h-[120px] p-1.5 md:p-3 border rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                        isToday
                          ? "border-primary bg-primary/5 shadow-inner"
                          : "border-base-100 bg-base-50/20"
                      } ${!isCurrentMonth && viewMode === "month" ? "opacity-35" : ""}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs md:text-sm font-extrabold ${isToday ? "text-primary" : "text-base-content/75"}`}>
                          {day.getDate()}
                        </span>
                        {isToday && (
                          <span className="badge badge-primary badge-xs font-bold text-[9px] px-1 md:px-1.5 uppercase">
                            {t("physical_prep_page.today")}
                          </span>
                        )}
                      </div>

                      {/* Occurrences list */}
                      <div className="flex-1 flex flex-col gap-1.5 justify-end mt-2">
                        {dayOccurrences.map((occ, oIdx) => {
                          let badgeClass = "bg-base-200 text-base-content/85";
                          let stateLabel = t("physical_prep_page.pending");

                          if (occ.state === "feedback_reviewed") {
                            badgeClass = "bg-success/20 text-success border border-success/30";
                            stateLabel = `✓✓ ${t("physical_prep_page.feedback_reviewed")}`;
                          } else if (occ.state === "feedback_sent") {
                            badgeClass = "bg-warning/20 text-warning border border-warning/30";
                            stateLabel = t("physical_prep_page.feedback_sent");
                          } else if (occ.state === "completed") {
                            badgeClass = "bg-success text-success-content font-bold";
                            stateLabel = `✓ ${t("completed")}`;
                          }

                          return (
                            <Link
                              key={oIdx}
                              href={`/dashboard/physical/sessions/${occ.session.id}?date=${occ.date.toISOString().split("T")[0]}&viewMode=${viewMode}&viewDate=${currentDate.toISOString()}`}
                              className={`text-[9px] md:text-[10px] p-1 md:p-1.5 rounded-lg truncate block font-bold text-center transition-transform hover:scale-105 active:scale-95 shadow-sm ${badgeClass}`}
                              title={`${occ.session.title} (${stateLabel})`}
                            >
                              <div className="truncate text-left">{occ.session.title}</div>
                              <div className="text-[8px] opacity-75 mt-0.5 text-left font-medium block truncate">
                                {stateLabel}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "objectives" && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow border border-base-200 p-6 rounded-3xl">
            <h2 className="text-2xl font-bold text-secondary mb-2">Objectiu Físic Actiu</h2>
            {activeObjective ? (
              <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl space-y-4">
                <p className="font-semibold text-base-content">{activeObjective.summary}</p>
                <div className="divider text-xs text-base-content/40 font-bold m-0 uppercase tracking-wider">
                  Detall de fites
                </div>
                <ul className="space-y-2">
                  {activeObjective.items.map((item: string, index: number) => (
                    <li key={index} className="flex gap-2 text-sm text-base-content/85 font-medium">
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

          <div className="card bg-base-100 shadow border border-base-200 p-6 rounded-3xl">
            <h3 className="text-xl font-bold text-secondary mb-4">Historial d'Objectius Físics</h3>
            {objectivesHistory.length <= 1 ? (
              <p className="text-sm text-base-content/50 italic">No hi ha historial disponible.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {objectivesHistory
                  .filter((o) => o.id !== activeObjective?.id)
                  .map((obj) => (
                    <div key={obj.id} className="p-4 border border-base-200 rounded-2xl text-sm bg-base-50/30">
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
        <div className="card bg-base-100 shadow border border-base-200 p-6 space-y-4 rounded-3xl">
          <h2 className="text-2xl font-bold text-secondary">Qüestionaris Físics Pendents</h2>
          {questionnaires.length === 0 ? (
            <p className="text-sm text-base-content/50 italic py-4">
              Estàs al dia! No tens cap qüestionari físic pendent de respondre.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questionnaires.map((q) => (
                <div key={q.id} className="p-4 border border-base-200 rounded-2xl bg-base-50/50 flex flex-col justify-between items-start">
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
                    className="btn btn-sm btn-primary mt-4 font-semibold w-full rounded-xl shadow"
                  >
                    Respondre Ara
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
