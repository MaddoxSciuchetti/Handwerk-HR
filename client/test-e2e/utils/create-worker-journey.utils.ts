import { Locator, Page, expect } from '@playwright/test';
import { WorkerFixture } from '../types';

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const getWorkerRow = (page: Page, firstName: string): Locator =>
  page.locator('div.flex.items-center.relative.group').filter({
    has: page.locator('p.typo-body-base', {
      hasText: new RegExp(`^${escapeForRegex(firstName)}$`),
    }),
  });

export const openWorkerDetailFromRow = async (
  page: Page,
  workerRow: Locator
) => {
  await workerRow.scrollIntoViewIfNeeded();
  await expect(workerRow).toHaveCount(1);
  await expect(workerRow).toBeVisible({ timeout: 30_000 });
  await workerRow.locator('p.typo-body-base').click();
  await expect(page).toHaveURL(/\/user\/[^/]+/, { timeout: 30_000 });
};

export const fillWorkerForm = async (page: Page, worker: WorkerFixture) => {
  await page.getByPlaceholder('Vorname').fill(worker.firstName);
  await page.getByPlaceholder('Nachname').fill(worker.lastName);
  await page.getByPlaceholder('Email').fill(worker.email);
  await page.getByPlaceholder('Geburtsdatum DD.MM.YYYY').fill(worker.birthDate);
  await page.getByPlaceholder('Adresse').fill(worker.address);
  await page
    .getByPlaceholder('Eintrittsdatum DD.MM.YYYY')
    .fill(worker.entryDate);
  await page.getByPlaceholder('Position').fill(worker.position);
};
