import { PrismaClient, UserRole, MatchType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";
import { SEED_USERS } from "./seed-data/credentials";
import { ADDITIONAL_USERS } from "./seed-data/users";
import { DEMO_MATCHES, DEMO_FEEDBACK_MESSAGES } from "./seed-data/matches";
import { DEMO_QUESTIONNAIRES, DEMO_ASSIGNMENTS, DEMO_ANSWERS } from "./seed-data/questionnaires";
import { DEMO_OBJECTIVES } from "./seed-data/objectives";
import { DEMO_NOTIFICATIONS } from "./seed-data/notifications";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding started...");

  console.log("Upserting all users...");
  const saltRounds = 10;
  const upsertedUsers: Record<string, any> = {};

  // Merge base environment-dependent credentials with additional static demo users
  const allSeedUsers = [
    ...SEED_USERS,
    ...ADDITIONAL_USERS.map((u) => ({ ...u, password: "password123" })),
  ];

  for (const seedUser of allSeedUsers) {
    const hashedPassword = await bcrypt.hash(seedUser.password || "", saltRounds);

    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {
        name: seedUser.name,
        surname: seedUser.surname,
        role: seedUser.role,
        phone: seedUser.phone || null,
        password: hashedPassword,
        emailVerified: true,
      },
      create: {
        id: seedUser.id,
        email: seedUser.email,
        name: seedUser.name,
        surname: seedUser.surname,
        role: seedUser.role,
        password: hashedPassword,
        phone: seedUser.phone || null,
        emailVerified: true,
      },
    });
    console.log(`Upserted user: ${user.email} (ID: ${user.id}, Role: ${user.role})`);
    upsertedUsers[seedUser.key] = user;
  }

  // Connect trainer <-> player / goalkeeper relations according to trainerKeys
  console.log("Connecting trainers and players...");
  for (const seedUser of allSeedUsers) {
    if (seedUser.trainerKeys && seedUser.trainerKeys.length > 0) {
      const trainerIds = seedUser.trainerKeys
        .map((key) => upsertedUsers[key]?.id)
        .filter(Boolean) as string[];

      if (trainerIds.length > 0) {
        await prisma.user.update({
          where: { id: upsertedUsers[seedUser.key].id },
          data: {
            trainers: {
              set: trainerIds.map((id) => ({ id })),
            },
          },
        });
        console.log(`Connected user ${seedUser.email} to trainers: ${seedUser.trainerKeys.join(", ")}`);
      }
    }
  }

  // Create demo matches
  console.log("Upserting demo matches...");
  for (const matchData of DEMO_MATCHES) {
    const playerId = upsertedUsers[matchData.playerKey]?.id;
    const trainerId = matchData.trainerKey ? upsertedUsers[matchData.trainerKey]?.id : null;

    if (!playerId) {
      throw new Error(`Player with key "${matchData.playerKey}" not found for match "${matchData.id}"`);
    }

    const match = await prisma.match.upsert({
      where: { id: matchData.id },
      update: {
        name: matchData.name,
        description: matchData.description,
        location: matchData.location,
        isHome: matchData.isHome,
        matchUrl: matchData.matchUrl,
        kitColor: matchData.kitColor,
        shirtNumber: matchData.shirtNumber,
        position: matchData.position,
        minutesPlayed: matchData.minutesPlayed,
        date: matchData.date,
        startTime: matchData.startTime,
        endTime: matchData.endTime,
        opponent: matchData.opponent,
        category: matchData.category,
        leaguePosition: matchData.leaguePosition,
        matchType: matchData.matchType,
        competitionType: matchData.competitionType,
        playerId,
        trainerId,
        teamId: matchData.teamId,
        mark: matchData.mark,
        intensity: matchData.intensity,
        attitude: matchData.attitude,
        performance: matchData.performance,
        goals: matchData.goals,
        assists: matchData.assists,
        strengths: matchData.strengths,
        weaknesses: matchData.weaknesses,
        improvementAreas: matchData.improvementAreas,
        comment: matchData.comment,
        trainerFeedback: matchData.trainerFeedback,
        playerReflection: matchData.playerReflection,
        isReviewed: matchData.isReviewed,
        reviewedAt: matchData.reviewedAt,
      },
      create: {
        id: matchData.id,
        name: matchData.name,
        description: matchData.description,
        location: matchData.location,
        isHome: matchData.isHome,
        matchUrl: matchData.matchUrl,
        kitColor: matchData.kitColor,
        shirtNumber: matchData.shirtNumber,
        position: matchData.position,
        minutesPlayed: matchData.minutesPlayed,
        date: matchData.date,
        startTime: matchData.startTime,
        endTime: matchData.endTime,
        opponent: matchData.opponent,
        category: matchData.category,
        leaguePosition: matchData.leaguePosition,
        matchType: matchData.matchType,
        competitionType: matchData.competitionType,
        playerId,
        trainerId,
        teamId: matchData.teamId,
        mark: matchData.mark,
        intensity: matchData.intensity,
        attitude: matchData.attitude,
        performance: matchData.performance,
        goals: matchData.goals,
        assists: matchData.assists,
        strengths: matchData.strengths,
        weaknesses: matchData.weaknesses,
        improvementAreas: matchData.improvementAreas,
        comment: matchData.comment,
        trainerFeedback: matchData.trainerFeedback,
        playerReflection: matchData.playerReflection,
        isReviewed: matchData.isReviewed,
        reviewedAt: matchData.reviewedAt,
      },
    });
    console.log(`Upserted match: ${match.name}`);
  }

  // Create feedback messages
  console.log("Upserting feedback messages...");
  for (const fb of DEMO_FEEDBACK_MESSAGES) {
    const authorId = upsertedUsers[fb.authorKey]?.id;
    if (!authorId) {
      throw new Error(`Author with key "${fb.authorKey}" not found for feedback message "${fb.id}"`);
    }

    await prisma.matchFeedbackMessage.upsert({
      where: { id: fb.id },
      update: {
        matchId: fb.matchId,
        authorId,
        authorRole: fb.authorRole,
        content: fb.content,
        createdAt: fb.createdAt,
      },
      create: {
        id: fb.id,
        matchId: fb.matchId,
        authorId,
        authorRole: fb.authorRole,
        content: fb.content,
        createdAt: fb.createdAt,
      },
    });
    console.log(`Upserted feedback message: ${fb.id}`);
  }

  // Create questionnaires and questions
  console.log("Upserting questionnaires and questions...");
  for (const qData of DEMO_QUESTIONNAIRES) {
    const trainerId = upsertedUsers[qData.trainerKey]?.id;
    if (!trainerId) {
      throw new Error(`Trainer with key "${qData.trainerKey}" not found for questionnaire "${qData.id}"`);
    }

    await prisma.questionnaire.upsert({
      where: { id: qData.id },
      update: {
        title: qData.title,
        description: qData.description,
        status: qData.status,
        trainerId,
      },
      create: {
        id: qData.id,
        title: qData.title,
        description: qData.description,
        status: qData.status,
        trainerId,
      },
    });

    for (const quest of qData.questions) {
      await prisma.question.upsert({
        where: { id: quest.id },
        update: {
          questionnaireId: qData.id,
          text: quest.text,
          type: quest.type,
          options: quest.options,
          order: quest.order,
        },
        create: {
          id: quest.id,
          questionnaireId: qData.id,
          text: quest.text,
          type: quest.type,
          options: quest.options,
          order: quest.order,
        },
      });
    }
    console.log(`Upserted questionnaire: ${qData.title} and its questions`);
  }

  // Create questionnaire assignments
  console.log("Upserting questionnaire assignments...");
  for (const assign of DEMO_ASSIGNMENTS) {
    const playerId = upsertedUsers[assign.playerKey]?.id;
    if (!playerId) {
      throw new Error(`Player with key "${assign.playerKey}" not found for assignment "${assign.id}"`);
    }

    await prisma.questionnaireAssignment.upsert({
      where: { id: assign.id },
      update: {
        questionnaireId: assign.questionnaireId,
        playerId,
        status: assign.status,
        sentAt: assign.sentAt,
        reclaimedAt: assign.reclaimedAt,
        respondedAt: assign.respondedAt,
      },
      create: {
        id: assign.id,
        questionnaireId: assign.questionnaireId,
        playerId,
        status: assign.status,
        sentAt: assign.sentAt,
        reclaimedAt: assign.reclaimedAt,
        respondedAt: assign.respondedAt,
      },
    });
    console.log(`Upserted assignment: ${assign.id}`);
  }

  // Create answers
  console.log("Upserting answers...");
  for (const ans of DEMO_ANSWERS) {
    await prisma.answer.upsert({
      where: { id: ans.id },
      update: {
        assignmentId: ans.assignmentId,
        questionId: ans.questionId,
        value: ans.value,
      },
      create: {
        id: ans.id,
        assignmentId: ans.assignmentId,
        questionId: ans.questionId,
        value: ans.value,
      },
    });
    console.log(`Upserted answer: ${ans.id}`);
  }

  // Create player objectives
  console.log("Upserting player objectives...");
  for (const obj of DEMO_OBJECTIVES) {
    const playerId = upsertedUsers[obj.playerKey]?.id;
    const trainerId = upsertedUsers[obj.trainerKey]?.id;

    if (!playerId || !trainerId) {
      throw new Error(`Player "${obj.playerKey}" or Trainer "${obj.trainerKey}" not found for objective "${obj.id}"`);
    }

    await prisma.playerObjectives.upsert({
      where: { id: obj.id },
      update: {
        playerId,
        trainerId,
        summary: obj.summary,
        items: obj.items,
        effectiveFrom: obj.effectiveFrom,
        effectiveTo: obj.effectiveTo,
      },
      create: {
        id: obj.id,
        playerId,
        trainerId,
        summary: obj.summary,
        items: obj.items,
        effectiveFrom: obj.effectiveFrom,
        effectiveTo: obj.effectiveTo,
      },
    });
    console.log(`Upserted player objective: ${obj.id}`);
  }

  // Create notifications
  console.log("Upserting notifications...");
  for (const notif of DEMO_NOTIFICATIONS) {
    const recipientId = upsertedUsers[notif.recipientKey]?.id;
    if (!recipientId) {
      throw new Error(`Recipient with key "${notif.recipientKey}" not found for notification "${notif.id}"`);
    }

    await prisma.notification.upsert({
      where: { id: notif.id },
      update: {
        recipientId,
        type: notif.type,
        matchId: notif.matchId,
        assignmentId: notif.assignmentId,
        isRead: notif.isRead,
        createdAt: notif.createdAt,
      },
      create: {
        id: notif.id,
        recipientId,
        type: notif.type,
        matchId: notif.matchId,
        assignmentId: notif.assignmentId,
        isRead: notif.isRead,
        createdAt: notif.createdAt,
      },
    });
    console.log(`Upserted notification: ${notif.id}`);
  }

  console.log("Seeding complete successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
