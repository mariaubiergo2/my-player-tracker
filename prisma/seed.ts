import { PrismaClient, UserRole, MatchStatus, MatchType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding started...");

  // Clear existing matches and users to avoid unique email violations or duplicate keys
  console.log("Cleaning database...");
  await prisma.match.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Creating default users...");
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash("adminpassword", saltRounds);
  const trainerPassword = await bcrypt.hash("trainerpassword", saltRounds);
  const playerPassword = await bcrypt.hash("playerpassword", saltRounds);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@tracker.com",
      password: adminPassword,
      name: "Admin",
      surname: "User",
      role: UserRole.ADMIN,
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // 2. Create Trainer
  const trainer = await prisma.user.create({
    data: {
      email: "trainer@tracker.com",
      password: trainerPassword,
      name: "Trainer",
      surname: "User",
      role: UserRole.TRAINER,
      phone: "+34 600 000 001",
    },
  });
  console.log(`Created trainer: ${trainer.email}`);

  // 3. Create Player
  const player = await prisma.user.create({
    data: {
      email: "player@tracker.com",
      password: playerPassword,
      name: "Player",
      surname: "User",
      role: UserRole.PLAYER,
      phone: "+34 600 000 002",
    },
  });
  console.log(`Created player: ${player.email}`);

  // 4. Create some Matches
  console.log("Creating sample matches...");
  const match1 = await prisma.match.create({
    data: {
      name: "League Match vs Real Madrid",
      description: "Tough match at home stadium",
      location: "Metropolitano",
      date: new Date(),
      startTime: "18:00",
      endTime: "19:45",
      opponent: "Real Madrid",
      matchType: MatchType.LEAGUE,
      status: MatchStatus.COMPLETED,
      playerId: player.id,
      trainerId: trainer.id,
      mark: 8,
      intensity: 9,
      attitude: 10,
      performance: 8,
      goals: 1,
      assists: 1,
      minutesPlayed: 90,
      strengths: ["Great positioning", "Assisted the winning goal"],
      weaknesses: ["A bit tired in the last 10 minutes"],
      improvementAreas: ["Aerobic capacity"],
      isReviewed: true,
      reviewedAt: new Date(),
    },
  });

  const match2 = await prisma.match.create({
    data: {
      name: "Friendly Match vs Getafe",
      description: "Training friendly game",
      location: "Getafe Training Camp",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      startTime: "11:00",
      endTime: "12:30",
      opponent: "Getafe CF",
      matchType: MatchType.FRIENDLY,
      status: MatchStatus.SCHEDULED,
      playerId: player.id,
      trainerId: trainer.id,
    },
  });

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
