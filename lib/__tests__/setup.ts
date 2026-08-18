import { prisma } from "../prisma";
import { beforeAll, beforeEach, afterAll } from "vitest";

beforeAll(() => {
  // Validate database URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not defined in the test environment!");
  }

  // Double check safeguard:
  // Must contain "test" AND database name must be exactly "my_player_tracker_test"
  try {
    const url = new URL(dbUrl);
    const dbName = url.pathname.substring(1); // removes the leading '/'
    if (!dbUrl.includes("test") || dbName !== "my_player_tracker_test") {
      throw new Error(`CRITICAL: Attempted to run tests against an invalid/unsafe database name: "${dbName}". Database name must be exactly "my_player_tracker_test". URL: ${dbUrl}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("CRITICAL:")) {
      throw err;
    }
    // URL parsing failed (e.g. if it uses a custom connection string protocol or format)
    // Fallback to strict substring matching
    if (!dbUrl.includes("test") || !dbUrl.endsWith("/my_player_tracker_test")) {
      throw new Error(`CRITICAL: Attempted to run tests against a potentially unsafe database URL: "${dbUrl}". It must end with "/my_player_tracker_test".`);
    }
  }
});

beforeEach(async () => {
  // Truncate tables to ensure isolated state
  // We query all public tables in PostgreSQL except for _prisma_migrations
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
  `;

  for (const { tablename } of tablenames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
  }
});

afterAll(async () => {
  // Close database connections after all tests are done
  await prisma.$disconnect();
});
