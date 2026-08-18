// scripts/setup-test-db.js
const { Client } = require('pg');

// We connect to the default 'postgres' database since 'my_player_tracker_test' might not exist yet.
const connectionString = "postgres://postgres:postgres@localhost:5432/postgres";
const dbName = "my_player_tracker_test";

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // Check if database exists
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    
    if (res.rows.length === 0) {
      console.log(`Database '${dbName}' does not exist. Creating...`);
      // CREATE DATABASE cannot be parameterized, so we interpolate our safe hardcoded DB name
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (error) {
    console.error("Error setting up test database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
