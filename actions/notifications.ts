// app/actions/notifications.ts
"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import {
  getNotificationsSchema,
  toggleNotificationReadStateSchema,
  recipientIdSchema,
  markMatchNotificationsAsReadSchema,
} from "@/lib/validations/notifications";

export async function getNotifications(
  recipientId: string,
  page: number = 1,
  limit: number = 20,
  filter: "all" | "unread" | "read" = "all",
  playerId?: string,
  sortBy: "date_desc" | "date_asc" | "player_asc" = "date_desc",
  onlyRecent: boolean = true
) {
  try {
    const validation = getNotificationsSchema.safeParse({
      recipientId,
      page,
      limit,
      filter,
      playerId,
      sortBy,
      onlyRecent,
    });
    if (!validation.success) {
      return { success: false, error: "Invalid parameters" };
    }
    const validatedData = validation.data;

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== validatedData.recipientId) {
      return { success: false, error: "Unauthorized" };
    }

    const whereClause: Prisma.NotificationWhereInput = { recipientId: validatedData.recipientId };
    if (validatedData.filter === "unread") {
      whereClause.isRead = false;
    } else if (validatedData.filter === "read") {
      whereClause.isRead = true;
    }

    if (validatedData.playerId) {
      whereClause.OR = [
        { match: { playerId: validatedData.playerId } },
        { assignment: { playerId: validatedData.playerId } }
      ];
    }

    if (validatedData.onlyRecent) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      whereClause.createdAt = {
        gte: threeMonthsAgo,
      };
    }

    let orderByClause: Prisma.NotificationOrderByWithRelationInput = { createdAt: "desc" };
    if (validatedData.sortBy === "date_asc") {
      orderByClause = { createdAt: "asc" };
    } else if (validatedData.sortBy === "player_asc") {
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
        skip: (validatedData.page - 1) * validatedData.limit,
        take: validatedData.limit,
        include: {
          match: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  avatarUrl: true,
                  trainers: {
                    select: {
                      id: true,
                      name: true,
                      surname: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              trainer: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  avatarUrl: true,
                },
              },
            },
          },
          assignment: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  avatarUrl: true,
                },
              },
              questionnaire: {
                include: {
                  trainer: {
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
          },
          objectivesRequest: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  avatarUrl: true,
                },
              },
              trainer: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  avatarUrl: true,
                },
              },
            },
          },
        trainingPlanAssignment: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatarUrl: true,
              },
            },
            trainingPlan: {
              include: {
                trainer: {
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
        },
        trainingFeedback: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatarUrl: true,
              },
            },
            session: {
              include: {
                trainingPlan: {
                  include: {
                    trainer: {
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
            },
            assignment: {
              include: {
                trainingPlan: {
                  include: {
                    trainer: {
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
    const validation = toggleNotificationReadStateSchema.safeParse({ notificationId, isRead });
    if (!validation.success) {
      return { success: false, error: "Invalid parameters" };
    }
    const validatedData = validation.data;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const notification = await prisma.notification.findUnique({
      where: { id: validatedData.notificationId },
    });

    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    if (notification.recipientId !== currentUser.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await prisma.notification.update({
      where: { id: validatedData.notificationId },
      data: { isRead: validatedData.isRead },
    });

    revalidatePath("/dashboard");
    revalidatePath("/matches");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Toggle notification read state error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to toggle notification read state" };
  }
}

export async function markAllNotificationsAsRead(recipientId: string) {
  try {
    const validation = recipientIdSchema.safeParse(recipientId);
    if (!validation.success) {
      return { success: false, error: "Invalid parameters" };
    }
    const validatedRecipientId = validation.data;

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== validatedRecipientId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.notification.updateMany({
      where: {
        recipientId: validatedRecipientId,
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

export async function markMatchNotificationsAsRead(matchId: string, recipientId: string) {
  try {
    const validation = markMatchNotificationsAsReadSchema.safeParse({ matchId, recipientId });
    if (!validation.success) {
      return { success: false, error: "Invalid parameters" };
    }
    const validatedData = validation.data;

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== validatedData.recipientId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.notification.updateMany({
      where: {
        recipientId: validatedData.recipientId,
        matchId: validatedData.matchId,
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

export async function getUnreadNotificationsCount(recipientId: string) {
  try {
    const validation = recipientIdSchema.safeParse(recipientId);
    if (!validation.success) {
      return { success: false, error: "Invalid parameters" };
    }
    const validatedRecipientId = validation.data;

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== validatedRecipientId) {
      return { success: false, error: "Unauthorized" };
    }

    const count = await prisma.notification.count({
      where: {
        recipientId: validatedRecipientId,
        isRead: false,
      },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Get unread notifications count error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get count" };
  }
}

export async function getNotificationPlayers(recipientId: string) {
  try {
    const validation = recipientIdSchema.safeParse(recipientId);
    if (!validation.success) {
      return { success: false, error: "Invalid parameters" };
    }
    const validatedRecipientId = validation.data;

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.userId !== validatedRecipientId) {
      return { success: false, error: "Unauthorized" };
    }

    // Find all notifications for this trainer and select distinct players from matches & assignments
    const notifications = await prisma.notification.findMany({
      where: { recipientId: validatedRecipientId },
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
        assignment: {
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
        objectivesRequest: {
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
      if (n.assignment?.player) {
        playerMap.set(n.assignment.player.id, n.assignment.player);
      }
      if (n.objectivesRequest?.player) {
        playerMap.set(n.objectivesRequest.player.id, n.objectivesRequest.player);
      }
    }
    const players = Array.from(playerMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, data: players };
  } catch (error) {
    console.error("Get notification players error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get players" };
  }
}
