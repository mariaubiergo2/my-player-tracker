"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPhysicalPrepStats } from "@/actions/training-plans";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";

export default function PhysicalPrepDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<{
    exerciseCount: number;
    planAssignmentCount: number;
    pendingFeedbackCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getPhysicalPrepStats();
        if (res.success && res.stats) {
          setStats(res.stats);
        } else {
          setError(res.error || "Failed to load stats");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <PageContainer className="py-10 animate-fade-in">
      {/* Title */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t("header.physical_prep")}
        </h1>
        <p className="text-base-content/70 mt-2 max-w-2xl leading-relaxed">
          {t("physical_prep_page.trainer_desc")}
        </p>
      </div>

      {error && (
        <div className="alert alert-error shadow-lg mb-6 border border-error/20">
          <div>
            <span>❌ {error}</span>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Exercises Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
          <div className="card-body p-8 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-4xl p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">🏋️‍♂️</span>
                {loading ? (
                  <div className="skeleton w-12 h-8 rounded-lg"></div>
                ) : (
                  <div className="text-4xl font-black text-primary">
                    {stats?.exerciseCount ?? 0}
                  </div>
                )}
              </div>
              <h2 className="card-title text-2xl font-bold text-base-content mt-6">
                {t("header.exercises")}
              </h2>
              <p className="text-sm text-base-content/60 leading-relaxed mt-2">
                {t("physical_prep_page.exercises_card_desc")}
              </p>
            </div>
            <div className="card-actions justify-end mt-8">
              <Link
                href="/trainer/exercises"
                className="btn btn-primary btn-md rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 w-full md:w-auto"
              >
                {t("common.save") ? "Gestionar" : "Manage"} &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Plans Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
          <div className="card-body p-8 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-4xl p-3 bg-secondary/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">📅</span>
                {loading ? (
                  <div className="skeleton w-12 h-8 rounded-lg"></div>
                ) : (
                  <div className="text-4xl font-black text-secondary">
                    {stats?.planAssignmentCount ?? 0}
                  </div>
                )}
              </div>
              <h2 className="card-title text-2xl font-bold text-base-content mt-6">
                {t("header.training_plans")}
              </h2>
              <p className="text-sm text-base-content/60 leading-relaxed mt-2">
                {t("physical_prep_page.plans_card_desc")}
              </p>
            </div>
            <div className="card-actions justify-end mt-8">
              <Link
                href="/trainer/training-plans"
                className="btn btn-secondary btn-md rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 w-full md:w-auto text-secondary-content"
              >
                {t("common.save") ? "Gestionar" : "Manage"} &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Feedback Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
          <div className="card-body p-8 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-4xl p-3 bg-accent/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">📬</span>
                {loading ? (
                  <div className="skeleton w-12 h-8 rounded-lg"></div>
                ) : (
                  <div className="text-4xl font-black text-accent">
                    {stats?.pendingFeedbackCount ?? 0}
                  </div>
                )}
              </div>
              <h2 className="card-title text-2xl font-bold text-base-content mt-6">
                {t("header.training_feedback")}
              </h2>
              <p className="text-sm text-base-content/60 leading-relaxed mt-2">
                {t("physical_prep_page.feedback_card_desc")}
              </p>
            </div>
            <div className="card-actions justify-end mt-8">
              <Link
                href="/trainer/training-feedback"
                className="btn btn-accent btn-md rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 w-full md:w-auto text-accent-content"
              >
                {t("common.save") ? "Gestionar" : "Manage"} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
