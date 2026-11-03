import { defineConfig } from '@playwright/test';

const production = process.env.TEST_PRODUCTION === '1';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: `http://127.0.0.1:${production ? 5174 : 5173}`, browserName: 'chromium', channel: 'msedge' },
  webServer: { command: production ? 'npm run preview -- --port 5174 --strictPort' : 'npm run dev -- --port 5173 --strictPort', url: `http://127.0.0.1:${production ? 5174 : 5173}`, reuseExistingServer: !process.env.CI },
});
