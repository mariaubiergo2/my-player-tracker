"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

interface MatchCardProps {
  match: {
    id: string;
    name: string;
    description?: string | null;
    location?: string | null;
    date: string | Date;
    startTime?: string | null;
    endTime?: string | null;
    opponent?: string | null;
    matchType?: string | null;
    status: string;
    mark?: number | null;
    intensity?: number | null;
    attitude?: number | null;
    performance?: number | null;
    goals?: number;
    assists?: number;
    minutesPlayed?: number;
    comment?: string | null;
    trainerFeedback?: string | null;
    playerReflection?: string | null;
    strengths?: string[];
    weaknesses?: string[];
    improvementAreas?: string[];
    offensiveActionsOwnHalf?: string | null;
    offensiveActionsOpponentHalf?: string | null;
    defensiveActionsOwnHalf?: string | null;
    defensiveActionsOpponentHalf?: string | null;
    isReviewed: boolean;
  };
  role: "PLAYER" | "TRAINER";
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export default function MatchCard({
  match,
  role,
  isExpanded,
  onToggleExpand,
  onDelete,
  isDeleting = false,
}: MatchCardProps) {
  const { t } = useTranslation();

  const matchDateFormatted = new Date(match.date).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const getMatchTypeBadge = (type: string | null | undefined) => {
    if (!type) return null;
    const typeUpper = type.toUpperCase();
    let displayType = type;
    if (typeUpper === "LEAGUE") displayType = t("common.type_league");
    else if (typeUpper === "CUP") displayType = t("common.type_cup");
    else if (typeUpper === "FRIENDLY") displayType = t("common.type_friendly");
    else if (typeUpper === "TRAINING") displayType = t("common.type_training");

    switch (typeUpper) {
      case "LEAGUE":
        return <span className="badge badge-primary badge-sm font-semibold">{displayType}</span>;
      case "CUP":
        return <span className="badge badge-secondary badge-sm font-semibold">{displayType}</span>;
      case "FRIENDLY":
        return <span className="badge badge-accent badge-sm font-semibold">{displayType}</span>;
      case "TRAINING":
        return <span className="badge badge-info badge-sm font-semibold text-white">{displayType}</span>;
      default:
        return <span className="badge badge-ghost badge-sm">{displayType}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    let displayStatus = status;
    if (statusUpper === "COMPLETED") displayStatus = t("common.status_completed");
    else if (statusUpper === "SCHEDULED") displayStatus = t("common.status_scheduled");
    else if (statusUpper === "CANCELLED") displayStatus = t("common.status_cancelled");

    switch (statusUpper) {
      case "COMPLETED":
        return <span className="badge badge-success badge-sm font-semibold text-white">{displayStatus}</span>;
      case "SCHEDULED":
        return <span className="badge badge-warning badge-sm font-semibold">{displayStatus}</span>;
      case "CANCELLED":
        return <span className="badge badge-error badge-sm font-semibold text-white">{displayStatus}</span>;
      default:
        return <span className="badge badge-ghost badge-sm">{displayStatus}</span>;
    }
  };

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-all border border-base-200 overflow-hidden">
      {/* Match Header (Always visible) */}
      <div className="card-body p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 cursor-pointer" onClick={onToggleExpand}>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {role === "PLAYER" ? (
                <Link href={`/matches/${match.id}`} className="flex-1 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                  <h4 className="font-extrabold text-lg hover:text-primary transition-colors inline-block">
                    {match.name}
                  </h4>
                </Link>
              ) : (
                <h4 className="font-extrabold text-lg hover:text-primary transition-colors">
                  {match.name}
                </h4>
              )}
              {getMatchTypeBadge(match.matchType)}
              {getStatusBadge(match.status)}
              {match.isReviewed && (
                <span className="badge badge-success badge-sm font-semibold text-white">
                  {t("match_details.reviewed_badge")}
                </span>
              )}
            </div>
            <div className="text-xs text-base-content/60 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>📅 {matchDateFormatted} {match.startTime ? `@ ${match.startTime}` : ""}</span>
              {match.location && <span>📍 {match.location}</span>}
              {match.opponent && <span>⚔️ vs {match.opponent}</span>}
            </div>
          </div>

          <div className="flex items-center gap-4 justify-between md:justify-end">
            {match.mark != null && (
              <div className="stat-value text-xl font-black bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
                {match.mark} <span className="text-xs font-normal text-base-content/60">/10</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {role === "PLAYER" ? (
                <>
                  <Link
                    href={`/matches/${match.id}/edit`}
                    className="btn btn-ghost btn-sm text-primary hover:bg-primary/10"
                  >
                    {t("dashboard_page.edit_btn")}
                  </Link>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(match.id)}
                      className="btn btn-error btn-sm btn-outline"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        t("dashboard_page.delete_btn")
                      )}
                    </button>
                  )}
                </>
              ) : (
                <Link
                  href={`/matches/${match.id}/edit`}
                  className="btn btn-ghost btn-sm text-primary hover:bg-primary/10 font-medium"
                >
                  {t("trainer_my_players.edit_feedback")}
                </Link>
              )}
              <button
                onClick={onToggleExpand}
                className="btn btn-ghost btn-sm font-bold text-lg"
                aria-label={isExpanded ? "Collapse match details" : "Expand match details"}
              >
                {isExpanded ? "▲" : "▼"}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Match Details Section */}
        {isExpanded && (
          <div className="mt-5 border-t border-base-200 pt-5 space-y-6 animate-slide-down">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-base-200/50 rounded-xl p-3 text-center border border-base-content/5">
                <div className="text-xs text-base-content/60 font-semibold mb-0.5">{t("common.goals")}</div>
                <div className="text-xl font-bold text-primary">{match.goals ?? 0}</div>
              </div>
              <div className="bg-base-200/50 rounded-xl p-3 text-center border border-base-content/5">
                <div className="text-xs text-base-content/60 font-semibold mb-0.5">{t("common.assists")}</div>
                <div className="text-xl font-bold text-primary">{match.assists ?? 0}</div>
              </div>
              <div className="bg-base-200/50 rounded-xl p-3 text-center border border-base-content/5">
                <div className="text-xs text-base-content/60 font-semibold mb-0.5">{t("common.minutes")}</div>
                <div className="text-xl font-bold text-primary">
                  {match.minutesPlayed ?? 0} {t("common.minutes").toLowerCase()}
                </div>
              </div>
              <div className="bg-base-200/50 rounded-xl p-3 text-center border border-base-content/5">
                <div className="text-xs text-base-content/60 font-semibold mb-0.5">
                  {t("common.location")} & {t("common.time").toLowerCase()}
                </div>
                <div className="text-sm font-medium truncate">
                  {match.location || "N/A"}
                  <br />
                  {match.startTime || "N/A"}
                </div>
              </div>
            </div>

            {/* Ratings Matrix */}
            <div className="bg-base-200/20 rounded-2xl p-4 border border-base-200">
              <div className="font-bold text-sm mb-3 text-base-content/80">
                {t("trainer_my_players.scorecard_title")}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xs text-base-content/60">{t("trainer_my_players.overall_rating")}</div>
                  <div className="text-lg font-bold text-secondary">
                    {match.performance ?? "-"} <span className="text-xs font-normal">/10</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-base-content/60">{t("trainer_my_players.intensity_level")}</div>
                  <div className="text-lg font-bold text-secondary">
                    {match.intensity ?? "-"} <span className="text-xs font-normal">/10</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-base-content/60">{t("trainer_my_players.attitude_focus")}</div>
                  <div className="text-lg font-bold text-secondary">
                    {match.attitude ?? "-"} <span className="text-xs font-normal">/10</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-base-content/60">{t("common.mark")}</div>
                  <div className="text-lg font-bold text-secondary">
                    {match.mark ?? "-"} <span className="text-xs font-normal">/10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Commentary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card bg-base-200/30 p-4 border border-base-content/5">
                <div className="font-bold text-xs text-base-content/60 mb-2 uppercase tracking-wide">
                  {t("trainer_my_players.player_reflections")}
                </div>
                <p className="text-sm text-base-content/85 whitespace-pre-line italic">
                  &ldquo;{match.playerReflection || t("trainer_my_players.no_reflections")}&rdquo;
                </p>
              </div>
              <div className="card bg-base-200/30 p-4 border border-base-content/5">
                <div className="font-bold text-xs text-base-content/60 mb-2 uppercase tracking-wide">
                  {t("trainer_my_players.match_notes")}
                </div>
                <p className="text-sm text-base-content/85 whitespace-pre-line">
                  {match.comment || t("trainer_my_players.no_general_notes")}
                </p>
              </div>
              <div className="card bg-base-200/30 p-4 border border-base-content/5">
                <div className="font-bold text-xs text-base-content/60 mb-2 uppercase tracking-wide">
                  {t("trainer_my_players.trainer_feedback")}
                </div>
                <p className="text-sm text-base-content/85 whitespace-pre-line font-medium">
                  {match.trainerFeedback || t("trainer_my_players.no_trainer_feedback")}
                </p>
              </div>
            </div>

            {/* Tactical Actions Grid */}
            <div className="bg-base-200/20 rounded-2xl p-4 border border-base-200">
              <div className="font-bold text-sm mb-3 text-base-content/80 text-center md:text-left">
                {t("match_form.tactical_actions_section")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-base-100 p-3 rounded-lg border border-base-content/5">
                  <div className="text-xs text-base-content/60 font-semibold mb-1">
                    {t("match_form.offensive_actions_own_half")}
                  </div>
                  <p className="text-sm font-medium text-base-content/85">
                    {match.offensiveActionsOwnHalf || t("match_details.no_feedback")}
                  </p>
                </div>
                <div className="bg-base-100 p-3 rounded-lg border border-base-content/5">
                  <div className="text-xs text-base-content/60 font-semibold mb-1">
                    {t("match_form.offensive_actions_opponent_half")}
                  </div>
                  <p className="text-sm font-medium text-base-content/85">
                    {match.offensiveActionsOpponentHalf || t("match_details.no_feedback")}
                  </p>
                </div>
                <div className="bg-base-100 p-3 rounded-lg border border-base-content/5">
                  <div className="text-xs text-base-content/60 font-semibold mb-1">
                    {t("match_form.defensive_actions_own_half")}
                  </div>
                  <p className="text-sm font-medium text-base-content/85">
                    {match.defensiveActionsOwnHalf || t("match_details.no_feedback")}
                  </p>
                </div>
                <div className="bg-base-100 p-3 rounded-lg border border-base-content/5">
                  <div className="text-xs text-base-content/60 font-semibold mb-1">
                    {t("match_form.defensive_actions_opponent_half")}
                  </div>
                  <p className="text-sm font-medium text-base-content/85">
                    {match.defensiveActionsOpponentHalf || t("match_details.no_feedback")}
                  </p>
                </div>
              </div>
            </div>

            {/* Bullet Lists (Strengths, Weaknesses, Improvement) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="font-bold text-xs text-success uppercase tracking-wide">
                  {t("trainer_my_players.key_strengths")}
                </div>
                {match.strengths && match.strengths.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1">
                    {match.strengths.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-base-content/40 italic">{t("trainer_my_players.none_logged")}</div>
                )}
              </div>

              <div className="space-y-2">
                <div className="font-bold text-xs text-error uppercase tracking-wide">
                  {t("trainer_my_players.weaknesses")}
                </div>
                {match.weaknesses && match.weaknesses.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1">
                    {match.weaknesses.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-base-content/40 italic">{t("trainer_my_players.none_logged")}</div>
                )}
              </div>

              <div className="space-y-2">
                <div className="font-bold text-xs text-info uppercase tracking-wide">
                  {t("trainer_my_players.improvement_areas")}
                </div>
                {match.improvementAreas && match.improvementAreas.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1">
                    {match.improvementAreas.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-base-content/40 italic">{t("trainer_my_players.none_logged")}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
