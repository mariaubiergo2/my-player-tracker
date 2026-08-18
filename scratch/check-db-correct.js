require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
    }
  });
  console.log("=== Users in DB ===");
  console.log(users);
  await prisma.$disconnect();
  await pool.end();
}

run();
