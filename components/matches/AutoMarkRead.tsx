"use client";

import { useEffect } from "react";
import { markMatchNotificationsAsRead } from "@/actions/notifications";

export default function AutoMarkRead({
  matchId,
  trainerId,
}: {
  matchId: string;
  trainerId: string;
}) {
  useEffect(() => {
    const run = async () => {
      try {
        const res = await markMatchNotificationsAsRead(matchId, trainerId);
        if (res.success) {
          window.dispatchEvent(new CustomEvent("notifications-updated"));
        }
      } catch (error) {
        console.error("Error auto marking match notifications as read:", error);
      }
    };
    run();
  }, [matchId, trainerId]);

  return null;
}
