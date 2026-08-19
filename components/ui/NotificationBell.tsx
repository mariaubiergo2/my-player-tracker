"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import {
  getNotifications,
  toggleNotificationReadState,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
} from "@/actions/notifications";
import { formatRelativeTime } from "@/lib/utils/dates";

interface NotificationItem {
  id: string;
  recipientId: string;
  type: "MATCH_CREATED" | "MATCH_UPDATED" | "MATCH_UPDATED_BY_TRAINER" | "FEEDBACK_MESSAGE_FROM_PLAYER" | "FEEDBACK_MESSAGE_FROM_TRAINER" | "QUESTIONNAIRE_SENT" | "QUESTIONNAIRE_RESPONDED" | "QUESTIONNAIRE_RECLAIMED" | "OBJECTIVES_REQUEST_CREATED" | "OBJECTIVES_REQUEST_REPLIED";
  matchId?: string | null;
  assignmentId?: string | null;
  objectivesRequestId?: string | null;
  isRead: boolean;
  createdAt: Date;
  match?: {
    id: string;
    name: string;
    player: {
      id: string;
      name: string;
      surname: string;
      avatarUrl?: string | null;
      trainers?: {
        id: string;
        name: string;
        surname: string;
        avatarUrl?: string | null;
      }[];
    };
    trainer?: {
      id: string;
      name: string;
      surname: string;
      avatarUrl?: string | null;
    } | null;
  } | null;
  assignment?: {
    id: string;
    player: {
      id: string;
      name: string;
      surname: string;
      avatarUrl?: string | null;
    };
    questionnaire: {
      id: string;
      title: string;
      trainer: {
        id: string;
        name: string;
        surname: string;
        avatarUrl?: string | null;
      };
    };
  } | null;
  objectivesRequest?: {
    id: string;
    playerId: string;
    trainerId: string;
    reason: string;
    status: string;
    trainerReply?: string | null;
    repliedAt?: string | Date | null;
    player: {
      id: string;
      name: string;
      surname: string;
      avatarUrl?: string | null;
    };
    trainer: {
      id: string;
      name: string;
      surname: string;
      avatarUrl?: string | null;
    };
  } | null;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasOpened, setHasOpened] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isUserAuthorized =
    user?.role === "TRAINER" ||
    user?.role === "PLAYER" ||
    user?.role === "GOAL_KEEPER";

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const res = await getUnreadNotificationsCount(user.id);
      if (res.success && typeof res.count === "number") {
        setUnreadCount(res.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchNotificationsList = async () => {
    if (!user?.id) return;
    setLoadingList(true);
    try {
      const res = await getNotifications(user.id, 1, 20, "all", undefined, "date_desc", true);
      if (res.success && res.data) {
        setNotifications(res.data as unknown as NotificationItem[]);
      }
    } catch (error) {
      console.error("Error fetching notifications list:", error);
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch count on mount, when user changes, or when pathname changes
  useEffect(() => {
    if (isUserAuthorized) {
      fetchUnreadCount();
      if (hasOpened) {
        fetchNotificationsList();
      }
    }
  }, [user?.id, pathname, isUserAuthorized, hasOpened]);

  // Listen to custom notification update events
  useEffect(() => {
    if (!isUserAuthorized) return;
    const handleUpdate = () => {
      fetchUnreadCount();
      if (hasOpened) {
        fetchNotificationsList();
      }
    };
    window.addEventListener("notifications-updated", handleUpdate);
    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [isUserAuthorized, hasOpened]);

  if (!isUserAuthorized) return null;

  const handleToggleReadState = (id: string, isRead: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead } : n))
    );
    setUnreadCount((prev) => Math.max(0, isRead ? prev - 1 : prev + 1));

    startTransition(async () => {
      await toggleNotificationReadState(id, isRead);
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    });
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      startTransition(async () => {
        await toggleNotificationReadState(id, true);
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      });
    }
    closeDropdown();
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (unreadCount === 0 || !user?.id) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    startTransition(async () => {
      await markAllNotificationsAsRead(user.id);
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    });
  };

  const handleOpenDropdown = () => {
    if (!hasOpened) {
      setHasOpened(true);
    } else {
      fetchNotificationsList();
    }
  };

  const closeDropdown = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="dropdown dropdown-end">
      {/* Trigger button */}
      <div
        tabIndex={0}
        role="button"
        onClick={handleOpenDropdown}
        onFocus={handleOpenDropdown}
        className="btn btn-ghost btn-circle btn-sm relative border border-base-content/10 bg-base-100/50 hover:bg-base-200"
        title={t("notifications.bell_tooltip")}
        aria-label={t("notifications.bell_tooltip")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-base-content/80"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-error-content animate-pulse">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Dropdown Menu content */}
      <div
        tabIndex={0}
        className="dropdown-content mt-3 w-80 sm:w-96 rounded-box border border-base-content/10 bg-base-100 p-2 shadow-2xl z-[50]"
      >
        <div className="flex items-center justify-between border-b border-base-content/10 px-3 py-2">
          <span className="font-bold text-sm text-base-content/90">
            {t("notifications.title")}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-primary hover:underline font-semibold"
              disabled={isPending}
            >
              {t("notifications.mark_all_read")}
            </button>
          )}
        </div>

        <ul className="max-h-80 overflow-y-auto divide-y divide-base-content/5 mt-1">
          {loadingList && notifications.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-base-content/50 flex items-center justify-center">
              <span className="loading loading-spinner loading-sm text-primary mr-2"></span>
            </li>
          ) : notifications.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-base-content/50">
              🔔 {t("notifications.empty")}
            </li>
          ) : (
            notifications.map((n) => {
              const isQuestionnaire = ["QUESTIONNAIRE_SENT", "QUESTIONNAIRE_RESPONDED", "QUESTIONNAIRE_RECLAIMED"].includes(n.type);
              const isObjectivesRequest = ["OBJECTIVES_REQUEST_CREATED", "OBJECTIVES_REQUEST_REPLIED"].includes(n.type);

              const playerName = isQuestionnaire
                ? (n.assignment?.player ? `${n.assignment.player.name} ${n.assignment.player.surname}` : "")
                : isObjectivesRequest
                ? (n.objectivesRequest?.player ? `${n.objectivesRequest.player.name} ${n.objectivesRequest.player.surname}` : "")
                : (n.match?.player ? `${n.match.player.name} ${n.match.player.surname}` : "");

              const trainerName = isQuestionnaire
                ? (n.assignment?.questionnaire?.trainer ? `${n.assignment.questionnaire.trainer.name} ${n.assignment.questionnaire.trainer.surname}` : "")
                : isObjectivesRequest
                ? (n.objectivesRequest?.trainer ? `${n.objectivesRequest.trainer.name} ${n.objectivesRequest.trainer.surname}` : "")
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
              } else if (n.type === "OBJECTIVES_REQUEST_CREATED") {
                messageText = t("notifications.objectives_request_created", { playerName });
              } else if (n.type === "OBJECTIVES_REQUEST_REPLIED") {
                messageText = t("notifications.objectives_request_replied", { trainerName, reply: n.objectivesRequest?.trainerReply || "" });
              }

              return (
                <li
                  key={n.id}
                  className={`relative hover:bg-base-200/60 transition-colors ${
                    !n.isRead ? "bg-base-200/35 font-medium" : ""
                  }`}
                >
                  <Link
                    href={
                      isQuestionnaire
                        ? `/questionnaires/assignments/${n.assignmentId}`
                        : isObjectivesRequest
                        ? `/questionnaires?tab=requests`
                        : `/matches/${n.matchId}`
                    }
                    onClick={() => handleNotificationClick(n.id, n.isRead)}
                    className="flex gap-3 px-3.5 py-3 pr-10 items-start select-none"
                  >
                    {/* Unread circle indicator */}
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-base-content/90 leading-relaxed break-words">
                        {messageText}
                      </p>
                      <span className="text-[10px] text-base-content/50 block mt-1">
                        {formatRelativeTime(n.createdAt, locale)}
                      </span>
                    </div>
                  </Link>

                  {/* Toggle single read/unread status */}
                  <button
                    onClick={(e) => handleToggleReadState(n.id, !n.isRead, e)}
                    title={t(n.isRead ? "notifications.mark_as_unread" : "notifications.mark_as_read")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-circle btn-xs hover:bg-base-300 text-base-content/55 hover:text-base-content/90"
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
                        className="w-3.5 h-3.5"
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
                        className="w-3.5 h-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        {notifications.length > 0 && (
          <div className="border-t border-base-content/10 p-2 text-center">
            <Link
              href="/notifications"
              onClick={closeDropdown}
              className="text-xs text-primary hover:underline font-bold"
            >
              {t("notifications.view_all")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
