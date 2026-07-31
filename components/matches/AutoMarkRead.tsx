"use client";

import { useEffect } from "react";
import { markMatchNotificationsAsRead } from "@/actions/notifications";

export default function AutoMarkRead({
  matchId,
  recipientId,
}: {
  matchId: string;
  recipientId: string;
}) {
  useEffect(() => {
    const run = async () => {
      try {
        const res = await markMatchNotificationsAsRead(matchId, recipientId);
        if (res.success) {
          window.dispatchEvent(new CustomEvent("notifications-updated"));
        }
      } catch (error) {
        console.error("Error auto marking match notifications as read:", error);
      }
    };
    run();
  }, [matchId, recipientId]);

  return null;
}
