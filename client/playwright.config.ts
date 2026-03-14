import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const authStatePath = path.resolve(__dirname, 'playwright/.auth/chef.json');

export default defineConfig({
  testDir: './tests',
  tsconfig: './tsconfig.playwright.json',
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/auth.setup.ts', '**/create-employee-journey.spec.ts'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: ['**/auth.setup.ts', '**/create-employee-journey.spec.ts'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: ['**/auth.setup.ts', '**/create-employee-journey.spec.ts'],
    },
    {
      name: 'authenticated-chromium',
      testMatch: /create-employee-journey\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath,
      },
    },
    {
      name: 'authenticated-firefox',
      testMatch: /create-employee-journey\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: authStatePath,
      },
    },
    {
      name: 'authenticated-webkit',
      testMatch: /create-employee-journey\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Safari'],
        storageState: authStatePath,
      },
    },
  ],

  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:5173',
  },
});
