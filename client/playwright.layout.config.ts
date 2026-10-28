import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test-e2e',
  testMatch: 'worker-table-layout.spec.ts',
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5173', ...devices['Desktop Chrome'] },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
