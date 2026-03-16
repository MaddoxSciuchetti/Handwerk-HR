import { Locator, Page, expect } from '@playwright/test';
import { WorkerFixture } from '../types';

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getWorkerRow = (page: Page, fullName: string): Locator =>
  page
    .getByRole('row')
    .filter({
      has: page.getByRole('cell', {
        name: new RegExp(`${escapeRegExp(fullName)}\\s*Anschauen`),
      }),
    })
    .filter({ has: page.getByRole('cell', { name: /^\s*Onboarding\s*$/ }) });

export const clickViewButton = async (page: Page, workerRow: Locator) => {
  const viewButton = workerRow.getByRole('button', { name: /Anschauen/i });

  await workerRow.scrollIntoViewIfNeeded();
  await expect(workerRow).toHaveCount(1);
  await expect(workerRow).toBeVisible({ timeout: 30_000 });

  const rowBox = await workerRow.boundingBox();
  if (!rowBox) {
    throw new Error('Worker row is rendered but has no bounding box.');
  }

  await page.mouse.move(
    rowBox.x + rowBox.width / 2,
    rowBox.y + rowBox.height / 2
  );

  await expect(viewButton).toBeVisible({ timeout: 10_000 });

  try {
    await viewButton.click({ noWaitAfter: true, timeout: 5_000 });
  } catch {
    await viewButton.dispatchEvent('click');
  }

  await expect(page).toHaveURL(/\/user\/\d+/, { timeout: 30_000 });
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
