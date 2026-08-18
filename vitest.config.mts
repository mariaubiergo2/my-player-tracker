import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import fs from 'fs';
import path from 'path';

// Parse .env.test manually if it exists to populate vitest env
const envTestPath = path.resolve(__dirname, '.env.test');
const envTest: Record<string, string> = {};
if (fs.existsSync(envTestPath)) {
  const fileContent = fs.readFileSync(envTestPath, 'utf-8');
  fileContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const indexOfEq = trimmed.indexOf('=');
      if (indexOfEq !== -1) {
        const key = trimmed.slice(0, indexOfEq).trim();
        let val = trimmed.slice(indexOfEq + 1).trim();
        // Remove quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envTest[key] = val;
      }
    }
  });
}

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    setupFiles: ['./lib/__tests__/setup.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    env: {
      JWT_SECRET: 'super_secret_key_that_is_at_least_32_characters_long',
      AUTH_TOKEN_EXPIRY_HOURS: '24',
      ...envTest,
    }
  },
});
