import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    env: {
      JWT_SECRET: 'super_secret_key_that_is_at_least_32_characters_long',
      AUTH_TOKEN_EXPIRY_HOURS: '24'
    }
  },
});
