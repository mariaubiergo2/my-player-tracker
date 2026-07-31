// app/actions/notifications.ts
"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getNotifications(
  trainerId: string,
  page: number = 1,
  limit: number = 20,
  filter: "all" | "unread" | "read" = "all",
  playerId?: string,
  sortBy: "date_desc" | "date_asc" | "player_asc" = "date_desc",
  onlyRecent: boolean = true
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== trainerId) {
      return { success: false, error: "Unauthorized" };
    }

    const whereClause: any = { recipientId: trainerId };
    if (filter === "unread") {
      whereClause.isRead = false;
    } else if (filter === "read") {
      whereClause.isRead = true;
    }

    if (playerId) {
      whereClause.match = { playerId };
    }

    if (onlyRecent) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      whereClause.createdAt = {
        gte: threeMonthsAgo,
      };
    }

    let orderByClause: any = { createdAt: "desc" };
    if (sortBy === "date_asc") {
      orderByClause = { createdAt: "asc" };
    } else if (sortBy === "player_asc") {
      orderByClause = {
        match: {
          player: {
            name: "asc",
          },
        },
      };
    }

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          match: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.notification.count({
        where: whereClause,
      }),
    ]);

    return { success: true, data: notifications, totalCount };
  } catch (error) {
    console.error("Get notifications error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get notifications" };
  }
}

export async function toggleNotificationReadState(notificationId: string, isRead: boolean) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    if (notification.recipientId !== currentUser.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead },
    });

    revalidatePath("/dashboard");
    revalidatePath("/matches");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Toggle notification read state error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to toggle notification read state" };
  }
}

export async function markAllNotificationsAsRead(trainerId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== trainerId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.notification.updateMany({
      where: {
        recipientId: trainerId,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidatePath("/dashboard");
    revalidatePath("/matches");

    return { success: true };
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to mark all notifications as read" };
  }
}

export async function markMatchNotificationsAsRead(matchId: string, trainerId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== trainerId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.notification.updateMany({
      where: {
        recipientId: trainerId,
        matchId: matchId,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidatePath("/dashboard");
    revalidatePath("/matches");
    revalidatePath(`/matches/${matchId}`);

    return { success: true };
  } catch (error) {
    console.error("Mark match notifications as read error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to mark match notifications as read" };
  }
}

export async function getUnreadNotificationsCount(trainerId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== trainerId) {
      return { success: false, error: "Unauthorized" };
    }

    const count = await prisma.notification.count({
      where: {
        recipientId: trainerId,
        isRead: false,
      },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Get unread notifications count error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get count" };
  }
}

export async function getNotificationPlayers(trainerId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== trainerId) {
      return { success: false, error: "Unauthorized" };
    }

    // Find all notifications for this trainer and select distinct players from matches
    const notifications = await prisma.notification.findMany({
      where: { recipientId: trainerId },
      select: {
        match: {
          select: {
            player: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    // Map to players and filter duplicates
    const playerMap = new Map<string, { id: string; name: string; surname: string }>();
    for (const n of notifications) {
      if (n.match?.player) {
        playerMap.set(n.match.player.id, n.match.player);
      }
    }
    const players = Array.from(playerMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, data: players };
  } catch (error) {
    console.error("Get notification players error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get players" };
  }
}
