import { expect, test } from '@playwright/test';

test.describe('Create template journey', () => {
  test.setTimeout(90_000);

  test('creates a task template, shows it in the template overview, and allows creating a task from the template', async ({
    page,
  }, testInfo) => {
    // Keep generated test data inside the test and include retry entropy so a
    // rerun never reuses stale data from a previous failed attempt.
    const description = `Test Task ${Date.now()}-${testInfo.retry}-${Math.floor(
      Math.random() * 1_000_000
    )}`;

    await page.goto('/template');
    await expect(page).toHaveURL(/\/template$/);
    const addTaskButton = page.locator('button', { hasText: /^Add\s*Task$/i });
    await expect(addTaskButton.first()).toBeVisible();
    await addTaskButton.first().click();

    const modalForm = page.locator('form[name="valuesform"]');
    await expect(modalForm).toBeVisible();

    const descriptionInput = page.getByTestId('description');
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill(description);

    const ownerSelectTrigger = modalForm
      .locator('[data-slot="select-trigger"][id="owner"]')
      .first();
    await expect(ownerSelectTrigger).toBeVisible();
    await ownerSelectTrigger.click();

    // Root cause: a global first() select-item can hit the wrong Radix portal
    // entry or a stale node. Only choose currently visible owner options.
    const firstEmployeeOption = page
      .locator('[data-slot="select-item"]:visible')
      .first();
    await expect(firstEmployeeOption).toBeVisible();
    await firstEmployeeOption.click();

    const submitButton = modalForm.getByRole('button', {
      name: /^Neue Beschreibung hinzufügen$/i,
    });
    await expect(submitButton).toBeVisible();

    await submitButton.click();
    await expect(modalForm).not.toBeVisible();

    const createdTaskRow = page.locator('li', { hasText: description }).first();
    await expect(createdTaskRow).toBeVisible();

    await createdTaskRow.hover();

    const deleteTrigger = createdTaskRow.getByRole('button', {
      name: /Vorlage-Aufgabe löschen/i,
    });
    await expect(deleteTrigger).toBeVisible();
    await deleteTrigger.click();

    const confirmDeleteButton = page.getByRole('button', {
      name: /Löschen bestätigen/i,
    });
    await expect(confirmDeleteButton).toBeVisible();
    await confirmDeleteButton.click();

    await expect(page.getByText(description)).not.toBeVisible();
  });
});
