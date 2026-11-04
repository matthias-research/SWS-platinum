import { defineConfig } from '@playwright/test';

const production = process.env.TEST_PRODUCTION === '1';
const deployedURL = process.env.TEST_BASE_URL;
export default defineConfig({
  testDir: './tests',
  use: { baseURL: deployedURL || `http://127.0.0.1:${production ? 5174 : 5173}`, browserName: 'chromium', channel: 'msedge' },
  webServer: deployedURL ? undefined : { command: production ? 'npm run preview -- --port 5174 --strictPort' : 'npm run dev -- --port 5173 --strictPort', url: `http://127.0.0.1:${production ? 5174 : 5173}`, reuseExistingServer: !process.env.CI },
});
