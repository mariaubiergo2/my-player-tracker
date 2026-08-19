/* eslint-disable */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
}

run();
