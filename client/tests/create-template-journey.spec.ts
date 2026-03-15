import { expect, test } from '@playwright/test';
import { API_BASE_URL } from './constants';

test.describe('Create template journey', () => {
  test.setTimeout(90_000);
  const timestamp = Date.now();
  const task = {
    description: `Test Task ${timestamp}`,
  };

  test.afterAll(async ({ request }) => {
    await request.delete(`${API_BASE_URL}/test/deleteTestTask`, {
      data: { description: task.description },
      failOnStatusCode: false,
    });
  });

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
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /Mitarbeiter/i })
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
    await expect(page.getByText(task.description)).toBeVisible();
  });
});
