import { PrismaClient, UserRole, MatchType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";
import { SEED_USERS } from "./seed-data/credentials";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding started...");

  console.log("Upserting users...");
  const saltRounds = 10;
  const upsertedUsers: Record<string, any> = {};

  for (const seedUser of SEED_USERS) {
    const hashedPassword = await bcrypt.hash(seedUser.password || "", saltRounds);

    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {
        name: seedUser.name,
        surname: seedUser.surname,
        role: seedUser.role,
        phone: seedUser.phone || null,
        password: hashedPassword,
      },
      create: {
        id: seedUser.id,
        email: seedUser.email,
        name: seedUser.name,
        surname: seedUser.surname,
        role: seedUser.role,
        password: hashedPassword,
        phone: seedUser.phone || null,
      },
    });
    console.log(`Upserted user: ${user.email} (Role: ${user.role})`);
    upsertedUsers[seedUser.key] = user;
  }

  // Connect trainer <-> player / goalkeeper relations according to trainerKeys
  console.log("Connecting trainers and players...");
  for (const seedUser of SEED_USERS) {
    if (seedUser.trainerKeys && seedUser.trainerKeys.length > 0) {
      const trainerIds = seedUser.trainerKeys
        .map((key) => upsertedUsers[key]?.id)
        .filter(Boolean) as string[];

      if (trainerIds.length > 0) {
        await prisma.user.update({
          where: { id: upsertedUsers[seedUser.key].id },
          data: {
            trainers: {
              connect: trainerIds.map((id) => ({ id })),
            },
          },
        });
        console.log(`Connected user ${seedUser.email} to trainers: ${seedUser.trainerKeys.join(", ")}`);
      }
    }
  }

  // Create some Matches
  console.log("Upserting sample matches...");
  const trainer = upsertedUsers["trainer"];
  const player = upsertedUsers["player"];

  if (!player || !trainer) {
    throw new Error("Required player or trainer not found in seeded users");
  }

  const match1 = await prisma.match.upsert({
    where: { id: "seed-match-league-real-madrid" },
    update: {
      name: "League Match vs Real Madrid",
      description: "Tough match at home stadium",
      location: "Metropolitano",
      isHome: true,
      matchUrl: "https://www.youtube.com/watch?v=mock1",
      kitColor: "Red",
      shirtNumber: "10",
      position: "Midfielder",
      minutesPlayed: "90",
      date: new Date(),
      startTime: "18:00",
      endTime: "19:45",
      opponent: "Real Madrid",
      category: "First Team",
      leaguePosition: "2nd",
      matchType: MatchType.LEAGUE,
      competitionType: "La Liga",
      playerId: player.id,
      trainerId: trainer.id,
      teamId: "team_001",
      mark: 8,
      intensity: 9,
      attitude: 10,
      performance: 8,
      goals: 1,
      assists: 1,
      strengths: ["Great positioning", "Assisted the winning goal"],
      weaknesses: ["A bit tired in the last 10 minutes"],
      improvementAreas: ["Aerobic capacity"],
      isReviewed: true,
      reviewedAt: new Date(),
    },
    create: {
      id: "seed-match-league-real-madrid",
      name: "League Match vs Real Madrid",
      description: "Tough match at home stadium",
      location: "Metropolitano",
      isHome: true,
      matchUrl: "https://www.youtube.com/watch?v=mock1",
      kitColor: "Red",
      shirtNumber: "10",
      position: "Midfielder",
      minutesPlayed: "90",
      date: new Date(),
      startTime: "18:00",
      endTime: "19:45",
      opponent: "Real Madrid",
      category: "First Team",
      leaguePosition: "2nd",
      matchType: MatchType.LEAGUE,
      competitionType: "La Liga",
      playerId: player.id,
      trainerId: trainer.id,
      teamId: "team_001",
      mark: 8,
      intensity: 9,
      attitude: 10,
      performance: 8,
      goals: 1,
      assists: 1,
      strengths: ["Great positioning", "Assisted the winning goal"],
      weaknesses: ["A bit tired in the last 10 minutes"],
      improvementAreas: ["Aerobic capacity"],
      isReviewed: true,
      reviewedAt: new Date(),
    },
  });
  console.log(`Upserted match 1: ${match1.name}`);

  const match2 = await prisma.match.upsert({
    where: { id: "seed-match-friendly-getafe" },
    update: {
      name: "Friendly Match vs Getafe",
      description: "Training friendly game",
      location: "Getafe Training Camp",
      isHome: false,
      matchUrl: "https://www.youtube.com/watch?v=mock2",
      kitColor: "White",
      shirtNumber: "14",
      position: "Sub",
      minutesPlayed: "30",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      startTime: "11:00",
      endTime: "12:30",
      opponent: "Getafe CF",
      category: "First Team",
      leaguePosition: "2nd",
      matchType: MatchType.FRIENDLY,
      competitionType: "Friendly",
      playerId: player.id,
      trainerId: trainer.id,
      teamId: "team_001",
    },
    create: {
      id: "seed-match-friendly-getafe",
      name: "Friendly Match vs Getafe",
      description: "Training friendly game",
      location: "Getafe Training Camp",
      isHome: false,
      matchUrl: "https://www.youtube.com/watch?v=mock2",
      kitColor: "White",
      shirtNumber: "14",
      position: "Sub",
      minutesPlayed: "30",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      startTime: "11:00",
      endTime: "12:30",
      opponent: "Getafe CF",
      category: "First Team",
      leaguePosition: "2nd",
      matchType: MatchType.FRIENDLY,
      competitionType: "Friendly",
      playerId: player.id,
      trainerId: trainer.id,
      teamId: "team_001",
    },
  });
  console.log(`Upserted match 2: ${match2.name}`);

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

