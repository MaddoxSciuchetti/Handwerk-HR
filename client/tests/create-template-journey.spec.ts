import { expect, test } from '@playwright/test';

test.describe('Create template journey', () => {
  test.setTimeout(90_000);
  const timestamp = Date.now();
  const task = {
    description: `Test Task ${timestamp}`,
  };

  test('creates a task template, shows it in the template overview, and allows creating a task from the template', async ({
    page,
  }) => {
    await page.goto('/template');
    await expect(page).toHaveURL(/\/template$/);
    const addTaskButton = page.locator('button', { hasText: /^Add\s*Task$/i });
    await expect(addTaskButton.first()).toBeVisible();
    await addTaskButton.first().click();

    const modalForm = page.locator('form[name="valuesform"]');
    await expect(modalForm).toBeVisible();

    const descriptionInput = page.getByTestId('description');
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill(task.description);

    const ownerSelectTrigger = modalForm
      .locator('[data-slot="select-trigger"][id="owner"]')
      .first();
    await expect(ownerSelectTrigger).toBeVisible();
    await ownerSelectTrigger.click();

    const firstEmployeeOption = page
      .locator('[data-slot="select-item"]')
      .first();
    await expect(firstEmployeeOption).toBeVisible();
    await firstEmployeeOption.click();
    await page
      .getByRole('button', { name: /Neue Beschreibung hinzufügen/i })
      .click();
    await expect(modalForm).not.toBeVisible();

    const createdTaskRow = page
      .locator('li', { hasText: task.description })
      .first();
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

    await expect(page.getByText(task.description)).not.toBeVisible();
  });
});
