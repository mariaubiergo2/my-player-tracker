"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import {
  getNotifications,
  toggleNotificationReadState,
  markAllNotificationsAsRead,
  getNotificationPlayers,
} from "@/actions/notifications";
import { formatRelativeTime } from "@/lib/utils/dates";

interface NotificationItem {
  id: string;
  recipientId: string;
  type: "MATCH_CREATED" | "MATCH_UPDATED" | "MATCH_UPDATED_BY_TRAINER" | "FEEDBACK_MESSAGE_FROM_PLAYER" | "FEEDBACK_MESSAGE_FROM_TRAINER" | "QUESTIONNAIRE_SENT" | "QUESTIONNAIRE_RESPONDED" | "QUESTIONNAIRE_RECLAIMED";
  matchId?: string | null;
  assignmentId?: string | null;
  isRead: boolean;
  createdAt: string | Date;
  match?: {
    id: string;
    name: string;
    player: {
      id: string;
      name: string;
      surname: string;
      avatarUrl: string | null;
      trainers?: {
        id: string;
        name: string;
        surname: string;
        avatarUrl: string | null;
      }[];
    };
    trainer?: {
      id: string;
      name: string;
      surname: string;
      avatarUrl: string | null;
    } | null;
  } | null;
  assignment?: {
    id: string;
    player: {
      id: string;
      name: string;
      surname: string;
      avatarUrl: string | null;
    };
    questionnaire: {
      id: string;
      title: string;
      trainer: {
        id: string;
        name: string;
        surname: string;
        avatarUrl: string | null;
      };
    };
  } | null;
}

function NotificationsInboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [players, setPlayers] = useState<{ id: string; name: string; surname: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const limit = 20;

  // Deriving active filters, sort, and pagination state from URL search params
  const filter = (searchParams.get("status") || "all") as "all" | "unread" | "read";
  const selectedPlayerId = searchParams.get("player") || "";
  const sortBy = (searchParams.get("sort") || "date_desc") as "date_desc" | "date_asc" | "player_asc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const onlyRecent = searchParams.get("recent") !== "false";

  const isUserAuthorized =
    user?.role === "TRAINER" ||
    user?.role === "PLAYER" ||
    user?.role === "GOAL_KEEPER";

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!isUserAuthorized) {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, router, isUserAuthorized]);

  // Fetch unique players who generated notifications for this trainer
  useEffect(() => {
    if (user?.role === "TRAINER" && user?.id) {
      const fetchPlayers = async () => {
        const res = await getNotificationPlayers(user.id);
        if (res.success && res.data) {
          setPlayers(res.data);
        }
      };
      fetchPlayers();
    }
  }, [user?.id, user?.role]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await getNotifications(
        user.id,
        page,
        limit,
        filter,
        selectedPlayerId || undefined,
        sortBy,
        onlyRecent
      );
      if (res.success && res.data) {
        setNotifications(res.data as unknown as NotificationItem[]);
        setTotalCount(res.totalCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications inbox:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications when search parameters or user change
  useEffect(() => {
    if (isUserAuthorized && user?.id) {
      fetchNotifications();
    }
  }, [user?.id, page, filter, selectedPlayerId, sortBy, onlyRecent, user?.role, isUserAuthorized]);

  // Listen to custom notification update events
  useEffect(() => {
    if (!isUserAuthorized || !user?.id) return;
    const handleUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener("notifications-updated", handleUpdate);
    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [user?.role, user?.id, page, filter, selectedPlayerId, sortBy, onlyRecent, isUserAuthorized]);

  const updateParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(newParams)) {
      if (value === "" || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    router.replace(`/notifications?${params.toString()}`);
  };

  const handleToggleReadState = (id: string, isRead: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead } : n))
    );

    startTransition(async () => {
      await toggleNotificationReadState(id, isRead);
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    });
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );

      startTransition(async () => {
        await toggleNotificationReadState(id, true);
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      });
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?.id) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    startTransition(async () => {
      await markAllNotificationsAsRead(user.id);
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    });
  };

  if (isLoading || !isUserAuthorized) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const hasNextPage = page * limit < totalCount;

  // Custom empty state text
  let emptyStateMessage = t("notifications.empty_state");
  if (selectedPlayerId) {
    const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
    const playerName = selectedPlayer ? `${selectedPlayer.name} ${selectedPlayer.surname}` : "";
    emptyStateMessage = t("notifications.empty_state_player", { playerName });
  }

  return (
    <PageContainer className="py-8" maxWidthClassName="max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("notifications.page_title")}
          </h1>
          <p className="text-base-content/70 mt-2">
            {t("notifications.bell_tooltip")}
          </p>
        </div>

        {/* Mark all as read button */}
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="btn btn-outline btn-primary btn-sm self-start sm:self-auto"
          >
            {t("notifications.mark_all_read")}
          </button>
        )}
      </div>

      {/* Advanced Filters & Sorting Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-base-200/40 p-4 rounded-xl border border-base-200/60 mb-6">
        {/* Left Side: Status Filter Tabs */}
        <div className="tabs tabs-boxed bg-base-200/80 p-0.5 w-full md:w-auto">
          <button
            onClick={() => updateParams({ status: "all", page: 1 })}
            className={`tab flex-1 md:flex-initial font-medium transition-all ${
              filter === "all" ? "tab-active bg-primary text-primary-content" : ""
            }`}
          >
            {t("notifications.filter_all")}
          </button>
          <button
            onClick={() => updateParams({ status: "unread", page: 1 })}
            className={`tab flex-1 md:flex-initial font-medium transition-all ${
              filter === "unread" ? "tab-active bg-primary text-primary-content" : ""
            }`}
          >
            {t("notifications.filter_unread")}
          </button>
          <button
            onClick={() => updateParams({ status: "read", page: 1 })}
            className={`tab flex-1 md:flex-initial font-medium transition-all ${
              filter === "read" ? "tab-active bg-primary text-primary-content" : ""
            }`}
          >
            {t("notifications.filter_read")}
          </button>
        </div>

        {/* Right Side: Selectors Dropdowns & Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
          {/* 3 Months Toggle */}
          <div className="form-control">
            <label className="label cursor-pointer gap-2 py-0">
              <input
                type="checkbox"
                checked={onlyRecent}
                onChange={(e) => updateParams({ recent: e.target.checked ? "true" : "false", page: 1 })}
                className="checkbox checkbox-primary checkbox-sm"
              />
              <span className="label-text text-xs font-semibold text-base-content/70">
                {t("notifications.filter_last_3_months")}
              </span>
            </label>
          </div>

          {/* Player Select Filter (Trainer only) */}
          {user?.role === "TRAINER" && (
            <div className="form-control w-full sm:w-44">
              <select
                value={selectedPlayerId}
                onChange={(e) => updateParams({ player: e.target.value, page: 1 })}
                className="select select-bordered select-sm w-full font-medium"
              >
                <option value="">{t("notifications.all_players")}</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.surname}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort order Selector */}
          <div className="form-control w-full sm:w-44">
            <select
              value={sortBy}
              onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
              className="select select-bordered select-sm w-full font-medium"
            >
              <option value="date_desc">{t("notifications.sort_newest")}</option>
              <option value="date_asc">{t("notifications.sort_oldest")}</option>
              {user?.role === "TRAINER" && (
                <option value="player_asc">{t("notifications.sort_player_az")}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Inbox List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="loading loading-spinner loading-md text-primary"></span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card bg-base-100 shadow border border-base-200 py-16 px-4 text-center">
          <div className="text-5xl mb-4 opacity-40">📭</div>
          <h2 className="text-lg font-semibold text-base-content/80">
            {emptyStateMessage}
          </h2>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isQuestionnaire = ["QUESTIONNAIRE_SENT", "QUESTIONNAIRE_RESPONDED", "QUESTIONNAIRE_RECLAIMED"].includes(n.type);

            const playerName = isQuestionnaire
              ? (n.assignment?.player ? `${n.assignment.player.name} ${n.assignment.player.surname}` : "")
              : (n.match?.player ? `${n.match.player.name} ${n.match.player.surname}` : "");

            const trainerName = isQuestionnaire
              ? (n.assignment?.questionnaire?.trainer ? `${n.assignment.questionnaire.trainer.name} ${n.assignment.questionnaire.trainer.surname}` : "")
              : (n.match?.trainer
                ? `${n.match.trainer.name} ${n.match.trainer.surname}`
                : n.match?.player?.trainers?.[0]
                ? `${n.match.player.trainers[0].name} ${n.match.player.trainers[0].surname}`
                : "");

            const matchName = n.match?.name || "";
            const qTitle = n.assignment?.questionnaire?.title || "";

            let messageText = "";
            if (n.type === "MATCH_CREATED") {
              messageText = t("notifications.match_created", { playerName, matchName });
            } else if (n.type === "MATCH_UPDATED") {
              messageText = t("notifications.match_updated", { playerName, matchName });
            } else if (n.type === "MATCH_UPDATED_BY_TRAINER") {
              messageText = t("notifications.match_updated_by_trainer", { trainerName, matchName });
            } else if (n.type === "FEEDBACK_MESSAGE_FROM_PLAYER") {
              messageText = t("notifications.feedback_message_from_player", { playerName, matchName });
            } else if (n.type === "FEEDBACK_MESSAGE_FROM_TRAINER") {
              messageText = t("notifications.feedback_message_from_trainer", { trainerName, matchName });
            } else if (n.type === "QUESTIONNAIRE_SENT") {
              messageText = t("notifications.questionnaire_sent", { trainerName, title: qTitle });
            } else if (n.type === "QUESTIONNAIRE_RESPONDED") {
              messageText = t("notifications.questionnaire_responded", { playerName, title: qTitle });
            } else if (n.type === "QUESTIONNAIRE_RECLAIMED") {
              messageText = t("notifications.questionnaire_reclaimed", { playerName, title: qTitle });
            }

            const isFromTrainer = n.type === "MATCH_UPDATED_BY_TRAINER" || n.type === "FEEDBACK_MESSAGE_FROM_TRAINER" || n.type === "QUESTIONNAIRE_SENT";
            const avatarUrl = isFromTrainer
              ? (isQuestionnaire ? (n.assignment?.questionnaire?.trainer?.avatarUrl || null) : (n.match?.trainer?.avatarUrl || n.match?.player?.trainers?.[0]?.avatarUrl || null))
              : (isQuestionnaire ? (n.assignment?.player?.avatarUrl || null) : n.match?.player?.avatarUrl);
            const senderName = isFromTrainer ? trainerName : playerName;

            // Localized full date
            const fullDateString = new Date(n.createdAt).toLocaleDateString(
              locale,
              {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            return (
              <div
                key={n.id}
                className={`card bg-base-100 shadow hover:shadow-md border transition-all duration-200 relative ${
                  !n.isRead
                    ? "border-primary/30 bg-primary/5 hover:border-primary/50"
                    : "border-base-200 hover:border-base-300"
                }`}
              >
                <div className="card-body p-4 flex flex-row items-center gap-4">
                  {/* Sender Avatar */}
                  <div className="avatar placeholder flex-shrink-0">
                    <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 overflow-hidden flex items-center justify-center">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={senderName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold">
                          {senderName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 pr-8">
                    <Link
                      href={isQuestionnaire ? `/questionnaires/assignments/${n.assignmentId}` : `/matches/${n.matchId}`}
                      onClick={() => handleNotificationClick(n.id, n.isRead)}
                      className="block text-sm text-base-content hover:underline font-semibold leading-snug break-words"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Unread blue dot */}
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        <span>{messageText}</span>
                      </div>
                    </Link>
                    <span className="text-xs text-base-content/50 block mt-1">
                      {formatRelativeTime(n.createdAt, locale)} &middot;{" "}
                      {fullDateString}
                    </span>
                  </div>

                  {/* Toggle single read/unread status */}
                  <button
                    onClick={(e) => handleToggleReadState(n.id, !n.isRead, e)}
                    title={t(n.isRead ? "notifications.mark_as_unread" : "notifications.mark_as_read")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-ghost btn-circle btn-sm text-base-content/55 hover:text-base-content/90 hover:bg-base-200"
                    disabled={isPending}
                  >
                    {n.isRead ? (
                      /* Envelope icon for mark as unread */
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    ) : (
                      /* Checkmark icon for mark as read */
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > limit && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => updateParams({ page: Math.max(1, page - 1) })}
            disabled={page === 1 || loading}
            className="btn btn-outline btn-sm"
          >
            {t("notifications.previous")}
          </button>

          <span className="text-xs text-base-content/70 font-medium">
            {t("notifications.page_info", { page })} /{" "}
            {Math.ceil(totalCount / limit)}
          </span>

          <button
            onClick={() => updateParams({ page: page + 1 })}
            disabled={!hasNextPage || loading}
            className="btn btn-outline btn-sm"
          >
            {t("notifications.next")}
          </button>
        </div>
      )}
    </PageContainer>
  );
}

export default function NotificationsInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <NotificationsInboxContent />
    </Suspense>
  );
}
