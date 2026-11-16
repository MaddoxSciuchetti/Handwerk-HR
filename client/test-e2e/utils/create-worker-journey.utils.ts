import { Locator, Page, expect } from '@playwright/test';
import { WorkerFixture } from '../types';

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Current lifecycle list renders `TableRow` with the full name in a span. */
export const getWorkerRow = (page: Page, fullName: string): Locator =>
  page.getByRole('row').filter({
    hasText: new RegExp(escapeForRegex(fullName)),
  });

export const openWorkerDetailFromRow = async (
  page: Page,
  workerRow: Locator
) => {
  await workerRow.scrollIntoViewIfNeeded();
  await expect(workerRow).toHaveCount(1);
  await expect(workerRow).toBeVisible({ timeout: 30_000 });
  await workerRow.click();
  await expect(page).toHaveURL(/\/user\/[^/]+/, { timeout: 30_000 });
};

/** Fast-track onboarding: name or email + Anlegen (no full form / radio chooser). */
export const createWorkerViaFastTrack = async (
  page: Page,
  worker: WorkerFixture
) => {
  await page
    .getByRole('button', { name: /^Hinzufügen$/i })
    .first()
    .click();

  const nameInput = page.getByPlaceholder('Name oder E-Mail');
  await expect(nameInput).toBeVisible({ timeout: 15_000 });
  await nameInput.fill(worker.fullName);
  await page.getByRole('button', { name: /^Anlegen$/i }).click();

  await expect(page.getByText('Mitarbeiter angelegt')).toBeVisible({
    timeout: 15_000,
  });

  // Creating a worker opens the questionnaire send dialog — dismiss it.
  const closeQuestionnaire = page.getByRole('button', {
    name: /^Schließen$/i,
  });
  if (await closeQuestionnaire.isVisible().catch(() => false)) {
    await closeQuestionnaire.click();
  }
};
