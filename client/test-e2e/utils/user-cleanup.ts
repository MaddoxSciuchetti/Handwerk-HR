import type { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { API_BASE_URL } from '../constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const teardownMarkerPath = path.resolve(
  __dirname,
  '../playwright/.auth/teardown-user.json'
);

type TeardownPayload = { email: string };

async function globalTeardown(_config: FullConfig): Promise<void> {
  if (!fs.existsSync(teardownMarkerPath)) return;

  let email: string;
  try {
    email = (
      JSON.parse(fs.readFileSync(teardownMarkerPath, 'utf8')) as TeardownPayload
    ).email;
  } catch {
    fs.unlinkSync(teardownMarkerPath);
    return;
  }

  await fetch(`${API_BASE_URL}/test/deleteTestUser`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).catch(() => {});

  fs.unlinkSync(teardownMarkerPath);
}

export default globalTeardown;
