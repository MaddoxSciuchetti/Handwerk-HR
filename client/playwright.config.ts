import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const authStatePath = path.resolve(
  __dirname,
  'test-e2e/playwright/.auth/session.json'
);
const authenticatedJourneyMatch =
  /(?:create-employee-journey|create-worker-journey|create-template-journey)\.spec\.ts/;

export default defineConfig({
  testDir: './test-e2e',
  globalTeardown: './test-e2e/utils/user-cleanup.ts',
  testMatch: ['**/*.spec.ts', '**/auth.setup.ts'],
  testIgnore: ['**/unit/**'],
  tsconfig: './tsconfig.playwright.json',
  workers: 3,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      timeout: 120_000,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [
        '**/auth.setup.ts',
        '**/create-employee-journey.spec.ts',
        '**/create-worker-journey.spec.ts',
        '**/create-template-journey.spec.ts',
      ],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: [
        '**/auth.setup.ts',
        '**/create-employee-journey.spec.ts',
        '**/create-worker-journey.spec.ts',
        '**/create-template-journey.spec.ts',
      ],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: [
        '**/auth.setup.ts',
        '**/create-employee-journey.spec.ts',
        '**/create-worker-journey.spec.ts',
        '**/create-template-journey.spec.ts',
      ],
    },
    {
      name: 'authenticated-chromium',
      testMatch: authenticatedJourneyMatch,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath,
      },
    },
    {
      name: 'authenticated-firefox',
      testMatch: authenticatedJourneyMatch,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: authStatePath,
      },
    },
    {
      name: 'authenticated-webkit',
      testMatch: authenticatedJourneyMatch,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Safari'],
        storageState: authStatePath,
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
  },
});
