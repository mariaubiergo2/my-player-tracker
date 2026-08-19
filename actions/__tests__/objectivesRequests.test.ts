import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { UserRole, ObjectivesRequestStatus } from "@prisma/client";
import { generateToken } from "@/lib/auth";
import {
  createObjectivesRequest,
  createObjectivesRequestForAllTrainers,
  getObjectivesRequestsForPlayer,
  getObjectivesRequestsForTrainer,
  replyToObjectivesRequest,
  getPlayerTrainers,
} from "../objectivesRequests";
import { defineObjectives } from "../objectives";

// Define mock get functions and state using vi.hoisted to prevent hoisting reference errors
const { mockRevalidatePath, mockRedirect, mockGetCookie, authState } = vi.hoisted(() => {
  const authState = { currentAuthToken: null as string | null };
  const mockGetCookie = vi.fn((key: string) => {
    if (key === "auth_token") {
      return authState.currentAuthToken ? { value: authState.currentAuthToken } : undefined;
    }
    if (key === "locale") {
      return { value: "ca" };
    }
    return undefined;
  });

  return {
    mockRevalidatePath: vi.fn(),
    mockRedirect: vi.fn(),
    mockGetCookie,
    authState,
  };
});

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(() => {
    return Promise.resolve({
      get: mockGetCookie,
    });
  }),
}));

// Mock next/navigation redirect
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`Redirect to ${url}`);
  },
}));

// Mock next/cache revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

