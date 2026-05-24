import { expect, test } from '@playwright/test';
import { Buffer } from 'buffer';
import { createWorkerFixture } from './fixtures/test-workers';
import {
  fillWorkerForm,
  getWorkerRow,
  openWorkerDetailFromRow,
} from './utils/create-worker-journey.utils';

const PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';
const TEST_FILE_NAME = 'test-upload.png';

test.describe('Onboarding worker view journey', () => {
  test.setTimeout(90_000);

  test('creates a worker, opens the detail view, uploads and deletes a file, then deletes the worker', async ({
    page,
    browserName,
  }, testInfo) => {
    const uniqueSeed = `${browserName}-${testInfo.workerIndex}-${Math.floor(
      Math.random() * 1_000_000
    )}`;
    const worker = createWorkerFixture(uniqueSeed);

    await page.goto('/worker-lifycycle');
    await expect(page).toHaveURL(/\/worker-lifycycle$/);

    await page
      .getByRole('button', { name: /^Hinzufügen$/i })
      .first()
      .click();

    await page.locator('#radio-onboarding').click();

    await expect(
      page.getByRole('heading', { name: /Eingabe Onboarding/i })
    ).toBeVisible();

    await fillWorkerForm(page, worker);
    await page
      .locator('aside')
      .getByRole('button', { name: /^Hinzufügen$/i })
      .click();

    const workerRow = getWorkerRow(page, worker.firstName);
    await expect(workerRow).toHaveCount(1, { timeout: 15_000 });
    await expect(workerRow).toBeVisible({ timeout: 15_000 });

    await openWorkerDetailFromRow(page, workerRow);
    await expect(page).toHaveURL(/\/user\/[^/]+/);
    await expect(page.getByRole('tab', { name: 'Aufgaben' })).toBeVisible();

    await page.getByRole('tab', { name: 'Dateien' }).click();

    await page.getByTestId('open-file-upload').click();
    await expect(
      page.getByRole('button', { name: /Hochladen$/i })
    ).toBeVisible();

    const fileBuffer = Buffer.from(PNG_B64, 'base64');

    await page.locator('#fileUpload').setInputFiles({
      name: TEST_FILE_NAME,
      mimeType: 'image/png',
      buffer: fileBuffer,
    });

    const uploadResponse = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        /\/worker\/[^/]+\/files\b/.test(res.url()) &&
        res.status() >= 200 &&
        res.status() < 300,
      { timeout: 60_000 }
    );

    await page.getByRole('button', { name: /^Hochladen$/i }).click();
    await uploadResponse;

    await expect(page.getByRole('dialog')).not.toBeVisible({
      timeout: 30_000,
    });

    await expect(
      page.getByRole('button', { name: `${TEST_FILE_NAME} löschen` })
    ).toBeVisible({ timeout: 15_000 });

    await page
      .getByRole('button', { name: `${TEST_FILE_NAME} löschen` })
      .click();

    await expect(page.getByText(TEST_FILE_NAME)).not.toBeVisible({
      timeout: 15_000,
    });

    await page.goto('/worker-lifycycle');
    await expect(page).toHaveURL(/\/worker-lifycycle$/);

    const createdWorkerRow = getWorkerRow(page, worker.firstName);
    await expect(createdWorkerRow).toHaveCount(1, { timeout: 15_000 });
    await expect(createdWorkerRow).toBeVisible({ timeout: 15_000 });

    await createdWorkerRow.hover();
    await createdWorkerRow.getByRole('button', { name: /Auswählen/i }).click();

    await page
      .getByRole('button', { name: /Ausgewählte Aufgaben löschen/i })
      .click();

    await expect(createdWorkerRow).toHaveCount(0, { timeout: 15_000 });
  });
});
