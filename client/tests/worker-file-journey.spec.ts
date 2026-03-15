import { expect, test } from '@playwright/test';
import { createWorkerFixture } from './fixtures/test-workers';
import {
  clickViewButton,
  fillWorkerForm,
  getWorkerRow,
} from './utils/create-worker-journey.utils';

const PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';
const TEST_FILE_NAME = 'test-upload.png';

test.describe('Worker file upload journey', () => {
  test.setTimeout(90_000);

  const worker = createWorkerFixture();

  test('creates a worker, uploads a file, asserts it appears, deletes the file, then cleans up the worker', async ({
    page,
  }) => {
    await page.goto('/worker-lifycycle');
    await expect(page).toHaveURL(/\/worker-lifycycle$/);

    await page.getByRole('button', { name: /Handwerker hinzufügen/i }).click();
    await page.locator('label', { hasText: 'Onboarding' }).click();

    await expect(
      page.getByRole('heading', { name: /Eingabe Onboarding/i })
    ).toBeVisible();

    await fillWorkerForm(page, worker);
    await page.getByRole('button', { name: /^Hinzufügen$/i }).click();

    const workerRow = getWorkerRow(page, worker.fullName);
    await expect(workerRow).toBeVisible();

    await clickViewButton(page, workerRow);

    await expect(
      page.locator('header').getByText(worker.fullName, { exact: true })
    ).toBeVisible();

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

    await page.getByRole('button', { name: /Hochladen$/i }).click();

    await expect(
      page.getByRole('button', { name: /Hochladen$/i })
    ).not.toBeVisible({ timeout: 30_000 });

    await expect(page.getByText(TEST_FILE_NAME)).toBeVisible({
      timeout: 15_000,
    });

    await page
      .getByRole('button', { name: `${TEST_FILE_NAME} löschen` })
      .click();

    await expect(page.getByText(TEST_FILE_NAME)).not.toBeVisible({
      timeout: 15_000,
    });

    await page.goBack();
    await expect(page).toHaveURL(/\/worker-lifycycle$/);

    const createdWorkerRow = getWorkerRow(page, worker.fullName);
    await expect(createdWorkerRow).toBeVisible();

    const actionsTrigger = createdWorkerRow.getByRole('button', {
      name: /Löschen Aktionen öffnen/i,
    });
    await expect(actionsTrigger).toBeVisible();
    await actionsTrigger.click();

    const deleteMenuItem = page.getByRole('menuitem', { name: /Löschen/i });
    await expect(deleteMenuItem).toBeVisible();
    await deleteMenuItem.click();

    await expect(createdWorkerRow).not.toBeVisible();
  });
});