async function authenticateUser(user: { id: string; email: string; name: string; role: UserRole }) {
  authState.currentAuthToken = await generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

function clearAuthentication() {
  authState.currentAuthToken = null;
}

describe("Objectives Requests Server Actions - End to End Flow", () => {
  let player: any;
  let trainer1: any;
  let trainer2: any;

  beforeEach(async () => {
    clearAuthentication();
    vi.clearAllMocks();

    // Clean test database records that might clash
    await prisma.notification.deleteMany();
    await prisma.objectivesRequest.deleteMany();
    await prisma.playerObjectives.deleteMany();
    await prisma.user.deleteMany();

    // Create trainer and player users
    trainer1 = await prisma.user.create({
      data: {
        name: "Trainer",
        surname: "One",
        email: "trainer1@test.com",
        password: "hash",
        role: UserRole.TRAINER,
      },
    });

    trainer2 = await prisma.user.create({
      data: {
        name: "Trainer",
        surname: "Two",
        email: "trainer2@test.com",
        password: "hash",
        role: UserRole.TRAINER,
      },
    });

    player = await prisma.user.create({
      data: {
        name: "Player",
        surname: "User",
        email: "player@test.com",
        password: "hash",
        role: UserRole.PLAYER,
        trainers: {
          connect: [{ id: trainer1.id }],
        },
      },
    });
  });

  afterEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.objectivesRequest.deleteMany();
    await prisma.playerObjectives.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should support end to end flow of requesting, replying, and resolving", async () => {
    // 1. Authenticate as player
    await authenticateUser(player);

    // Verify getting player trainers
    const trainersRes = await getPlayerTrainers(player.id);
    expect(trainersRes.success).toBe(true);
    expect(trainersRes.trainers?.length).toBe(1);

    // 2. Player creates objectives request for trainer1
    const createRes = await createObjectivesRequestForAllTrainers("Motiu de prova per als meus objectius");
    expect(createRes.success).toBe(true);
    expect(createRes.data).toBeDefined();

    const requestId = createRes.data![0].id;

    // Verify notification was sent to trainer1
    const trainer1Notifications = await prisma.notification.findMany({
      where: { recipientId: trainer1.id },
    });
    expect(trainer1Notifications.length).toBe(1);
    expect(trainer1Notifications[0].type).toBe("OBJECTIVES_REQUEST_CREATED");

    // 3. Player fetches their requests
    const playerRequests = await getObjectivesRequestsForPlayer(player.id);
    expect(playerRequests.success).toBe(true);
    expect(playerRequests.data?.length).toBe(1);
    expect(playerRequests.data?.[0].status).toBe(ObjectivesRequestStatus.PENDING);

    // 4. Authenticate as trainer1 and reply to the request using quick reply
    await authenticateUser(trainer1);

    const trainerRequests = await getObjectivesRequestsForTrainer();
    expect(trainerRequests.success).toBe(true);
    expect(trainerRequests.data?.length).toBe(1);

    const replyRes = await replyToObjectivesRequest(requestId, "👀 Ho estic mirant");
    expect(replyRes.success).toBe(true);

    // Verify request status is now ACKNOWLEDGED
    const updatedRequest = await prisma.objectivesRequest.findUnique({
      where: { id: requestId },
    });
    expect(updatedRequest?.status).toBe(ObjectivesRequestStatus.ACKNOWLEDGED);
    expect(updatedRequest?.trainerReply).toBe("👀 Ho estic mirant");

    // Verify notification was sent back to player
    let playerNotifications = await prisma.notification.findMany({
      where: { recipientId: player.id },
    });
    expect(playerNotifications.length).toBe(1);
    expect(playerNotifications[0].type).toBe("OBJECTIVES_REQUEST_REPLIED");

    // Mark the notification as read to test that a second reply resets it to unread and doesn't duplicate
    await prisma.notification.update({
      where: { id: playerNotifications[0].id },
      data: { isRead: true },
    });

    // Reply again
    const secondReplyRes = await replyToObjectivesRequest(requestId, "🛠️ Treballant-hi");
    expect(secondReplyRes.success).toBe(true);

    // Verify trainerReply was updated
    const requestAfterSecondReply = await prisma.objectivesRequest.findUnique({
      where: { id: requestId },
    });
    expect(requestAfterSecondReply?.trainerReply).toBe("🛠️ Treballant-hi");

    // Verify there is still exactly one notification of type OBJECTIVES_REQUEST_REPLIED, and it is unread (isRead: false)
    playerNotifications = await prisma.notification.findMany({
      where: { recipientId: player.id },
    });
    expect(playerNotifications.length).toBe(1);
    expect(playerNotifications[0].type).toBe("OBJECTIVES_REQUEST_REPLIED");
    expect(playerNotifications[0].isRead).toBe(false);

    // 5. Trainer1 defines objectives for player
    const defineRes = await defineObjectives(player.id, "Nous objectius de la setmana", ["Tàctica defensiva", "Pressió alta"]);
    expect(defineRes.success).toBe(true);

    // Verify request status transitions to RESOLVED automatically
    const resolvedRequest = await prisma.objectivesRequest.findUnique({
      where: { id: requestId },
    });
    expect(resolvedRequest?.status).toBe(ObjectivesRequestStatus.RESOLVED);
  });

  it("should support requesting objectives for all trainers at once", async () => {
    // Connect second trainer
    await prisma.user.update({
      where: { id: player.id },
      data: {
        trainers: {
          connect: [{ id: trainer2.id }],
        },
      },
    });

    // Authenticate as player
    await authenticateUser(player);

    const createRes = await createObjectivesRequestForAllTrainers("Necessito que tots reviseu els meus objectius.");
    expect(createRes.success).toBe(true);
    expect(createRes.data?.length).toBe(2); // One for each trainer

    // Verify notification was sent to both trainer1 and trainer2
    const trainer1Notifications = await prisma.notification.findMany({
      where: { recipientId: trainer1.id },
    });
    const trainer2Notifications = await prisma.notification.findMany({
      where: { recipientId: trainer2.id },
    });
    expect(trainer1Notifications.length).toBe(1);
    expect(trainer2Notifications.length).toBe(1);
  });

  it("should return success: false and error: no_trainers_assigned when player has no trainers", async () => {
    // Disconnect all trainers
    await prisma.user.update({
      where: { id: player.id },
      data: {
        trainers: {
          set: [],
        },
      },
    });

    await authenticateUser(player);

    const createRes = await createObjectivesRequestForAllTrainers("Necessito que reviseu els meus objectius.");
    expect(createRes.success).toBe(false);
    expect(createRes.error).toBe("no_trainers_assigned");
  });
});
