import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { UserRole, QuickResponseType } from "@prisma/client";
import { generateToken } from "@/lib/auth";
import {
  createObjectiveRequest,
  getObjectivesRequestsForPlayer,
  getObjectivesRequestsForTrainer,
  replyToObjectiveRequest,
  markObjectiveRequestAsReviewed,
  getPlayerTrainers,
} from "../objectivesRequests";
import { defineObjectives } from "../objectives";
import { updateUser } from "../users";

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
    await prisma.objectiveRequestResponse.deleteMany();
    await prisma.objectiveRequest.deleteMany();
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
        trainerSpecialty: "VIDEO_ANALYSIS",
      },
    });

    trainer2 = await prisma.user.create({
      data: {
        name: "Trainer",
        surname: "Two",
        email: "trainer2@test.com",
        password: "hash",
        role: UserRole.TRAINER,
        trainerSpecialty: "VIDEO_ANALYSIS",
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
    await prisma.objectiveRequestResponse.deleteMany();
    await prisma.objectiveRequest.deleteMany();
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

    // 2. Player creates objectives request
    const createRes = await createObjectiveRequest("Motiu de prova per als meus objectius", "ANALYSIS_VIDEO");
    expect(createRes.success).toBe(true);
    expect(createRes.data).toBeDefined();

    const requestId = (createRes.data as any).id;

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
    expect(playerRequests.data?.[0].reviewed).toBe(false);

    // 4. Authenticate as trainer1 and reply to the request using quick reply
    await authenticateUser(trainer1);

    const trainerRequests = await getObjectivesRequestsForTrainer();
    expect(trainerRequests.success).toBe(true);
    expect(trainerRequests.data?.length).toBe(1);

    const replyRes = await replyToObjectiveRequest(requestId, "LOOKING_INTO_IT");
    expect(replyRes.success).toBe(true);

    // Verify reply in database
    const requestWithResponses = await prisma.objectiveRequest.findUnique({
      where: { id: requestId },
      include: { responses: true }
    });
    expect(requestWithResponses?.responses.length).toBe(1);
    expect(requestWithResponses?.responses[0].quickResponseType).toBe("LOOKING_INTO_IT");

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
    const secondReplyRes = await replyToObjectiveRequest(requestId, "WORKING_ON_IT");
    expect(secondReplyRes.success).toBe(true);

    // Verify responses list was updated
    const requestWithTwoResponses = await prisma.objectiveRequest.findUnique({
      where: { id: requestId },
      include: { responses: true }
    });
    expect(requestWithTwoResponses?.responses.length).toBe(2);

    // Verify there is still exactly one notification of type OBJECTIVES_REQUEST_REPLIED, and it is unread (isRead: false)
    playerNotifications = await prisma.notification.findMany({
      where: { recipientId: player.id },
    });
    expect(playerNotifications.length).toBe(1);
    expect(playerNotifications[0].type).toBe("OBJECTIVES_REQUEST_REPLIED");
    expect(playerNotifications[0].isRead).toBe(false);

    // 5. Trainer1 defines objectives for player
    const defineRes = await defineObjectives(player.id, "Nous objectius de la setmana", ["Tàctica defensiva", "Pressió alta"], "ANALYSIS_VIDEO");
    expect(defineRes.success).toBe(true);

    // Verify request status transitions to reviewed: true automatically
    const resolvedRequest = await prisma.objectiveRequest.findUnique({
      where: { id: requestId },
    });
    expect(resolvedRequest?.reviewed).toBe(true);
  });

  it("should support requesting objectives notifying all trainers in the section", async () => {
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

    const createRes = await createObjectiveRequest("Necessito que tots reviseu els meus objectius.", "ANALYSIS_VIDEO");
    expect(createRes.success).toBe(true);

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

  it("should create request and notify admins when player has no trainers for that section", async () => {
    // Disconnect all trainers
    await prisma.user.update({
      where: { id: player.id },
      data: {
        trainers: {
          set: [],
        },
      },
    });

    // Create an admin
    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        surname: "User",
        email: "admin-no-trainer@test.com",
        password: "hash",
        role: UserRole.ADMIN,
      },
    });

    await authenticateUser(player);

    const createRes = await createObjectiveRequest("Necessito que reviseu els meus objectius.", "ANALYSIS_VIDEO");
    expect(createRes.success).toBe(true);

    // Verify notification was sent to admin
    const adminNotifications = await prisma.notification.findMany({
      where: { recipientId: admin.id },
    });
    expect(adminNotifications.length).toBe(1);
    expect(adminNotifications[0].type).toBe("OBJECTIVE_REQUEST_NO_TRAINER_AVAILABLE");
  });

  it("should notify trainer when they are assigned a specialty after player has pending objectives requests", async () => {
    // 1. Clear trainer specialty
    await prisma.user.update({
      where: { id: trainer1.id },
      data: { trainerSpecialty: null }
    });

    // 2. Create pending objectives request (notifies admin since trainer has no specialty)
    await authenticateUser(player);
    const reqRes = await createObjectiveRequest("Vull millorar en la sortida de pilota", "ANALYSIS_VIDEO");
    expect(reqRes.success).toBe(true);
    const requestId = reqRes.data!.id;

    // Verify trainer has no notifications yet
    let trainerNotifications = await prisma.notification.findMany({
      where: { recipientId: trainer1.id }
    });
    expect(trainerNotifications.length).toBe(0);

    // 3. Admin updates trainer specialty to VIDEO_ANALYSIS
    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        surname: "User",
        email: "admin-specialty-test@test.com",
        password: "hash",
        role: UserRole.ADMIN,
      },
    });
    await authenticateUser(admin);

    const updateRes = await updateUser(trainer1.id, {
      trainerSpecialty: "VIDEO_ANALYSIS"
    });
    expect(updateRes.success).toBe(true);

    // 4. Verify trainer now has OBJECTIVES_REQUEST_CREATED notification for that request
    trainerNotifications = await prisma.notification.findMany({
      where: {
        recipientId: trainer1.id,
        type: "OBJECTIVES_REQUEST_CREATED"
      }
    });
    expect(trainerNotifications.length).toBe(1);
    expect(trainerNotifications[0].objectiveRequestId).toBe(requestId);
  });

  it("should not duplicate OBJECTIVES_REQUEST_CREATED notifications if trainer specialty is updated multiple times", async () => {
    // 1. Clear trainer specialty
    await prisma.user.update({
      where: { id: trainer1.id },
      data: { trainerSpecialty: null }
    });

    // 2. Create pending objectives request
    await authenticateUser(player);
    const reqRes = await createObjectiveRequest("Vull millorar en la sortida de pilota", "ANALYSIS_VIDEO");
    expect(reqRes.success).toBe(true);
    const requestId = reqRes.data!.id;

    // 3. Admin updates trainer specialty to VIDEO_ANALYSIS
    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        surname: "User",
        email: "admin-duplicate-test@test.com",
        password: "hash",
        role: UserRole.ADMIN,
      },
    });
    await authenticateUser(admin);

    const updateRes1 = await updateUser(trainer1.id, {
      trainerSpecialty: "VIDEO_ANALYSIS"
    });
    expect(updateRes1.success).toBe(true);

    // 4. Admin updates trainer specialty again
    const updateRes2 = await updateUser(trainer1.id, {
      trainerSpecialty: "VIDEO_ANALYSIS"
    });
    expect(updateRes2.success).toBe(true);

    // 5. Verify trainer has EXACTLY ONE notification for this request
    const trainerNotifications = await prisma.notification.findMany({
      where: {
        recipientId: trainer1.id,
        type: "OBJECTIVES_REQUEST_CREATED",
        objectiveRequestId: requestId
      }
    });
    expect(trainerNotifications.length).toBe(1);
  });
});
