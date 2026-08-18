// scripts/test-db-migrate.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const envTestPath = path.resolve(__dirname, '..', '.env.test');
let databaseUrl = "postgres://postgres:postgres@localhost:5432/my_player_tracker_test";

if (fs.existsSync(envTestPath)) {
  const content = fs.readFileSync(envTestPath, 'utf-8');
  const match = content.match(/DATABASE_URL=["']?([^"'\n\r]+)["']?/);
  if (match && match[1]) {
    databaseUrl = match[1].trim();
  }
}

console.log(`Running Prisma migrations against test database (${databaseUrl})...`);
try {
  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl
    },
    stdio: 'inherit'
  });
  console.log(`Prisma migrations deployed successfully to test database.`);
} catch (error) {
  console.error(`Failed to deploy migrations to test database:`, error);
  process.exit(1);
}
